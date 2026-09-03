import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

/**
 * Affiche le jeton de retrait émis par le serveur.
 *
 * Le jeton est signé (HMAC) côté serveur : il ne peut être ni fabriqué ni
 * modifié ici. Le code court sert de repli quand la caméra ne lit rien.
 */
export default function QRCodeGenerator({ pickupToken, confirmationCode, orderNumber }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !pickupToken) return;
    QRCode.toCanvas(canvasRef.current, pickupToken, {
      width: 220,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#0F172A', light: '#FFFFFF' },
    }).catch(() => toast.error("Le QR code n'a pas pu être généré"));
  }, [pickupToken]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `retrait-${orderNumber ?? 'commande'}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(confirmationCode ?? pickupToken);
      setCopied(true);
      toast.success('Code copié');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copie impossible sur ce navigateur');
    }
  };

  if (!pickupToken && !confirmationCode) {
    return (
      <div className="p-4 bg-gray-50 border rounded-lg text-sm text-gray-500 text-center">
        Le code de retrait apparaîtra ici une fois la commande enregistrée.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-xl border">
      {pickupToken && <canvas ref={canvasRef} className="border rounded-lg" aria-label="QR code de retrait" />}

      {confirmationCode && (
        <div className="text-center">
          <p className="text-xs text-gray-500">Code à présenter</p>
          <p className="text-2xl font-mono font-bold tracking-widest text-gray-900">{confirmationCode}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={handleCopy}>
          {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
          {copied ? 'Copié' : 'Copier'}
        </Button>
        {pickupToken && (
          <Button size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-1" />
            Télécharger
          </Button>
        )}
      </div>
    </div>
  );
}
