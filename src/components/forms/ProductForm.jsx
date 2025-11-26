import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  Package, Calendar, Tag, Image, Barcode, Scale,
  AlertTriangle, Sparkles, Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from 'sonner';

const categories = [
  { id: 'fruits_legumes', label: 'Fruits & Légumes' },
  { id: 'produits_laitiers', label: 'Produits Laitiers' },
  { id: 'viandes_poissons', label: 'Viandes & Poissons' },
  { id: 'boulangerie', label: 'Boulangerie' },
  { id: 'epicerie', label: 'Épicerie' },
  { id: 'boissons', label: 'Boissons' },
  { id: 'surgeles', label: 'Surgelés' },
  { id: 'conserves', label: 'Conserves' },
];

export default function ProductForm({ product, user, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    original_price: product?.original_price || '',
    discounted_price: product?.discounted_price || '',
    category: product?.category || 'epicerie',
    expiration_date: product?.expiration_date || '',
    quantity_available: product?.quantity_available || 1,
    weight: product?.weight || '',
    weight_unit: product?.weight_unit || 'g',
    barcode: product?.barcode || '',
    brand: product?.brand || '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  const suggestPrice = async () => {
    if (!formData.original_price || !formData.expiration_date) {
      toast.error('Renseignez le prix original et la date d\'expiration');
      return;
    }
    
    setAiSuggesting(true);
    const daysLeft = Math.ceil((new Date(formData.expiration_date) - new Date()) / (1000 * 60 * 60 * 24));
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Suggère un prix réduit optimal pour ce produit anti-gaspillage:
- Prix original: ${formData.original_price} FCFA
- Jours avant expiration: ${daysLeft}
- Catégorie: ${formData.category}

Retourne uniquement un JSON: {"suggested_price": number, "discount_percent": number, "reason": "string"}`,
        response_json_schema: {
          type: "object",
          properties: {
            suggested_price: { type: "number" },
            discount_percent: { type: "number" },
            reason: { type: "string" }
          }
        }
      });
      
      setFormData({ ...formData, discounted_price: result.suggested_price });
      toast.success(`Prix suggéré: ${result.suggested_price} FCFA (-${result.discount_percent}%)`);
    } catch (e) {
      const discount = daysLeft <= 1 ? 0.3 : daysLeft <= 3 ? 0.5 : 0.7;
      setFormData({ ...formData, discounted_price: Math.round(formData.original_price * discount) });
    }
    setAiSuggesting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let image_url = product?.image_url;
      
      if (imageFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
        image_url = file_url;
      }

      const productData = {
        ...formData,
        image_url,
        store_name: user.store_name || user.full_name,
        store_id: user.store_id,
        status: 'active',
        original_price: Number(formData.original_price),
        discounted_price: Number(formData.discounted_price),
        quantity_available: Number(formData.quantity_available),
        weight: formData.weight ? Number(formData.weight) : null,
      };

      if (product?.id) {
        await base44.entities.Product.update(product.id, productData);
        toast.success('Produit mis à jour');
      } else {
        await base44.entities.Product.create(productData);
        toast.success('Produit ajouté');
      }
      
      onSuccess?.();
    } catch (e) {
      toast.error('Erreur lors de l\'enregistrement');
    }
    setLoading(false);
  };

  const discount = formData.original_price && formData.discounted_price
    ? Math.round((1 - formData.discounted_price / formData.original_price) * 100)
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <Label>Nom du produit *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Yaourt nature"
              required
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description du produit..."
              rows={3}
            />
          </div>

          <div>
            <Label>Catégorie *</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Date d'expiration *</Label>
            <Input
              type="date"
              value={formData.expiration_date}
              onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <Label>Image du produit</Label>
            <Input type="file" accept="image/*" onChange={handleImageUpload} />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prix original (FCFA) *</Label>
              <Input
                type="number"
                value={formData.original_price}
                onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                placeholder="5000"
                required
              />
            </div>
            <div>
              <Label>Prix réduit (FCFA) *</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={formData.discounted_price}
                  onChange={(e) => setFormData({ ...formData, discounted_price: e.target.value })}
                  placeholder="2500"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={suggestPrice}
                  disabled={aiSuggesting}
                  className="shrink-0"
                >
                  {aiSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          {discount > 0 && (
            <Card className="p-3 bg-emerald-50 border-emerald-200">
              <p className="text-emerald-700 font-medium">
                Réduction: -{discount}% ({(formData.original_price - formData.discounted_price).toLocaleString()} FCFA économisés)
              </p>
            </Card>
          )}

          <div>
            <Label>Quantité disponible *</Label>
            <Input
              type="number"
              value={formData.quantity_available}
              onChange={(e) => setFormData({ ...formData, quantity_available: e.target.value })}
              min="1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Poids</Label>
              <Input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="500"
              />
            </div>
            <div>
              <Label>Unité</Label>
              <Select value={formData.weight_unit} onValueChange={(v) => setFormData({ ...formData, weight_unit: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">Grammes (g)</SelectItem>
                  <SelectItem value="kg">Kilogrammes (kg)</SelectItem>
                  <SelectItem value="L">Litres (L)</SelectItem>
                  <SelectItem value="mL">Millilitres (mL)</SelectItem>
                  <SelectItem value="piece">Pièce</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Marque</Label>
              <Input
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Marque"
              />
            </div>
            <div>
              <Label>Code-barres</Label>
              <Input
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="EAN13"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={loading} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Package className="w-4 h-4 mr-2" />}
          {product?.id ? 'Mettre à jour' : 'Ajouter le produit'}
        </Button>
      </div>
    </form>
  );
}