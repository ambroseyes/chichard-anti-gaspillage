import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthShell from '@/components/auth/AuthShell';
import { useAuth } from '@/lib/AuthContext';

const MIN_PASSWORD = 10;

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', city: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password.length < MIN_PASSWORD) {
      toast.error(`Le mot de passe doit faire au moins ${MIN_PASSWORD} caractères`);
      return;
    }
    setSubmitting(true);
    try {
      await register({ ...form, email: form.email.trim().toLowerCase() });
      toast.success('Bienvenue sur Chichard');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.message ?? "L'inscription n'a pas abouti");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Créer un compte"
      subtitle="Quelques secondes suffisent."
      footer={
        <>
          Déjà inscrit ?{' '}
          <Link to="/connexion" className="text-emerald-600 font-medium hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Nom complet</Label>
          <Input id="full_name" required value={form.full_name} onChange={set('full_name')} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Adresse e-mail</Label>
          <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" inputMode="tel" placeholder="6XX XX XX XX" value={form.phone} onChange={set('phone')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">Ville</Label>
            <Input id="city" placeholder="Douala" value={form.city} onChange={set('city')} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD}
            value={form.password}
            onChange={set('password')}
          />
          <p className="text-xs text-gray-400">{MIN_PASSWORD} caractères minimum.</p>
        </div>

        <Button type="submit" disabled={submitting} className="w-full h-11 bg-emerald-500 hover:bg-emerald-600">
          {submitting ? 'Création…' : 'Créer mon compte'}
        </Button>
      </form>
    </AuthShell>
  );
}
