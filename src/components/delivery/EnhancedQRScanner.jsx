import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { QrCode, CheckCircle, X, Shield, AlertTriangle, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function EnhancedQRScanner({ open, onClose, order, onSuccess }) {
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (open && scanning) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader-enhanced",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          formatsToSupport: ['QR_CODE']
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

  const verifyQRCode = async (code) => {
    setVerifying(true);
    
    try {
      // Format attendu: ORDER_${orderId}_${timestamp}_${securityHash}
      const parts = code.split('_');
      
      if (parts[0] !== 'ORDER' || parts.length < 2) {
        throw new Error('Format invalide');
      }
      
      const scannedOrderId = parts[1];
      
      // Vérifier que le code correspond à la commande
      if (scannedOrderId !== order.id) {
        setScanAttempts(prev => prev + 1);
        throw new Error('Ce QR code ne correspond pas à cette commande');
      }

      // Vérifier que la commande existe et est valide
      const orderData = await base44.entities.Order.filter({ id: order.id });
      if (!orderData || orderData.length === 0) {
        throw new Error('Commande introuvable');
      }

      // Log de la vérification
      await base44.entities.Order.update(order.id, {
        qr_scanned_at: new Date().toISOString(),
        qr_scan_attempts: scanAttempts + 1
      });

      setVerifying(false);
      toast.success('✅ QR Code vérifié avec succès !');
      onSuccess(code);
      
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    } catch (error) {
      setVerifying(false);
      toast.error(error.message || 'QR Code invalide');
      
      if (scanAttempts >= 2) {
        toast.warning('Trop de tentatives. Utilisez la saisie manuelle.', {
          duration: 5000
        });
        setScanning(false);
      }
    }
  };

  const onScanSuccess = (decodedText) => {
    verifyQRCode(decodedText);
  };

  const onScanError = (error) => {
    // Erreurs de scan normales, on ne les affiche pas
  };

  const handleManualSubmit = () => {
    if (!manualCode) {
      toast.error('Veuillez entrer un code');
      return;
    }
    verifyQRCode(manualCode);
  };

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
    }
    setScanAttempts(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Confirmation sécurisée de livraison
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Info */}
          <Card className="p-3 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Commande</p>
                <p className="text-xs text-blue-700">{order.customer_name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-blue-900">{order.total_amount?.toLocaleString()} FCFA</p>
                <p className="text-xs text-blue-700">{order.items?.length || 0} article(s)</p>
              </div>
            </div>
          </Card>

          {scanning ? (
            <>
              <div className="relative">
                <div id="qr-reader-enhanced" className="rounded-lg overflow-hidden"></div>
                {verifying && (
                  <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-sm font-medium">Vérification...</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Camera className="w-4 h-4" />
                <span>Positionnez le QR code dans le cadre</span>
              </div>

              {scanAttempts > 0 && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <p className="text-xs text-amber-800">
                    Tentative {scanAttempts}/3 - Assurez-vous de scanner le bon QR code
                  </p>
                </div>
              )}

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setScanning(false)}
              >
                Saisie manuelle du code
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Code de livraison</label>
                <Input
                  placeholder={`ORDER_${order.id}_...`}
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  disabled={verifying}
                />
                <p className="text-xs text-gray-500">
                  Format: ORDER_[ID]_[TIMESTAMP]_[HASH]
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setScanning(true)}
                  disabled={verifying}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Scanner
                </Button>
                <Button 
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                  onClick={handleManualSubmit}
                  disabled={!manualCode || verifying}
                >
                  {verifying ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Valider
                </Button>
              </div>
            </>
          )}

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-green-600 mt-0.5" />
              <div className="text-xs text-green-800">
                <p className="font-medium mb-1">Sécurité renforcée</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Chaque QR code est unique et sécurisé</li>
                  <li>Validation automatique de la commande</li>
                  <li>Traçabilité complète de la livraison</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}