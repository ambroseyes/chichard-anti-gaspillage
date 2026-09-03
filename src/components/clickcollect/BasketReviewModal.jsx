import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Star } from 'lucide-react';

const CRITERIA = [
  { key: 'rating_quality', label: 'Qualité', emoji: '🌟' },
  { key: 'rating_freshness', label: 'Fraîcheur', emoji: '🌿' },
  { key: 'rating_quantity', label: 'Quantité / rapport prix', emoji: '⚖️' },
];

const TAGS = ['Bien garni', 'Très frais', 'Conforme description', 'Bonne variété', 'Emballage soigné', 'Rapport qualité/prix', 'Personnel accueillant'];

function StarRating({ value, onChange, size = 'md' }) {
  const [hovered, setHovered] = useState(0);
  const sz = size === 'lg' ? 'w-9 h-9' : 'w-6 h-6';
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`${sz} ${(hovered || value) >= star ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function BasketReviewModal({ reservation, user, open, onClose }) {
  const qc = useQueryClient();
  const [ratings, setRatings] = useState({ rating_overall: 0, rating_quality: 0, rating_freshness: 0, rating_quantity: 0 });
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [wouldRecommend, setWouldRecommend] = useState(null);

  const toggleTag = (tag) => setSelectedTags(prev =>
    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
  );

  const { mutate: submitReview, isPending } = useMutation({
    mutationFn: () => api.entities.BasketReview.create({
      reservation_id: reservation.id,
      basket_id: reservation.basket_id,
      basket_name: reservation.basket_name,
      store_id: reservation.store_id,
      store_name: reservation.store_name,
      customer_email: user.email,
      customer_name: user.full_name,
      ...ratings,
      comment,
      tags: selectedTags,
      would_recommend: wouldRecommend,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['basket-reviews'] });
      qc.invalidateQueries({ queryKey: ['store-reviews', reservation.store_id] });
      toast.success('Merci pour votre avis ! 🙏');
      onClose();
    },
    onError: () => toast.error('Erreur lors de l\'envoi, réessayez.'),
  });

  const handleClose = () => {
    setRatings({ rating_overall: 0, rating_quality: 0, rating_freshness: 0, rating_quantity: 0 });
    setComment('');
    setSelectedTags([]);
    setWouldRecommend(null);
    onClose();
  };

  if (!reservation) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            Notez votre panier
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Basket info */}
          <div className="p-3 bg-gray-50 rounded-xl text-sm">
            <p className="font-semibold text-gray-900">{reservation.basket_name}</p>
            <p className="text-gray-500">{reservation.store_name} · {reservation.pickup_date}</p>
          </div>

          {/* Overall rating */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-2">Note globale</p>
            <div className="flex justify-center">
              <StarRating size="lg" value={ratings.rating_overall} onChange={v => setRatings(r => ({ ...r, rating_overall: v }))} />
            </div>
            {ratings.rating_overall > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {['', 'Très déçu', 'Déçu', 'Correct', 'Bien', 'Excellent !'][ratings.rating_overall]}
              </p>
            )}
          </div>

          {/* Detailed criteria */}
          <div className="space-y-3 border-t pt-4">
            <p className="text-sm font-medium text-gray-700">Critères détaillés</p>
            {CRITERIA.map(c => (
              <div key={c.key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{c.emoji} {c.label}</span>
                <StarRating value={ratings[c.key]} onChange={v => setRatings(r => ({ ...r, [c.key]: v }))} />
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Qu'avez-vous apprécié ?</p>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'border-gray-200 text-gray-600 hover:border-emerald-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Commentaire (optionnel)</p>
            <Textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Partagez votre expérience avec ce panier..."
              className="resize-none h-20"
            />
          </div>

          {/* Recommend */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Recommanderiez-vous ce magasin ?</p>
            <div className="flex gap-3">
              {[{ val: true, label: '👍 Oui', active: 'bg-emerald-500 text-white border-emerald-500' },
                { val: false, label: '👎 Non', active: 'bg-red-500 text-white border-red-500' }].map(({ val, label, active }) => (
                <button
                  key={String(val)}
                  onClick={() => setWouldRecommend(val)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                    wouldRecommend === val ? active : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full bg-emerald-500 hover:bg-emerald-600"
            disabled={ratings.rating_overall === 0 || isPending}
            onClick={() => submitReview()}
          >
            {isPending ? 'Envoi...' : '✅ Publier mon avis'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}