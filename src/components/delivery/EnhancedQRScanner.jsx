import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, Keyboard, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/api';

/**
 * Validation d'une remise.
 *
 * Le scanner ne décide rien : il transmet le jeton lu (ou le code saisi) au
 * serveur, seul à détenir le secret de signature. Un code fabriqué à partir de
 * l'identifiant de commande est rejeté.
 */
export default function EnhancedQRScanner({ open, onClose, order, onSuccess }) {
  const [manualCode, setManualCode] = useState('');
  const [mode, setMode] = useState('camera');
  const scannerRef = useRef(null);

  const validate = useMutation({
    mutationFn: (payload) => api.orders.fulfil(order.id, payload),
    onSuccess: (updated) => {
      toast.success('Remise validée');
      scannerRef.current?.clear().catch(() => {});
      onSuccess?.(updated);
      onClose();
    },
    onError: (error) => toast.error(error.message ?? 'Code de retrait invalide'),
  });

  useEffect(() => {
    if (!open || mode !== 'camera') return undefined;

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1, formatsToSupport: [0] },
      false,
    );
    scanner.render(
      (decoded) => validate.mutate({ token: decoded }),
      () => {
        // Absence de code dans l'image : c'est le cas nominal entre deux lectures.
      },
    );
    scannerRef.current = scanner;

    return () => {
      scanner.clear().catch(() => {});
      scannerRef.current = null;
    };
    // `validate` est stable pour une commande donnée.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, order?.id]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            Valider la remise
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === 'camera' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => setMode('camera')}
          >
            <Camera className="w-4 h-4 mr-1.5" />
            Scanner
          </Button>
          <Button
            variant={mode === 'manual' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => setMode('manual')}
          >
            <Keyboard className="w-4 h-4 mr-1.5" />
            Saisir le code
          </Button>
        </div>

        {mode === 'camera' ? (
          <div id="qr-reader" className="rounded-lg overflow-hidden" />
        ) : (
          <div className="space-y-3">
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX"
              className="text-center text-lg font-mono tracking-widest"
              autoFocus
            />
            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-600"
              disabled={!manualCode || validate.isPending}
              onClick={() => validate.mutate({ code: manualCode })}
            >
              {validate.isPending ? 'Vérification…' : 'Valider'}
            </Button>
            <p className="text-xs text-gray-400 text-center">
              Le code figure sur la confirmation du client.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
