import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';

export default function QRScanner({ open, onClose, orderId, onSuccess }) {
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(true);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (open && scanning) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      );

      scanner.render(onScanSuccess, onScanError);
      scannerRef.current = scanner;

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }
      };
    }
  }, [open, scanning]);

  const onScanSuccess = (decodedText) => {
    // Vérifier si le code correspond à la commande
    if (decodedText === `ORDER_${orderId}` || decodedText.includes(orderId)) {
      toast.success('QR Code validé !');
      onSuccess(decodedText);
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    } else {
      toast.error('QR Code invalide pour cette commande');
    }
  };

  const onScanError = (error) => {
    // Erreurs de scan normales, on ne les affiche pas
  };

  const handleManualSubmit = () => {
    if (manualCode === `ORDER_${orderId}` || manualCode.includes(orderId)) {
      toast.success('Code validé !');
      onSuccess(manualCode);
    } else {
      toast.error('Code invalide');
    }
  };

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Scanner le QR Code de livraison
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {scanning ? (
            <>
              <div id="qr-reader" className="rounded-lg overflow-hidden"></div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setScanning(false)}
              >
                Entrer le code manuellement
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Code de livraison</label>
                <Input
                  placeholder={`ORDER_${orderId}`}
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setScanning(true)}
                >
                  Scanner QR Code
                </Button>
                <Button 
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                  onClick={handleManualSubmit}
                  disabled={!manualCode}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Valider
                </Button>
              </div>
            </>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <p className="text-blue-800">
              💡 <strong>Astuce:</strong> Demandez au client de vous montrer le QR code présent sur sa confirmation de commande.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}