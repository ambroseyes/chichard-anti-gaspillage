import React, { useState } from 'react';
import { api } from '@/api';
import { X, TrendingUp, Leaf, Send, Image } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

export default function CreatePostModal({ open, onClose, user, onSuccess }) {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('savings');
  const [savingsAmount, setSavingsAmount] = useState('');
  const [wasteAvoided, setWasteAvoided] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const { file_url } = await api.uploads.file(file);
    setImageUrl(file_url);
    setIsUploading(false);
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Écrivez quelque chose !');
      return;
    }

    setIsPosting(true);

    await api.entities.SocialPost.create({
      author_email: user.email,
      author_name: user.full_name,
      author_avatar: user.avatar_url,
      author_eco_level: user.eco_level || 'debutant',
      content,
      post_type: postType,
      savings_amount: savingsAmount ? Number(savingsAmount) : null,
      waste_avoided_kg: wasteAvoided ? Number(wasteAvoided) : null,
      image_url: imageUrl,
      likes_count: 0,
      comments_count: 0,
      liked_by: [],
    });

    // Update user eco points
    await api.auth.updateMe({
      eco_points: (user.eco_points || 0) + 10
    });

    setIsPosting(false);
    toast.success('Post publié !');
    
    // Reset form
    setContent('');
    setPostType('savings');
    setSavingsAmount('');
    setWasteAvoided('');
    setImageUrl('');
    
    onSuccess?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Partager avec la communauté</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Post Type */}
          <div>
            <Label>Type de publication</Label>
            <Select value={postType} onValueChange={setPostType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="savings">💰 Économie réalisée</SelectItem>
                <SelectItem value="recipe">🍳 Recette anti-gaspi</SelectItem>
                <SelectItem value="tip">💡 Astuce</SelectItem>
                <SelectItem value="deal">🔥 Bon plan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div>
            <Label>Votre message</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Partagez votre expérience avec la communauté..."
              className="min-h-[120px]"
            />
          </div>

          {/* Stats for savings posts */}
          {postType === 'savings' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Économies (FCFA)
                </Label>
                <Input
                  type="number"
                  value={savingsAmount}
                  onChange={(e) => setSavingsAmount(e.target.value)}
                  placeholder="Ex: 5000"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-teal-500" />
                  Gaspillage évité (kg)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  value={wasteAvoided}
                  onChange={(e) => setWasteAvoided(e.target.value)}
                  placeholder="Ex: 2.5"
                />
              </div>
            </div>
          )}

          {/* Image upload */}
          <div>
            <Label>Photo (optionnel)</Label>
            {imageUrl ? (
              <div className="relative mt-2">
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-xl"
                />
                <button
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full h-24 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 mt-2">
                <Image className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {isUploading ? 'Chargement...' : 'Ajouter une photo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </label>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isPosting || !content.trim()}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
            >
              {isPosting ? 'Publication...' : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Publier
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}