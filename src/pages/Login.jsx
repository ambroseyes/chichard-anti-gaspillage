import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthShell from '@/components/auth/AuthShell';
import { useAuth } from '@/lib/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password);
      // On ne revient que vers un chemin interne : pas de redirection ouverte.
      const next = params.get('suite');
      navigate(next?.startsWith('/') ? next : '/', { replace: true });
    } catch (error) {
      toast.error(error.message ?? 'Connexion impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Connexion"
      subtitle="Retrouvez vos commandes et vos points de fidélité."
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="text-emerald-600 font-medium hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Adresse e-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.cm"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mot de passe</Label>
            <Link to="/mot-de-passe-oublie" className="text-xs text-emerald-600 hover:underline">
              Oublié ?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button type="submit" disabled={submitting} className="w-full h-11 bg-emerald-500 hover:bg-emerald-600">
          {submitting ? 'Connexion…' : 'Se connecter'}
        </Button>
      </form>
    </AuthShell>
  );
}
