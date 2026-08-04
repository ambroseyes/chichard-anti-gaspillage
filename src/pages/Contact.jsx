import React, { useState } from 'react';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setSending(true);
    // Simulate sending — in production this would call a backend function
    await new Promise(r => setTimeout(r, 800));
    setSending(false);
    toast.success('Message envoyé ! Nous vous répondrons rapidement.');
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-20 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Contactez-nous</h1>
          <p className="text-emerald-50 text-lg">Une question, une suggestion ou une demande de partenariat ? Écrivez-nous !</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8">
        {/* Contact methods */}
        <div className="space-y-4">
          <Card className="p-5 flex items-start gap-4">
            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Email</h2>
              <p className="text-gray-500 text-sm mb-1">Pour toute question générale</p>
              <a href="mailto:contact@chichard.com" className="text-emerald-600 font-medium hover:underline">contact@chichard.com</a>
            </div>
          </Card>

          <Card className="p-5 flex items-start gap-4">
            <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Téléphone</h2>
              <p className="text-gray-500 text-sm mb-1">Du lundi au vendredi, 9h - 18h</p>
              <a href="tel:+237600000000" className="text-teal-600 font-medium hover:underline">+237 6XX XX XX XX</a>
            </div>
          </Card>

          <Card className="p-5 flex items-start gap-4">
            <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Adresse</h2>
              <p className="text-gray-500 text-sm mb-1">Douala, Cameroun</p>
              <span className="text-gray-700 text-sm">Bd de la Liberté, Douala</span>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Suivez-nous</h2>
            <div className="flex gap-3">
              <a href="#" aria-label="Facebook" className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-colors">
                <Facebook className="w-5 h-5 text-blue-600" />
              </a>
              <a href="#" aria-label="Instagram" className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center hover:bg-pink-100 transition-colors">
                <Instagram className="w-5 h-5 text-pink-600" />
              </a>
              <a href="#" aria-label="Twitter" className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center hover:bg-sky-100 transition-colors">
                <Twitter className="w-5 h-5 text-sky-600" />
              </a>
            </div>
          </Card>
        </div>

        {/* Contact form */}
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Envoyez un message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nom complet</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Votre nom"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="vous@exemple.com"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Votre message..."
                rows={5}
              />
            </div>
            <Button type="submit" disabled={sending} className="w-full bg-emerald-500 hover:bg-emerald-600">
              {sending ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Envoi...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Envoyer
                </span>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}