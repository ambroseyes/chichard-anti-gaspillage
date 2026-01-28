import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, Heart, TrendingDown, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PersonalizedDealsFeed({ userId }) {
  const [userLocation, setUserLocation] = useState(null);
  const [preferences, setPreferences] = useState(null);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => console.log('Location error:', error)
      );
    }
  }, []);

  const { data: userPrefs } = useQuery({
    queryKey: ['user-preferences', userId],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreference.filter({ user_email: userId });
      return prefs[0];
    },
    enabled: !!userId
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['personalized-deals', userId, userLocation],
    queryFn: async () => {
      const allProducts = await base44.entities.Product.filter({ status: 'active' }, '-created_date', 50);
      
      // Filter and score products based on preferences
      return allProducts.map(product => {
        let score = 0;
        
        // Category preference
        if (userPrefs?.favorite_categories?.includes(product.category)) {
          score += 30;
        }
        
        // Urgency (DLC proche)
        const daysLeft = Math.ceil((new Date(product.expiration_date) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 3) score += 25;
        else if (daysLeft <= 7) score += 15;
        
        // Discount rate
        const discount = Math.round((1 - product.discounted_price / product.original_price) * 100);
        if (discount >= 50) score += 20;
        else if (discount >= 30) score += 10;
        
        // Store preference
        if (userPrefs?.preferred_stores?.includes(product.store_id)) {
          score += 15;
        }
        
        // Calculate distance if location available
        let distance = null;
        if (userLocation && product.latitude && product.longitude) {
          distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            product.latitude,
            product.longitude
          );
          
          // Distance bonus
          if (distance <= 2) score += 20;
          else if (distance <= 5) score += 10;
          else if (distance <= 10) score += 5;
        }
        
        return { ...product, relevanceScore: score, distance };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20);
    },
    enabled: !!userId
  });

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-bold">Bons plans pour vous</h2>
        </div>
        {userLocation && (
          <Badge variant="outline" className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            Offres à proximité
          </Badge>
        )}
      </div>

      <div className="grid gap-4">
        {products.map((product) => {
          const daysLeft = Math.ceil((new Date(product.expiration_date) - new Date()) / (1000 * 60 * 60 * 24));
          const discount = Math.round((1 - product.discounted_price / product.original_price) * 100);

          return (
            <Link key={product.id} to={createPageUrl('ProductDetail') + '?id=' + product.id}>
              <Card className="p-4 hover:shadow-lg transition-all cursor-pointer">
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🛒</div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500">{product.store_name}</p>
                      </div>
                      <Badge className="bg-orange-500 text-white">-{discount}%</Badge>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {product.distance && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {product.distance.toFixed(1)} km
                        </Badge>
                      )}
                      {daysLeft <= 3 && (
                        <Badge className="bg-red-500 text-white flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {daysLeft}j restant{daysLeft > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {product.relevanceScore >= 50 && (
                        <Badge className="bg-purple-500 text-white">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Top pour vous
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <span className="text-xl font-bold text-emerald-600">
                          {product.discounted_price.toLocaleString()} F
                        </span>
                        <span className="text-sm text-gray-400 line-through ml-2">
                          {product.original_price.toLocaleString()} F
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Vous économisez</p>
                        <p className="font-bold text-emerald-600">
                          {(product.original_price - product.discounted_price).toLocaleString()} F
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {products.length === 0 && (
        <Card className="p-8 text-center">
          <TrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Aucun bon plan pour le moment</h3>
          <p className="text-gray-500 text-sm">
            Configurez vos préférences pour recevoir des offres personnalisées
          </p>
        </Card>
      )}
    </div>
  );
}