import React, { useState } from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ProductCard from '@/components/ui/ProductCard';
import CategoryPill from '@/components/ui/CategoryPill';
import { goToLogin } from '@/lib/navigation';

export default function Catalog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('discount');
  const [maxPrice, setMaxPrice] = useState([50000]);
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await api.auth.me();
        setUser(userData);
      } catch {
        // Visiteur non connecté : la page reste consultable en anonyme.
      }
    };
    loadUser();
  }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.entities.Product.filter({ status: 'active' }, '-created_date', 100),
  });

  const addToCart = async (product) => {
    if (!user) {
      goToLogin();
      return;
    }
    
    const existingItems = await api.entities.CartItem.filter({ 
      user_email: user.email, 
      product_id: product.id 
    });
    
    if (existingItems.length > 0) {
      await api.entities.CartItem.update(existingItems[0].id, {
        quantity: (existingItems[0].quantity || 1) + 1
      });
    } else {
      await api.entities.CartItem.create({
        user_email: user.email,
        product_id: product.id,
        product_name: product.name,
        product_image: product.image_url,
        quantity: 1,
        unit_price: product.discounted_price,
        original_price: product.original_price,
        store_name: product.store_name,
        expiration_date: product.expiration_date
      });
    }
  };

  const getDaysLeft = (date) => {
    return Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const getDiscount = (original, discounted) => {
    return Math.round((1 - discounted / original) * 100);
  };

  // Apply filters
  let filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch = !searchQuery || 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.store_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPrice = p.discounted_price <= maxPrice[0];
    
    const daysLeft = getDaysLeft(p.expiration_date);
    let matchUrgency = true;
    if (urgencyFilter === 'today') matchUrgency = daysLeft <= 1;
    else if (urgencyFilter === '3days') matchUrgency = daysLeft <= 3;
    else if (urgencyFilter === 'week') matchUrgency = daysLeft <= 7;
    
    return matchCategory && matchSearch && matchPrice && matchUrgency && daysLeft > 0;
  });

  // Apply sorting
  filteredProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'discount':
        return getDiscount(b.original_price, b.discounted_price) - getDiscount(a.original_price, a.discounted_price);
      case 'price_asc':
        return a.discounted_price - b.discounted_price;
      case 'price_desc':
        return b.discounted_price - a.discounted_price;
      case 'expiration':
        return new Date(a.expiration_date) - new Date(b.expiration_date);
      default:
        return 0;
    }
  });

  const activeFiltersCount = [
    selectedCategory !== 'all',
    urgencyFilter !== 'all',
    maxPrice[0] < 50000,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-14 md:top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Search */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-11 px-4 rounded-xl relative">
                  <SlidersHorizontal className="w-5 h-5" />
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtres</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  {/* Sort */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Trier par</Label>
                    <RadioGroup value={sortBy} onValueChange={setSortBy}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="discount" id="discount" />
                        <Label htmlFor="discount" className="font-normal">Meilleure réduction</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="price_asc" id="price_asc" />
                        <Label htmlFor="price_asc" className="font-normal">Prix croissant</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="price_desc" id="price_desc" />
                        <Label htmlFor="price_desc" className="font-normal">Prix décroissant</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="expiration" id="expiration" />
                        <Label htmlFor="expiration" className="font-normal">Expire bientôt</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Urgency */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Date d'expiration</Label>
                    <RadioGroup value={urgencyFilter} onValueChange={setUrgencyFilter}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="all" />
                        <Label htmlFor="all" className="font-normal">Tous</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="today" id="today" />
                        <Label htmlFor="today" className="font-normal text-red-600">Expire aujourd'hui</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="3days" id="3days" />
                        <Label htmlFor="3days" className="font-normal text-orange-600">Dans 3 jours</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="week" id="week" />
                        <Label htmlFor="week" className="font-normal">Cette semaine</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Price */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">
                      Prix maximum: {maxPrice[0].toLocaleString()} FCFA
                    </Label>
                    <Slider
                      value={maxPrice}
                      onValueChange={setMaxPrice}
                      max={50000}
                      step={1000}
                      className="mt-2"
                    />
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setSelectedCategory('all');
                      setUrgencyFilter('all');
                      setMaxPrice([50000]);
                      setSortBy('discount');
                    }}
                  >
                    Réinitialiser les filtres
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Categories */}
          <CategoryPill selected={selectedCategory} onSelect={setSelectedCategory} />
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4">
                <Skeleton className="aspect-square rounded-xl mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-500 text-sm mb-4">Essayez de modifier vos filtres</p>
            <Button 
              variant="outline"
              onClick={() => {
                setSelectedCategory('all');
                setUrgencyFilter('all');
                setMaxPrice([50000]);
                setSearchQuery('');
              }}
            >
              Réinitialiser
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}