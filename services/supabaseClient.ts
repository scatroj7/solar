
import { createClient } from '@supabase/supabase-js';

// Geliştirici Ortamı (Hardcoded):
const DEV_SUPABASE_URL = "https://tjbcphwvmsycusggcprx.supabase.co";
const DEV_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYmNwaHd2bXN5Y3VzZ2djcHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NDA2NTYsImV4cCI6MjA4MTAxNjY1Nn0.XwbND1qOgl582J-nPb8cdxxVdmJM2VykMl8kjr64P7g";

// Production (Vercel) önceliği varsa onu kullan, yoksa hardcoded değerleri kullan
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || DEV_SUPABASE_URL;
const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_KEY || DEV_SUPABASE_KEY;

// Eğer URL veya Key yoksa null döner (LocalStorage fallback için)
export const supabase = (SUPABASE_URL && SUPABASE_KEY) 
    ? createClient(SUPABASE_URL, SUPABASE_KEY) 
    : null;
