import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Award,
  Check,
  Clock,
  Heart,
  Leaf,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Share2,
  ShoppingCart,
  Star,
  Store,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import { createPageUrl } from '@/utils';
import { formatXAF, expiryLabel, daysUntil, unitPrice, formatDate } from '@/lib/format';
import { CATEGORY_EMOJI, CATEGORY_LABEL } from '@/lib/constants';
import { useCart } from '@/hooks/useCart';
import { useAppConfig } from '@/hooks/useAppConfig';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import ProductCard from '@/components/ui/ProductCard';
import ReportModal from '@/components/safety/ReportModal';

/**
 * Fiche produit.
 *
 * Deux colonnes : la galerie à gauche, le bloc d'achat à droite qui reste
 * visible pendant qu'on lit. Le détail (caractéristiques, allergènes, avis)
 * passe sous des onglets pour ne pas repousser le bouton d'achat hors écran.
 */
export default function ProductDetail() {
  const [params] = useSearchParams();
  const productId = params.get('id');
  const { addToCart, isAdding } = useCart();
  const config = useAppConfig();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.entities.Product.get(productId),
    enabled: Boolean(productId),
  });

  const { data: similar } = useQuery({
    queryKey: ['product-similar', product?.category, product?.id],
    queryFn: () => api.catalog.search({ category: [product.category], per_page: 8 }),
    enabled: Boolean(product?.category),
    select: (page) => page.items.filter((item) => item.id !== product.id).slice(0, 4),
  });

  if (isLoading) return <DetailSkeleton />;
  if (!product) return <NotFound />;

  const images = [product.image_url, ...(product.images ?? [])].filter(Boolean);
  const days = daysUntil(product.expiration_date);
  const perUnit = unitPrice(product);
  const savings = Math.max(0, (product.original_price ?? 0) - (product.discounted_price ?? 0));
  const discount = product.discount_percent ?? 0;
  const stock = product.quantity_available ?? 0;
  const maxQuantity = Math.max(1, Math.min(stock, 20));

  const add = () => {
    if (addToCart(product, quantity)) {
      toast.success(`${quantity} × ${product.name} ajouté au panier`);
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success('Lien copié');
      }
    } catch {
      // L'utilisateur a annulé le partage : rien à signaler.
    }
  };

  return (
    <div className="bg-gray-50 pb-10">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-5">
        <Breadcrumbs
          trail={[
            { label: 'Catalogue', to: createPageUrl('Catalog') },
            {
              label: CATEGORY_LABEL[product.category] ?? product.category,
              to: createPageUrl(`Catalog?category=${product.category}`),
            },
            { label: product.name },
          ]}
          className="mb-4"
        />

        <div className="grid lg:grid-cols-[minmax(0,1fr)_22rem] gap-6">
          <div className="space-y-6">
            {/* Galerie + identité */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    {images[activeImage] ? (
                      <img
                        src={images[activeImage]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="w-full h-full grid place-items-center text-7xl" aria-hidden="true">
                        {CATEGORY_EMOJI[product.category] ?? '🛒'}
                      </span>
                    )}

                    {discount > 0 && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded bg-orange-500 text-white text-sm font-bold">
                        −{discount}%
                      </span>
                    )}
                  </div>

                  {images.length > 1 && (
                    <ul className="flex gap-2 mt-3">
                      {images.map((image, index) => (
                        <li key={image}>
                          <button
                            type="button"
                            onClick={() => setActiveImage(index)}
                            aria-label={`Voir l'image ${index + 1}`}
                            aria-current={index === activeImage}
                            className={`w-16 h-16 rounded-md overflow-hidden border-2 ${
                              index === activeImage ? 'border-emerald-500' : 'border-transparent'
                            }`}
                          >
                            <img src={image} alt="" className="w-full h-full object-cover" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  {product.brand && (
                    <p className="text-xs uppercase tracking-wide text-gray-400">{product.brand}</p>
                  )}
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">{product.name}</h1>

                  <div className="flex items-center gap-2 mt-2">
                    <Rating value={product.avg_rating} />
                    <span className="text-sm text-gray-500">
                      {product.reviews_count > 0
                        ? `${product.avg_rating?.toFixed(1)} · ${product.reviews_count} avis`
                        : 'Pas encore d’avis'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Tag icon={Clock} tone={days <= 1 ? 'danger' : days <= 3 ? 'warning' : 'neutral'}>
                      {expiryLabel(product.expiration_date)} — {formatDate(product.expiration_date)}
                    </Tag>
                    {product.is_verified && (
                      <Tag icon={ShieldCheck} tone="success">
                        Date vérifiée par la boutique
                      </Tag>
                    )}
                    {product.co2_saved > 0 && (
                      <Tag icon={Leaf} tone="success">
                        {product.co2_saved} kg de CO₂ évités
                      </Tag>
                    )}
                  </div>

                  {product.description && (
                    <p className="text-sm text-gray-600 mt-4 leading-relaxed">{product.description}</p>
                  )}

                  <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={share}
                      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
                    >
                      <Share2 className="w-4 h-4" /> Partager
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
                    >
                      <Heart className="w-4 h-4" /> Ajouter aux favoris
                    </button>
                    <ReportModal entityType="product" entityId={product.id} entityName={product.name} />
                  </div>
                </div>
              </div>
            </div>

            {/* Onglets de détail */}
            <div className="bg-white rounded-xl border border-gray-200">
              <Tabs defaultValue="caracteristiques">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4 h-auto py-0">
                  <TabsTrigger value="caracteristiques" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 py-3">
                    Caractéristiques
                  </TabsTrigger>
                  <TabsTrigger value="boutique" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 py-3">
                    La boutique
                  </TabsTrigger>
                  <TabsTrigger value="avis" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 py-3">
                    Avis ({product.reviews_count ?? 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="caracteristiques" className="p-4 lg:p-6 mt-0">
                  <dl className="divide-y divide-gray-100">
                    <Row label="Rayon">{CATEGORY_LABEL[product.category] ?? product.category}</Row>
                    {product.brand && <Row label="Marque">{product.brand}</Row>}
                    {product.weight && (
                      <Row label="Conditionnement">
                        {product.weight} {product.weight_unit}
                        {perUnit && <span className="text-gray-500"> — soit {perUnit.label}</span>}
                      </Row>
                    )}
                    <Row label="Date limite">{formatDate(product.expiration_date)}</Row>
                    <Row label="Disponibilité">
                      {stock > 0 ? `${stock} en stock` : 'Épuisé'}
                    </Row>
                    {product.barcode && <Row label="Code-barres">{product.barcode}</Row>}
                    {product.allergens?.length > 0 && (
                      <Row label="Allergènes">
                        <span className="flex items-center gap-1.5 text-amber-700">
                          <AlertTriangle className="w-4 h-4" />
                          {product.allergens.join(', ')}
                        </span>
                      </Row>
                    )}
                  </dl>

                  {product.nutritional_info && Object.keys(product.nutritional_info).length > 0 && (
                    <>
                      <h3 className="text-sm font-semibold text-gray-900 mt-6 mb-2">
                        Valeurs nutritionnelles
                      </h3>
                      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Object.entries(product.nutritional_info).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 rounded-lg p-3">
                            <dt className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</dt>
                            <dd className="text-sm font-semibold text-gray-900">{String(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="boutique" className="p-4 lg:p-6 mt-0">
                  <div className="flex items-start gap-4">
                    <span className="w-12 h-12 rounded-lg bg-emerald-50 grid place-items-center shrink-0">
                      <Store className="w-6 h-6 text-emerald-600" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{product.store_name}</p>
                      {product.store_location && (
                        <p className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" /> {product.store_location}
                        </p>
                      )}
                      <Link
                        to={createPageUrl(`Catalog?store=${encodeURIComponent(product.store_name)}`)}
                        className="inline-block mt-3 text-sm font-medium text-emerald-700 hover:underline"
                      >
                        Voir tous les articles de cette boutique
                      </Link>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="avis" className="p-4 lg:p-6 mt-0">
                  {product.reviews_count > 0 ? (
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-bold text-gray-900">
                        {product.avg_rating?.toFixed(1)}
                      </span>
                      <div>
                        <Rating value={product.avg_rating} />
                        <p className="text-sm text-gray-500 mt-1">
                          Moyenne sur {product.reviews_count} avis clients
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Ce produit n'a pas encore d'avis. Le vôtre sera le premier.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Bloc d'achat */}
          <aside className="lg:sticky lg:top-40 lg:self-start">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatXAF(product.discounted_price)}
                  </span>
                  {savings > 0 && (
                    <span className="text-base text-gray-400 line-through">
                      {formatXAF(product.original_price)}
                    </span>
                  )}
                </div>
                {perUnit && <p className="text-xs text-gray-500 mt-0.5">{perUnit.label}</p>}
                {savings > 0 && (
                  <p className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-sm font-medium">
                    <Award className="w-3.5 h-3.5" />
                    Vous économisez {formatXAF(savings)}
                  </p>
                )}
              </div>

              <StockLine stock={stock} />

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Quantité</span>
                <div className="flex items-center border border-gray-200 rounded-md">
                  <button
                    type="button"
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    disabled={quantity <= 1}
                    aria-label="Diminuer la quantité"
                    className="px-3 py-2 text-gray-500 disabled:opacity-30"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-medium tabular-nums">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
                    disabled={quantity >= maxQuantity}
                    aria-label="Augmenter la quantité"
                    className="px-3 py-2 text-gray-500 disabled:opacity-30"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <Button
                onClick={add}
                disabled={stock === 0 || isAdding}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-base"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {stock === 0 ? 'Produit épuisé' : `Ajouter — ${formatXAF(product.discounted_price * quantity)}`}
              </Button>

              <ul className="space-y-2 pt-2 border-t border-gray-100 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Store className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>
                    Retrait gratuit chez <strong className="font-medium">{product.store_name}</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Truck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>
                    Livraison {formatXAF(config?.delivery_fee ?? 0)}
                    {config?.free_delivery_threshold
                      ? `, offerte dès ${formatXAF(config.free_delivery_threshold)} d'achat`
                      : ''}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Paiement Orange Money, MTN MoMo ou à la livraison</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>

        {similar?.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Dans le même rayon</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
              {similar.map((item) => (
                <ProductCard key={item.id} product={item} onAddToCart={addToCart} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function StockLine({ stock }) {
  if (stock === 0) {
    return <p className="text-sm font-medium text-red-600">Épuisé pour le moment</p>;
  }
  if (stock <= 5) {
    return (
      <p className="text-sm font-medium text-orange-600">
        Plus que {stock} en stock — commandez vite
      </p>
    );
  }
  return (
    <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
      <Check className="w-4 h-4" /> En stock ({stock} disponibles)
    </p>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex gap-4 py-2.5 text-sm">
      <dt className="w-40 shrink-0 text-gray-500">{label}</dt>
      <dd className="text-gray-900">{children}</dd>
    </div>
  );
}

function Tag({ icon: Icon, tone = 'neutral', children }) {
  const tones = {
    neutral: 'bg-gray-100 text-gray-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${tones[tone]}`}>
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {children}
    </span>
  );
}

function Rating({ value = 0 }) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <span className="flex items-center" aria-label={`Noté ${rounded} sur 5`}>
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          className={`w-4 h-4 ${index <= rounded ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function DetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 grid lg:grid-cols-[minmax(0,1fr)_22rem] gap-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 grid md:grid-cols-2 gap-6">
        <Skeleton className="aspect-square rounded-lg" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Ce produit n'est plus disponible</h1>
      <p className="text-sm text-gray-500 mb-6">
        Il a peut-être été vendu — le catalogue anti-gaspillage tourne vite.
      </p>
      <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
        <Link to={createPageUrl('Catalog')}>Retour au catalogue</Link>
      </Button>
    </div>
  );
}
