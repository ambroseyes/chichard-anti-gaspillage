import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star, ThumbsUp } from 'lucide-react';

export default function StoreRatingBadge({ storeId, storeName, showDetails = false }) {
  const { data: reviews = [] } = useQuery({
    queryKey: ['store-reviews', storeId],
    queryFn: () => base44.entities.BasketReview.filter({ store_id: storeId }, '-created_date', 100),
    enabled: !!storeId,
  });

  if (reviews.length === 0) return (
    <span className="text-xs text-gray-400 flex items-center gap-1">
      <Star className="w-3.5 h-3.5" /> Nouveau
    </span>
  );

  const avg = (reviews.reduce((s, r) => s + (r.rating_overall || 0), 0) / reviews.length).toFixed(1);
  const freshAvg = reviews.filter(r => r.rating_freshness).length
    ? (reviews.reduce((s, r) => s + (r.rating_freshness || 0), 0) / reviews.filter(r => r.rating_freshness).length).toFixed(1)
    : null;
  const recommend = reviews.filter(r => r.would_recommend === true).length;
  const recommendPct = Math.round((recommend / reviews.length) * 100);

  if (!showDetails) {
    return (
      <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
        {avg}
        <span className="text-xs font-normal text-gray-400">({reviews.length})</span>
      </span>
    );
  }

  return (
    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm">{storeName}</h3>
        <div className="flex items-center gap-1">
          {[1,2,3,4,5].map(s => (
            <Star key={s} className={`w-4 h-4 ${s <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
          ))}
          <span className="text-lg font-bold text-amber-600 ml-1">{avg}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-white rounded-lg p-2">
          <p className="font-bold text-gray-900">{avg}</p>
          <p className="text-gray-400">Note globale</p>
        </div>
        {freshAvg && (
          <div className="bg-white rounded-lg p-2">
            <p className="font-bold text-emerald-600">{freshAvg}</p>
            <p className="text-gray-400">Fraîcheur</p>
          </div>
        )}
        <div className="bg-white rounded-lg p-2">
          <p className="font-bold text-blue-600">{recommendPct}%</p>
          <p className="text-gray-400">Recommandent</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">Basé sur {reviews.length} avis vérifiés</p>
    </div>
  );
}