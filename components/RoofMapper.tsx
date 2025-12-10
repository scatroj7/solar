
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleMap, LoadScript, Autocomplete, DrawingManager } from '@react-google-maps/api';
import { Button, Card, CardContent, Input } from './ui/UIComponents';
import { Search, MapPin, Check, RefreshCw, AlertTriangle, Edit3, Globe, AlertCircle, Copy, Navigation } from 'lucide-react';

declare var google: any;
declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

interface RoofMapperProps {
  apiKey: string;
  onComplete: (data: { area: number; coordinates: { lat: number; lng: number }; locationName?: string }) => void;
}

const libraries: ("places" | "drawing" | "geometry")[] = ["places", "drawing", "geometry"];

// Default Center (Turkey Center approx) defined outside to avoid recreation
const DEFAULT_CENTER_COORDS = { lat: 39.93, lng: 32.85 };

export const RoofMapper: React.FC<RoofMapperProps> = ({ apiKey, onComplete }) => {
  // Check if we have a real key or a placeholder
  const hasValidKey = apiKey && apiKey !== "YOUR_GOOGLE_MAPS_API_KEY";
  
  const [map, setMap] = useState<any | null>(null);
  const [autocomplete, setAutocomplete] = useState<any | null>(null);
  const [roofArea, setRoofArea] = useState<number>(0);
  const [drawingMode, setDrawingMode] = useState<any | null>(null);
  const [addressSelected, setAddressSelected] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<string>(''); // NEW: Store friendly location name
  
  // FIX 1: Manage Map Center via State to prevent reset on re-render
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER_COORDS);
  
  const polygonRef = useRef<any | null>(null);
  
  // Manual Mode State
  const [manualMode, setManualMode] = useState(!hasValidKey);
  const [manualAreaInput, setManualAreaInput] = useState<string>('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');

  // FIX 2: Update manual mode logic. 
  useEffect(() => {
      if (hasValidKey && !apiError) {
          setManualMode(false);
      } else if (!hasValidKey) {
          setManualMode(true);
      }
      
      if (typeof window !== 'undefined') {
          setCurrentUrl(window.location.href);
      }
  }, [hasValidKey, apiError]);

  // Robustly handle Google Maps Auth Failure
  const handleAuthFailure = useCallback(() => {
      console.error("Google Maps Authentication Failure detected.");
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isPreview = window.location.hostname.includes('scf.usercontent.goog') || window.location.hostname.includes('vercel.app');
      
      let msg = "Harita servisi yüklenemedi.";
      if (isPreview || isLocalhost) {
          msg = "API Anahtarı kısıtlaması hatası (RefererNotAllowed).";
      }
      
      setApiError(msg);
      setManualMode(true);
  }, []);

  useEffect(() => {
    window.gm_authFailure = handleAuthFailure;
    return () => {
      window.gm_authFailure = undefined;
    };
  }, [handleAuthFailure]);

  
  const onLoad = useCallback((mapInstance: any) => {
    setMap(mapInstance);
    setDrawingMode(null); 
  }, []);

  const onPlaceChanged = () => {
    if (autocomplete !== null && map !== null) {
      const place = autocomplete.getPlace();
      
      if (place && place.geometry && place.geometry.location) {
        const newLocation = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
        };

        // Extract readable address (District, City)
        let locName = place.formatted_address || "Seçilen Konum";
        if (place.address_components) {
            const getComp = (type: string) => place.address_components.find((c: any) => c.types.includes(type))?.long_name;
            const district = getComp('administrative_area_level_2') || getComp('locality') || getComp('sublocality_level_1');
            const city = getComp('administrative_area_level_1');
            
            if (district && city) {
                locName = `${district}, ${city}`;
            } else if (city) {
                locName = city;
            }
        }
        setDetectedLocation(locName);

        // FIX 1: Update State FIRST to ensure re-renders use the new center
        setMapCenter(newLocation);

        // Move map visually
        map.panTo(newLocation);
        map.setZoom(20); 
        map.setMapTypeId('satellite');

        // Enable Drawing Flow
        setAddressSelected(true);
        setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
      } else {
          console.warn("Place geometry missing or invalid selection", place);
      }
    }
  };

  const onPolygonComplete = (polygon: any) => {
    if (polygonRef.current) {
      polygonRef.current.setMap(null); // Clear previous polygon
    }
    polygonRef.current = polygon;

    // Calculate Area
    const area = google.maps.geometry.spherical.computeArea(polygon.getPath());
    setRoofArea(Math.round(area));
    setDrawingMode(null); // Stop drawing after one polygon
  };

  const handleReset = () => {
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
    setRoofArea(0);
    // Re-enable drawing
    if (typeof google !== 'undefined') {
        setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    }
  };

  const handleFullReset = () => {
      handleReset();
      setAddressSelected(false);
      setDrawingMode(null);
      setDetectedLocation('');
      // Reset map to default
      setMapCenter(DEFAULT_CENTER_COORDS);
      if(map) {
          map.setZoom(6);
          map.panTo(DEFAULT_CENTER_COORDS);
      }
  };

  const handleConfirm = () => {
    if (manualMode) {
        const area = Number(manualAreaInput);
        if(area > 0) {
            onComplete({ area, coordinates: DEFAULT_CENTER_COORDS, locationName: 'Manuel Giriş' });
        }
    } else {
        if (!polygonRef.current) return;
        const bounds = new google.maps.LatLngBounds();
        polygonRef.current.getPath().forEach((latLng: any) => bounds.extend(latLng));
        const center = bounds.getCenter();
        
        onComplete({
          area: roofArea,
          coordinates: { lat: center.lat(), lng: center.lng() },
          locationName: detectedLocation || 'Harita Konumu'
        });
    }
  };

  const handleLoadError = (e: Error) => {
      console.error("Maps Script Load Error:", e);
      setApiError("Harita servisine bağlanılamadı (Ağ Hatası).");
      setManualMode(true);
  };
  
  const copyToClipboard = () => {
      try {
        const origin = new URL(currentUrl).origin + "/*";
        navigator.clipboard.writeText(origin);
        alert(`Kopyalandı: ${origin}\n\nGoogle Cloud Console > Credentials > API Key > Website Restrictions bölümüne ekleyiniz.`);
      } catch (e) {
          console.error(e);
      }
  };

  // --- Manual Mode View ---
  if (manualMode) {
      return (
        <div className="w-full relative rounded-xl overflow-hidden shadow-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-6 text-center transition-all">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-lg w-full animate-in zoom-in duration-300">
                <div className="bg-energy-100 p-3 rounded-full inline-flex mb-4">
                    <Edit3 className="h-8 w-8 text-energy-600" />
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-2">Manuel Giriş Modu</h3>
                
                {apiError ? (
                    <div className="mb-6 p-4 bg-red-50 text-red-800 text-sm rounded-lg text-left border border-red-100">
                        <div className="flex items-center gap-2 mb-2 font-bold">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <span>Harita Yüklenemedi</span>
                        </div>
                        <p className="mb-2">{apiError}</p>
                        {apiError.includes('Referer') && (
                            <div className="mt-3 pt-3 border-t border-red-200">
                                <p className="text-xs text-red-600 mb-2">Bu hata, API anahtarının mevcut site adresine izin vermediğini gösterir. Geliştirici iseniz bu adresi yetkilendirin:</p>
                                <div className="flex items-center gap-2 bg-white p-2 rounded border border-red-200">
                                    <code className="text-xs text-slate-600 flex-1 truncate">{currentUrl}</code>
                                    <button onClick={copyToClipboard} className="text-slate-400 hover:text-navy-900" title="Domaini Kopyala">
                                        <Copy className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 mb-6">Harita servisi şu anda kullanılamıyor veya API anahtarı eksik. Lütfen çatı alanınızı manuel olarak giriniz.</p>
                )}
                
                <div className="mb-6 text-left">
                    <Input 
                        label="Çatı Alanı (m²)" 
                        type="number" 
                        placeholder="Örn: 120" 
                        value={manualAreaInput}
                        onChange={(e) => setManualAreaInput(e.target.value)}
                        className="text-lg"
                    />
                </div>

                <div className="flex flex-col gap-3">
                    <Button onClick={handleConfirm} disabled={!manualAreaInput} className="w-full bg-energy-600 hover:bg-energy-700 text-white">
                        <Check className="h-4 w-4 mr-2" />
                        Alanı Onayla
                    </Button>
                    
                    {hasValidKey && (
                        <Button variant="ghost" onClick={() => { setApiError(null); setManualMode(false); }} className="text-slate-500 hover:text-navy-900">
                            <Globe className="h-4 w-4 mr-2" />
                            Tekrar Dene
                        </Button>
                    )}
                </div>
            </div>
        </div>
      );
  }

  // --- Map Mode View ---
  return (
    <div className="w-full h-[600px] relative rounded-xl overflow-hidden shadow-2xl border border-slate-200 group">
      {/* CSS FIX FOR GOOGLE MAPS AUTOCOMPLETE DROPDOWN */}
      <style>{`
        .pac-container {
          z-index: 10000 !important;
          border-radius: 8px;
          margin-top: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          border: none;
          font-family: 'Inter', sans-serif;
        }
        .pac-item {
          padding: 12px;
          cursor: pointer;
          font-size: 14px;
          border-top: 1px solid #f1f5f9;
        }
        .pac-item:first-child {
          border-top: none;
        }
        .pac-item:hover {
          background-color: #f8fafc;
        }
        .pac-item-query {
          font-size: 14px;
          color: #0f172a;
        }
      `}</style>

      <LoadScript 
        googleMapsApiKey={apiKey} 
        libraries={libraries}
        onError={handleLoadError}
      >
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={mapCenter} // FIX: Use state, not constant
          zoom={6}
          onLoad={onLoad}
          options={{
            mapTypeId: 'satellite',
            tilt: 0,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            zoomControl: addressSelected,
          }}
        >
          {/* Search Box Overlay */}
          <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 w-11/12 max-w-md z-[1000] transition-all duration-500 ${addressSelected ? 'top-4 scale-95 opacity-90 hover:opacity-100 hover:scale-100' : 'top-1/3 scale-110'}`}>
            <Autocomplete
              onLoad={setAutocomplete}
              onPlaceChanged={onPlaceChanged}
              key={addressSelected ? "selected" : "searching"}
              options={{
                  componentRestrictions: { country: "tr" },
                  fields: ["geometry", "name", "formatted_address", "address_components"] // Added address_components
              }}
            >
              <div className="relative shadow-2xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className={`h-5 w-5 ${addressSelected ? 'text-slate-400' : 'text-energy-500'}`} />
                </div>
                <input
                  type="text"
                  placeholder="Adresinizi arayın (Mahalle, Sokak, İlçe)..."
                  onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                          e.preventDefault();
                      }
                  }}
                  className={`block w-full pl-11 pr-4 py-4 border-none rounded-xl leading-5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-energy-500/30 sm:text-sm shadow-xl transition-all ${!addressSelected ? 'text-lg py-5' : ''}`}
                />
              </div>
            </Autocomplete>
            {!addressSelected && (
                <div className="mt-4 text-center bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg">
                    <p className="text-sm font-medium text-navy-900">Çizime başlamak için lütfen önce adresinizi bulun.</p>
                </div>
            )}
          </div>

          {/* Drawing Manager */}
          {addressSelected && (
              <DrawingManager
                onPolygonComplete={onPolygonComplete}
                drawingMode={drawingMode}
                options={{
                  drawingControl: drawingMode !== null,
                  drawingControlOptions: {
                    position: typeof google !== 'undefined' ? google.maps.ControlPosition.TOP_LEFT : 1,
                    drawingModes: typeof google !== 'undefined' ? [google.maps.drawing.OverlayType.POLYGON] : [],
                  },
                  polygonOptions: {
                    fillColor: '#FF9F1C',
                    fillOpacity: 0.4,
                    strokeWeight: 2,
                    strokeColor: '#FF9F1C',
                    editable: true,
                    draggable: false,
                    zIndex: 1
                  },
                }}
              />
          )}

          {/* Controls & Info Overlay */}
          {roofArea > 0 && (
             <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-11/12 max-w-sm z-10 animate-in slide-in-from-bottom-4">
                <Card className="bg-white/95 backdrop-blur shadow-2xl border-energy-500 border-2">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Çizilen Alan</p>
                                <p className="text-3xl font-bold text-navy-900">{roofArea} <span className="text-lg text-slate-500">m²</span></p>
                            </div>
                            <div className="bg-energy-100 p-2 rounded-full">
                                <MapPin className="h-6 w-6 text-energy-600" />
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleReset} className="flex-1 text-red-600 hover:bg-red-50 border-red-200">
                                <RefreshCw className="h-4 w-4 mr-2" /> Temizle
                            </Button>
                            <Button variant="primary" size="sm" onClick={handleConfirm} className="flex-[2] bg-energy-600 hover:bg-energy-700 text-white shadow-lg shadow-energy-500/30">
                                <Check className="h-4 w-4 mr-2" /> Onayla
                            </Button>
                        </div>
                    </CardContent>
                </Card>
             </div>
          )}

          {/* Manual Mode Toggle Button */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <Button size="sm" variant="ghost" onClick={() => setManualMode(true)} className="bg-white/90 shadow-md backdrop-blur text-slate-600 hover:bg-white border border-slate-200">
                  <Edit3 className="h-4 w-4 mr-2" /> Manuel Çizim
              </Button>
              {addressSelected && (
                  <Button size="sm" variant="ghost" onClick={handleFullReset} className="bg-white/90 shadow-md backdrop-blur text-slate-600 hover:bg-white border border-slate-200">
                    <Navigation className="h-4 w-4 mr-2" /> Adres Değiştir
                  </Button>
              )}
          </div>

          {/* Instructions Overlay */}
          {addressSelected && !roofArea && (
             <div className="absolute bottom-10 left-4 bg-white/90 p-4 rounded-lg shadow-lg max-w-xs text-sm text-slate-600 z-0 pointer-events-none border-l-4 border-energy-500">
                <div className="flex items-start gap-3">
                    <div className="bg-energy-100 p-2 rounded-full shrink-0">
                         <Edit3 className="h-5 w-5 text-energy-600" />
                    </div>
                    <div>
                        <p className="font-bold text-navy-900 mb-1">Çizime Başlayın</p>
                        <p>Çatınızın <strong>köşelerine tıklayarak</strong> alanı belirleyin. Bitirmek için ilk noktaya tekrar tıklayın.</p>
                    </div>
                </div>
             </div>
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};
