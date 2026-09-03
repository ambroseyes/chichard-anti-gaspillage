import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthShell from '@/components/auth/AuthShell';
import { api } from '@/api';

const MIN_PASSWORD = 10;

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.auth.resetPassword(token, password);
      toast.success('Mot de passe modifié, vous pouvez vous connecter');
      navigate('/connexion', { replace: true });
    } catch (error) {
      toast.error(error.message ?? 'Lien expiré ou déjà utilisé');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <AuthShell title="Lien invalide" subtitle="Ce lien de réinitialisation est incomplet.">
        <Button className="w-full" onClick={() => navigate('/mot-de-passe-oublie')}>
          Demander un nouveau lien
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Nouveau mot de passe">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-gray-400">{MIN_PASSWORD} caractères minimum.</p>
        </div>
        <Button type="submit" disabled={submitting} className="w-full h-11 bg-emerald-500 hover:bg-emerald-600">
          {submitting ? 'Enregistrement…' : 'Changer mon mot de passe'}
        </Button>
      </form>
    </AuthShell>
  );
}
