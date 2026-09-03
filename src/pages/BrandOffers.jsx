import React, { useEffect } from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, TrendingUp, Star, Clock } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function BrandOffers() {
  const { user } = useAuth();

  const { data: activeCampaigns = [] } = useQuery({
    queryKey: ['active-sponsored-campaigns'],
    queryFn: () => api.entities.SponsoredCampaign.filter({ status: 'active' }, '-created_date')
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['active-brand-partnerships'],
    queryFn: () => api.entities.BrandPartnership.filter({ partnership_status: 'active' })
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-for-brands'],
    queryFn: () => api.entities.Product.filter({ status: 'active' }, '-created_date', 100)
  });

  // Track impression when campaigns are viewed
  useEffect(() => {
    if (activeCampaigns.length > 0) {
      activeCampaigns.forEach(campaign => {
        api.entities.SponsoredCampaign.update(campaign.id, {
          impressions: (campaign.impressions || 0) + 1
        });
      });
    }
  }, [activeCampaigns.length]);

  const trackClick = async (campaign) => {
    await api.entities.SponsoredCampaign.update(campaign.id, {
      clicks: (campaign.clicks || 0) + 1,
      ctr: ((campaign.clicks + 1) / (campaign.impressions || 1)) * 100
    });
  };

  // Get sponsored products
  const sponsoredProducts = products.filter(p =>
    activeCampaigns.some(c =>
      c.target_products?.includes(p.id) ||
      c.target_categories?.includes(p.category)
    )
  );

  // Group campaigns by type
  const bannerCampaigns = activeCampaigns.filter(c => c.campaign_type === 'banner_ad');
  const productCampaigns = activeCampaigns.filter(c => c.campaign_type === 'product_sponsorship');
  const categoryCampaigns = activeCampaigns.filter(c => c.campaign_type === 'category_sponsorship');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Offres Marques</h1>
            <p className="text-gray-500">Découvrez les meilleures offres de nos marques partenaires</p>
          </div>
        </div>

        {/* Banner Ads */}
        {bannerCampaigns.length > 0 && (
          <div className="mb-6">
            {bannerCampaigns.slice(0, 2).map((campaign) => (
              <Link
                key={campaign.id}
                to={campaign.ad_creative?.cta_url || createPageUrl('Catalog')}
                onClick={() => trackClick(campaign)}
              >
                <Card className="p-6 mb-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    {campaign.ad_creative?.image_url && (
                      <img
                        src={campaign.ad_creative.image_url}
                        alt={campaign.ad_creative.title}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <Badge className="bg-purple-500 mb-2">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Sponsorisé
                      </Badge>
                      <h3 className="font-bold text-lg mb-1">{campaign.ad_creative?.title}</h3>
                      <p className="text-gray-600 text-sm">{campaign.ad_creative?.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="bg-purple-500 text-white px-6 py-2 rounded-lg font-semibold">
                        {campaign.ad_creative?.cta_text || 'Découvrir'}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <Tabs defaultValue="sponsored" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sponsored">
              <Star className="w-4 h-4 mr-2" />
              Produits Sponsorisés
            </TabsTrigger>
            <TabsTrigger value="brands">
              <TrendingUp className="w-4 h-4 mr-2" />
              Nos Marques
            </TabsTrigger>
            <TabsTrigger value="categories">
              Catégories en promo
            </TabsTrigger>
          </TabsList>

          {/* Sponsored Products */}
          <TabsContent value="sponsored">
            <div className="grid md:grid-cols-3 gap-4">
              {sponsoredProducts.map((product) => {
                const campaign = activeCampaigns.find(c =>
                  c.target_products?.includes(product.id) ||
                  c.target_categories?.includes(product.category)
                );
                const discount = Math.round((1 - product.discounted_price / product.original_price) * 100);
                const daysLeft = Math.ceil((new Date(product.expiration_date) - new Date()) / (1000 * 60 * 60 * 24));

                return (
                  <Link
                    key={product.id}
                    to={createPageUrl('ProductDetail') + '?id=' + product.id}
                    onClick={() => campaign && trackClick(campaign)}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-all group">
                      <div className="relative">
                        <div className="aspect-square bg-gray-100">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                              🛒
                            </div>
                          )}
                        </div>
                        <Badge className="absolute top-2 left-2 bg-purple-500">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Sponsorisé
                        </Badge>
                        <Badge className="absolute top-2 right-2 bg-orange-500">
                          -{discount}%
                        </Badge>
                      </div>
                      <div className="p-4">
                        {campaign && (
                          <p className="text-xs text-purple-600 font-medium mb-1">
                            Par {campaign.brand_name}
                          </p>
                        )}
                        <h3 className="font-semibold mb-1 line-clamp-2">{product.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">{product.store_name}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-bold text-emerald-600">
                              {product.discounted_price.toLocaleString()} F
                            </p>
                            <p className="text-xs text-gray-400 line-through">
                              {product.original_price.toLocaleString()} F
                            </p>
                          </div>
                          {daysLeft <= 3 && (
                            <Badge className="bg-red-500 text-white">
                              <Clock className="w-3 h-3 mr-1" />
                              {daysLeft}j
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </TabsContent>

          {/* Brands */}
          <TabsContent value="brands">
            <div className="grid md:grid-cols-4 gap-4">
              {brands.map((brand) => (
                <Card key={brand.id} className="p-6 text-center hover:shadow-lg transition-all">
                  {brand.brand_logo_url ? (
                    <img
                      src={brand.brand_logo_url}
                      alt={brand.brand_name}
                      className="w-20 h-20 mx-auto mb-3 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                      {brand.brand_name.charAt(0)}
                    </div>
                  )}
                  <h3 className="font-bold mb-1">{brand.brand_name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {brand.sponsored_products?.length || 0} produits
                  </Badge>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Categories */}
          <TabsContent value="categories">
            <div className="grid md:grid-cols-2 gap-4">
              {categoryCampaigns.map((campaign) => (
                <Card key={campaign.id} className="p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                      <TrendingUp className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <Badge className="bg-purple-500 mb-2">Sponsorisé par {campaign.brand_name}</Badge>
                      <h3 className="font-bold text-lg mb-1">{campaign.campaign_name}</h3>
                      <p className="text-sm text-gray-500">
                        {campaign.target_categories?.join(', ').replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}