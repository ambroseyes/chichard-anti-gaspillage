import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthShell from '@/components/auth/AuthShell';
import { api } from '@/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.auth.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      // La réponse est volontairement identique que le compte existe ou non.
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="Nous vous envoyons un lien de réinitialisation."
      footer={
        <Link to="/connexion" className="text-emerald-600 font-medium hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            Si un compte existe pour <strong>{email}</strong>, un lien vient d’y être envoyé. Il est
            valable une heure.
          </p>
          <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
            Essayer une autre adresse
          </Button>
        </div>
      ) : (
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
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full h-11 bg-emerald-500 hover:bg-emerald-600">
            {submitting ? 'Envoi…' : 'Envoyer le lien'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
