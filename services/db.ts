import { supabase } from './supabaseClient';
import { Lead, LeadStatus } from '../types';

const LOCAL_STORAGE_KEY = 'solarsmart_leads_backup';

export const DB = {
    // Tüm Leadleri Getir (Admin Paneli İçin)
    async getAllLeads(): Promise<Lead[]> {
        if (supabase) {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error("Supabase Read Error:", JSON.stringify(error, null, 2));
            }
            
            if (data) {
                // Map snake_case (DB) -> camelCase (App)
                return data.map((row: any) => ({
                    id: row.id,
                    fullName: row.full_name || row.fullName, // Fallback for robustness
                    phone: row.phone,
                    email: row.email,
                    city: row.city,
                    systemSize: row.system_size || row.systemSize,
                    estimatedCost: row.estimated_cost || row.estimatedCost,
                    billAmount: row.bill_amount || row.billAmount,
                    roofArea: row.roof_area || row.roofArea,
                    status: row.status,
                    createdAt: row.created_at || row.createdAt,
                    // input_data kolonu yoksa undefined döner, uygulama bunu handle etmeli
                    inputData: typeof row.input_data === 'string' ? JSON.parse(row.input_data) : (row.input_data || row.inputData || undefined)
                })) as Lead[];
            }
        }
        
        // Fallback
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        return local ? JSON.parse(local) : [];
    },

    // Yeni Lead Oluştur (Form Submit)
    async createLead(lead: Omit<Lead, 'id' | 'createdAt' | 'status'>): Promise<Lead | null> {
        // Prepare payload for Supabase (snake_case columns)
        // DİKKAT: 'input_data' kolonu Supabase 'leads' tablosunda JSON tipinde OLMALIDIR.
        // Aksi takdirde "Raporu Görüntüle" linki çalışmaz.
        const dbPayload = {
            full_name: lead.fullName,
            phone: lead.phone,
            email: lead.email,
            city: lead.city,
            system_size: lead.systemSize,
            estimated_cost: lead.estimatedCost,
            bill_amount: lead.billAmount,
            roof_area: lead.roofArea,
            status: 'New',
            input_data: lead.inputData 
        };

        if (supabase) {
            const { data, error } = await supabase
                .from('leads')
                .insert([dbPayload])
                .select()
                .single();

            if (error) {
                console.error("Supabase Write Error:", JSON.stringify(error, null, 2));
                // Hata olsa bile kullanıcıyı mağdur etmemek için aşağıda LocalStorage'a da yazacağız.
            } else if (data) {
                // Başarılı olursa Supabase verisini döndür
                return {
                    id: data.id,
                    fullName: data.full_name,
                    phone: data.phone,
                    email: data.email,
                    city: data.city,
                    systemSize: data.system_size,
                    estimatedCost: data.estimated_cost,
                    billAmount: data.bill_amount,
                    roofArea: data.roof_area,
                    status: data.status,
                    createdAt: data.created_at,
                    inputData: lead.inputData
                } as Lead;
            }
        }

        // Fallback: Local Storage (Supabase yoksa veya hata verdiyse)
        // Bu modda üretilen ID'ler URL'de çalışmayabilir (çünkü URL supabase'den çekmeye çalışır),
        // ama en azından veri kaybolmaz.
        console.warn("Using LocalStorage fallback due to Supabase unavailability or error.");
        
        const tempId = 'local_' + Math.random().toString(36).substr(2, 9);
        const finalLead = { 
            ...lead,
            status: 'New' as LeadStatus,
            id: tempId, 
            createdAt: new Date().toISOString(),
        } as Lead;

        const current = await DB.getAllLeads();
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([finalLead, ...current]));
        
        return finalLead; 
    },

    // ID ile Tekil Lead Getir (Rapor Sayfası İçin)
    async getLeadById(id: string): Promise<Lead | null> {
        // ID kontrolü (UUID mi?)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        
        if (supabase && !id.startsWith('local_')) {
            if (!isUUID) {
                console.warn("Invalid ID format for Supabase query:", id);
                return null;
            }

            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) {
                 console.error("Supabase GetById Error:", JSON.stringify(error, null, 2));
                 return null;
            }

            if (data) {
                return {
                    id: data.id,
                    fullName: data.full_name || data.fullName,
                    phone: data.phone,
                    email: data.email,
                    city: data.city,
                    systemSize: data.system_size || data.systemSize,
                    estimatedCost: data.estimated_cost || data.estimatedCost,
                    billAmount: data.bill_amount || data.billAmount,
                    roofArea: data.roof_area || data.roofArea,
                    status: data.status,
                    createdAt: data.created_at || data.createdAt,
                    // Parse JSON if needed
                    inputData: typeof data.input_data === 'string' ? JSON.parse(data.input_data) : (data.input_data || data.inputData)
                } as Lead;
            }
        }

        const local = await DB.getAllLeads();
        return local.find(l => l.id === id) || null;
    },

    // Durum Güncelle (Admin)
    async updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
        if (supabase && !id.startsWith('local_')) {
            const { error } = await supabase.from('leads').update({ status }).eq('id', id);
            if (error) console.error("Update Error:", JSON.stringify(error));
        } else {
            const local = await DB.getAllLeads();
            const updated = local.map(l => l.id === id ? { ...l, status } : l);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        }
    }
};