import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Navigation, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
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
  iconUrl: 'https://api.iconify.design/mdi/truck-fast.svg?color=%232563eb&width=32&height=32',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const customerIcon = new L.Icon({
  iconUrl: 'https://api.iconify.design/mdi/home-map-marker.svg?color=%2310b981&width=32&height=32',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export default function DeliveryMap({ orders, currentLocation }) {
  const [userLocation, setUserLocation] = useState(currentLocation || [3.8480, 11.5021]); // Yaoundé par défaut

  useEffect(() => {
    if (navigator.geolocation && !currentLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.log(error)
      );
    }
  }, [currentLocation]);

  // Fonction pour geocoder une adresse (simulation)
  const getCoordinates = (address, index) => {
    // Simulation - en production, utiliser une vraie API de géocodage
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
    status: order.status
  }));

  const openNavigation = (coords) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`, '_blank');
  };

  return (
    <div className="relative h-[400px] rounded-xl overflow-hidden border">
      <MapContainer 
        center={userLocation} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        {/* Driver position */}
        <Marker position={userLocation} icon={driverIcon}>
          <Popup>
            <div className="text-center">
              <p className="font-semibold">Votre position</p>
            </div>
          </Popup>
        </Marker>

        {/* Delivery points */}
        {deliveryPoints.map((point) => (
          <React.Fragment key={point.id}>
            <Marker position={point.coords} icon={customerIcon}>
              <Popup>
                <div className="min-w-[200px]">
                  <p className="font-semibold mb-1">{point.customer}</p>
                  <p className="text-xs text-gray-600 mb-2">{point.address}</p>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => openNavigation(point.coords)}
                  >
                    <Navigation className="w-3 h-3 mr-1" />
                    Itinéraire
                  </Button>
                </div>
              </Popup>
            </Marker>
            
            {/* Line from driver to delivery point */}
            {point.status === 'ready' && (
              <Polyline 
                positions={[userLocation, point.coords]} 
                color="#2563eb"
                weight={3}
                dashArray="5, 10"
              />
            )}
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
}