import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import { Navigation, MapPin, Clock, TrendingUp, Zap, Route } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const driverIcon = new L.Icon({
  iconUrl: 'https://api.iconify.design/mdi/truck-fast.svg?color=%232563eb&width=40&height=40',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const customerIcon = new L.Icon({
  iconUrl: 'https://api.iconify.design/mdi/home-map-marker.svg?color=%2310b981&width=36&height=36',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const pendingIcon = new L.Icon({
  iconUrl: 'https://api.iconify.design/mdi/package-variant.svg?color=%23f59e0b&width=36&height=36',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

// Component to auto-update map view
function MapUpdater({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  
  return null;
}

export default function LiveDeliveryMap({ orders, onRouteOptimize }) {
  const [userLocation, setUserLocation] = useState([3.8480, 11.5021]); // Yaoundé
  const [tracking, setTracking] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [routeStats, setRouteStats] = useState(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    // Get initial position
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.log(error)
      );
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Géolocalisation non supportée');
      return;
    }

    setTracking(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        console.error(error);
        toast.error('Erreur de géolocalisation');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );
    toast.success('Suivi en temps réel activé');
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
    toast.info('Suivi désactivé');
  };

  // Geocoding simulation - en production utiliser une vraie API
  const getCoordinates = (address, index) => {
    const baseCoords = [3.8480, 11.5021];
    return [
      baseCoords[0] + (Math.random() - 0.5) * 0.1,
      baseCoords[1] + (Math.random() - 0.5) * 0.1
    ];
  };

  const deliveryPoints = orders.map((order, idx) => ({
    id: order.id,
    coords: getCoordinates(order.delivery_address, idx),
    customer: order.customer_name,
    address: order.delivery_address,
    status: order.status,
    amount: order.total_amount,
    items: order.items?.length || 0
  }));

  // Algorithme d'optimisation de route (plus proche voisin simplifié)
  const optimizeRoute = () => {
    if (deliveryPoints.length === 0) return;

    let route = [userLocation];
    let remaining = [...deliveryPoints];
    let currentPos = userLocation;
    let totalDistance = 0;

    while (remaining.length > 0) {
      // Trouver le point le plus proche
      let closestIdx = 0;
      let minDistance = calculateDistance(currentPos, remaining[0].coords);

      for (let i = 1; i < remaining.length; i++) {
        const distance = calculateDistance(currentPos, remaining[i].coords);
        if (distance < minDistance) {
          minDistance = distance;
          closestIdx = i;
        }
      }

      const closest = remaining[closestIdx];
      route.push(closest.coords);
      totalDistance += minDistance;
      currentPos = closest.coords;
      remaining.splice(closestIdx, 1);
    }

    setOptimizedRoute(route);
    setRouteStats({
      totalDistance: (totalDistance * 111).toFixed(1), // Convert to km (approximation)
      estimatedTime: Math.ceil((totalDistance * 111) / 30 * 60), // 30km/h average speed
      stops: deliveryPoints.length
    });

    toast.success('🗺️ Itinéraire optimisé !');
    onRouteOptimize?.(route);
  };

  const calculateDistance = (pos1, pos2) => {
    // Haversine formula (simplified)
    const lat1 = pos1[0] * Math.PI / 180;
    const lat2 = pos2[0] * Math.PI / 180;
    const dLat = (pos2[0] - pos1[0]) * Math.PI / 180;
    const dLon = (pos2[1] - pos1[1]) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const openNavigation = (coords) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant={tracking ? "destructive" : "default"}
            onClick={tracking ? stopTracking : startTracking}
          >
            {tracking ? (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                Arrêter le suivi
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                Activer GPS
              </>
            )}
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={optimizeRoute}
            disabled={deliveryPoints.length === 0}
          >
            <Route className="w-4 h-4 mr-2" />
            Optimiser route
          </Button>
        </div>

        {routeStats && (
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="secondary" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {routeStats.totalDistance} km
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ~{routeStats.estimatedTime} min
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {routeStats.stops} arrêts
            </Badge>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative h-[500px] rounded-xl overflow-hidden border">
        <MapContainer 
          center={userLocation} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          
          <MapUpdater center={userLocation} />

          {/* Driver position with accuracy circle */}
          <Marker position={userLocation} icon={driverIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold mb-1">📍 Votre position</p>
                {tracking && (
                  <p className="text-xs text-green-600 font-medium">
                    Suivi en temps réel actif
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
          
          {tracking && (
            <Circle 
              center={userLocation} 
              radius={50} 
              pathOptions={{ 
                color: '#3b82f6', 
                fillColor: '#3b82f6',
                fillOpacity: 0.1
              }} 
            />
          )}

          {/* Delivery points */}
          {deliveryPoints.map((point, idx) => (
            <React.Fragment key={point.id}>
              <Marker 
                position={point.coords} 
                icon={point.status === 'confirmed' ? pendingIcon : customerIcon}
              >
                <Popup>
                  <div className="min-w-[220px]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">{point.customer}</p>
                      <Badge className={
                        point.status === 'confirmed' ? 'bg-amber-100 text-amber-700' : 
                        'bg-blue-100 text-blue-700'
                      }>
                        {point.status === 'confirmed' ? 'À récupérer' : 'En cours'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{point.address}</p>
                    <div className="flex items-center justify-between mb-2 text-xs">
                      <span>{point.items} article(s)</span>
                      <span className="font-semibold text-emerald-600">
                        {point.amount?.toLocaleString()} FCFA
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => openNavigation(point.coords)}
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      Naviguer
                    </Button>
                  </div>
                </Popup>
              </Marker>

              {/* Show distance line for active deliveries */}
              {point.status === 'ready' && (
                <Polyline 
                  positions={[userLocation, point.coords]} 
                  color="#2563eb"
                  weight={3}
                  dashArray="5, 10"
                  opacity={0.6}
                />
              )}
            </React.Fragment>
          ))}

          {/* Optimized route */}
          {optimizedRoute && (
            <Polyline 
              positions={optimizedRoute} 
              color="#10b981"
              weight={4}
              opacity={0.8}
            />
          )}
        </MapContainer>

        {/* Legend */}
        <Card className="absolute bottom-4 left-4 p-3 bg-white/95 backdrop-blur-sm z-[1000]">
          <p className="text-xs font-semibold mb-2">Légende</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span>Votre position</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <span>À récupérer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span>En livraison</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}