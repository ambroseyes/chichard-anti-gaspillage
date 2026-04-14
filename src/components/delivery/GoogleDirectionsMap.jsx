import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, Navigation, Clock, MapPin, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Haversine fallback
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function GoogleDirectionsMap({ orders, courierPos }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const markersRef = useRef([]);
  const [isLoading, setIsLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null); // { legs: [], totalDuration, totalDistance }
  const [collapsed, setCollapsed] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);

  // Load Google Maps script dynamically
  useEffect(() => {
    if (window.google?.maps) { setMapsReady(true); return; }
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      existing.addEventListener('load', () => setMapsReady(true));
      return;
    }
    const script = document.createElement('script');
    // API key must be provided via env var or fallback to demo mode
    const apiKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || '';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapsReady(true);
    document.head.appendChild(script);
  }, []);

  // Init map
  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapInstanceRef.current) return;
    const center = courierPos
      ? { lat: courierPos.lat, lng: courierPos.lng }
      : { lat: 3.848, lng: 11.502 }; // Default: Yaoundé

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      zoom: 13,
      center,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      ],
    });

    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: { strokeColor: '#3B82F6', strokeWeight: 4, strokeOpacity: 0.8 },
    });
    directionsRendererRef.current.setMap(mapInstanceRef.current);
  }, [mapsReady, courierPos]);

  // Calculate and display route
  const calculateRoute = useCallback(async () => {
    if (!mapsReady || !window.google?.maps) {
      toast.error('Google Maps non disponible. Vérifiez la clé API.');
      return;
    }
    const activeOrders = orders.filter(o =>
      ['on_the_way', 'picked_up'].includes(o.status) &&
      (o.delivery_lat || o.delivery_address)
    );
    if (activeOrders.length === 0) {
      toast.info('Aucune livraison active avec adresse');
      return;
    }

    setIsLoading(true);

    const origin = courierPos
      ? new window.google.maps.LatLng(courierPos.lat, courierPos.lng)
      : activeOrders[0].delivery_address;

    const waypoints = activeOrders.slice(0, -1).map(o => ({
      location: o.delivery_lat && o.delivery_lng
        ? new window.google.maps.LatLng(o.delivery_lat, o.delivery_lng)
        : o.delivery_address,
      stopover: true,
    }));

    const destination = (() => {
      const last = activeOrders[activeOrders.length - 1];
      return last.delivery_lat && last.delivery_lng
        ? new window.google.maps.LatLng(last.delivery_lat, last.delivery_lng)
        : last.delivery_address;
    })();

    const service = new window.google.maps.DirectionsService();
    service.route({
      origin,
      destination,
      waypoints,
      optimizeWaypoints: true,
      travelMode: window.google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      setIsLoading(false);
      if (status === 'OK') {
        directionsRendererRef.current.setDirections(result);

        // Clear old markers
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        // Add numbered markers for each stop
        const route = result.routes[0];
        const waypointOrder = route.waypoint_order;
        const orderedOrders = [
          activeOrders[0],
          ...waypointOrder.map(i => activeOrders.slice(0, -1)[i]),
          activeOrders[activeOrders.length - 1],
        ].filter(Boolean);

        orderedOrders.forEach((order, idx) => {
          if (!order.delivery_lat && !order.delivery_lng) return;
          const marker = new window.google.maps.Marker({
            position: { lat: order.delivery_lat, lng: order.delivery_lng },
            map: mapInstanceRef.current,
            label: { text: String(idx + 1), color: 'white', fontSize: '12px', fontWeight: 'bold' },
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 14,
              fillColor: '#3B82F6',
              fillOpacity: 1,
              strokeColor: '#1D4ED8',
              strokeWeight: 2,
            },
            title: order.customer_name,
          });

          const infowindow = new window.google.maps.InfoWindow({
            content: `
              <div style="font-size:13px;min-width:160px">
                <b>${order.customer_name}</b>
                <p style="margin:4px 0;color:#666">${order.delivery_address || ''}</p>
                <p style="color:#059669;font-weight:600">${order.total_amount?.toLocaleString()} FCFA</p>
              </div>
            `,
          });
          marker.addListener('click', () => infowindow.open(mapInstanceRef.current, marker));
          markersRef.current.push(marker);
        });

        // Driver position marker
        if (courierPos) {
          const driverMarker = new window.google.maps.Marker({
            position: { lat: courierPos.lat, lng: courierPos.lng },
            map: mapInstanceRef.current,
            icon: {
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: '#10B981',
              fillOpacity: 1,
              strokeColor: '#065F46',
              strokeWeight: 2,
              rotation: 0,
            },
            title: 'Votre position',
          });
          markersRef.current.push(driverMarker);
        }

        // Extract leg info
        const legs = route.legs.map((leg, i) => ({
          index: i + 1,
          start: leg.start_address,
          end: leg.end_address,
          distance: leg.distance?.text,
          duration: leg.duration?.text,
          customer: orderedOrders[i + 1]?.customer_name || '',
        }));

        const totalDuration = route.legs.reduce((s, l) => s + (l.duration?.value || 0), 0);
        const totalDistance = route.legs.reduce((s, l) => s + (l.distance?.value || 0), 0);

        setRouteInfo({
          legs,
          totalDuration: Math.round(totalDuration / 60),
          totalDistanceKm: (totalDistance / 1000).toFixed(1),
          stops: orderedOrders.length,
        });
      } else {
        toast.error(`Erreur itinéraire Google: ${status}`);
        // Fallback: just center map
        if (activeOrders[0].delivery_lat) {
          mapInstanceRef.current?.setCenter({ lat: activeOrders[0].delivery_lat, lng: activeOrders[0].delivery_lng });
        }
      }
    });
  }, [mapsReady, orders, courierPos]);

  const activeCount = orders.filter(o => ['on_the_way', 'picked_up'].includes(o.status)).length;

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-sm">Carte Directions Google</span>
          {routeInfo && (
            <Badge className="bg-blue-100 text-blue-700 text-xs">
              {routeInfo.totalDistanceKm} km · ~{routeInfo.totalDuration} min
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={calculateRoute} disabled={isLoading || activeCount === 0}>
            {isLoading
              ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
              : <RefreshCw className="w-4 h-4 mr-1" />
            }
            {isLoading ? 'Calcul...' : 'Calculer tournée'}
          </Button>
          <button onClick={() => setCollapsed(c => !c)} className="p-1 hover:bg-gray-100 rounded">
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Map container */}
          <div ref={mapRef} className="w-full h-72 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
            {!mapsReady && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Chargement Google Maps...</p>
                  <p className="text-xs mt-1 text-gray-300">Clé API requise: VITE_GOOGLE_MAPS_API_KEY</p>
                </div>
              </div>
            )}
          </div>

          {/* Leg details */}
          {routeInfo && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Détail de la tournée — {routeInfo.stops} arrêts
              </p>
              {routeInfo.legs.map(leg => (
                <div key={leg.index} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                  <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {leg.index}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{leg.customer}</p>
                    <p className="text-xs text-gray-400 truncate">{leg.end}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{leg.duration}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{leg.distance}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeCount === 0 && (
            <p className="text-center text-xs text-gray-400 py-4">
              Aucune livraison active (statut "en route" ou "récupérée") pour tracer l'itinéraire
            </p>
          )}
        </>
      )}
    </div>
  );
}