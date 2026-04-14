import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  QrCode, CheckCircle, X, Loader2, Camera, FileSignature,
  Package, ScanLine, Trash2, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function MultiBulkScanner({ open, onClose, availableOrders, driverEmail, onSuccess }) {
  const [step, setStep] = useState('scan'); // 'scan' | 'signature'
  const [scannedOrders, setScannedOrders] = useState([]);
  const [manualCode, setManualCode] = useState('');
  const [signature, setSignature] = useState('');
  const [proofPhoto, setProofPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep('scan');
      setScannedOrders([]);
      setManualCode('');
      setSignature('');
      setProofPhoto(null);
    }
  }, [open]);

  const handleScan = (codeInput) => {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;

    // Match by order ID suffix or QR code
    const matched = availableOrders.find(o =>
      o.id === code ||
      o.id?.slice(-8).toUpperCase() === code ||
      o.qr_code === code ||
      o.id?.includes(code)
    );

    if (!matched) {
      toast.error(`Code non reconnu: ${code}`);
      setManualCode('');
      return;
    }

    if (scannedOrders.find(o => o.id === matched.id)) {
      toast.warning('Colis déjà scanné');
      setManualCode('');
      return;
    }

    setScannedOrders(prev => [...prev, matched]);
    setManualCode('');
    toast.success(`✓ Colis ajouté: ${matched.customer_name}`);
  };

  const removeOrder = (id) => {
    setScannedOrders(prev => prev.filter(o => o.id !== id));
  };

  const handleBulkDeliver = async () => {
    if (!signature.trim()) {
      toast.error('Signature du réceptionnaire requise');
      return;
    }
    setIsSubmitting(true);

    let photo_url = null;
    if (proofPhoto) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: proofPhoto });
      photo_url = file_url;
    }

    const proofData = {
      signature,
      photo_url,
      timestamp: new Date().toISOString(),
      bulk_session: true,
      delivered_by: driverEmail,
    };

    // Update all scanned orders in parallel
    await Promise.all(
      scannedOrders.map(order =>
        base44.entities.Order.update(order.id, {
          status: 'delivered',
          delivery_proof: proofData,
          delivered_at: new Date().toISOString(),
          delivered_by: driverEmail,
        })
      )
    );

    queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
    toast.success(`🎉 ${scannedOrders.length} colis marqués comme livrés !`);
    setIsSubmitting(false);
    onSuccess?.(scannedOrders);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-blue-500" />
            Scan multiple — Session de livraison
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4 mt-2"
            >
              {/* Manual code input */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Scanner ou saisir le code colis
                </label>
                <div className="flex gap-2">
                  <Input
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleScan(manualCode)}
                    placeholder="ID commande ou code QR..."
                    className="font-mono"
                    autoFocus
                  />
                  <Button onClick={() => handleScan(manualCode)} className="bg-blue-600 hover:bg-blue-700 flex-shrink-0">
                    <QrCode className="w-4 h-4 mr-1" />
                    Valider
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Entrez les 8 derniers caractères de l'ID ou scannez le QR</p>
              </div>

              {/* Quick-add from available orders */}
              {availableOrders.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Ajouter rapidement :</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {availableOrders.map(order => {
                      const already = scannedOrders.find(o => o.id === order.id);
                      return (
                        <button
                          key={order.id}
                          disabled={!!already}
                          onClick={() => !already && setScannedOrders(prev => [...prev, order])}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm border transition-colors ${
                            already
                              ? 'bg-green-50 border-green-200 text-green-700 cursor-default'
                              : 'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-200'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {already
                              ? <CheckCircle className="w-4 h-4 text-green-500" />
                              : <Package className="w-4 h-4 text-gray-400" />
                            }
                            <span className="font-medium">{order.customer_name}</span>
                            <span className="text-gray-400 font-mono text-xs">#{order.id?.slice(-6)}</span>
                          </span>
                          {!already && <ChevronRight className="w-3 h-3 text-gray-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Scanned list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-800">
                    Colis scannés
                    <Badge className="ml-2 bg-blue-100 text-blue-700">{scannedOrders.length}</Badge>
                  </p>
                </div>
                {scannedOrders.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 border-2 border-dashed rounded-xl">
                    <ScanLine className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucun colis scanné</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {scannedOrders.map((order, idx) => (
                      <div key={order.id} className="flex items-center gap-3 p-2.5 bg-blue-50 border border-blue-100 rounded-xl">
                        <span className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{order.customer_name}</p>
                          <p className="text-xs text-gray-500 truncate">{order.delivery_address}</p>
                        </div>
                        <span className="text-xs font-bold text-emerald-600">{order.total_amount?.toLocaleString()} F</span>
                        <button onClick={() => removeOrder(order.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
                <Button
                  onClick={() => setStep('signature')}
                  disabled={scannedOrders.length === 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Continuer ({scannedOrders.length})
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'signature' && (
            <motion.div
              key="signature"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 mt-2"
            >
              {/* Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <p className="text-sm font-semibold text-blue-800 mb-1">
                  Confirmation de {scannedOrders.length} colis
                </p>
                <p className="text-xs text-blue-600">
                  {scannedOrders.map(o => o.customer_name).join(', ')}
                </p>
                <p className="text-sm font-bold text-blue-900 mt-2">
                  Total: {scannedOrders.reduce((s, o) => s + (o.total_amount || 0), 0).toLocaleString()} FCFA
                </p>
              </div>

              {/* Signature */}
              <div>
                <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5 block">
                  <FileSignature className="w-4 h-4 text-gray-500" />
                  Nom du réceptionnaire *
                </label>
                <Input
                  value={signature}
                  onChange={e => setSignature(e.target.value)}
                  placeholder="Nom complet de la personne qui reçoit"
                  autoFocus
                />
              </div>

              {/* Photo */}
              <div>
                <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5 block">
                  <Camera className="w-4 h-4 text-gray-500" />
                  Photo de remise (optionnel)
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={e => setProofPhoto(e.target.files[0])}
                />
                {proofPhoto && (
                  <p className="text-xs text-emerald-600 mt-1">✓ {proofPhoto.name}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep('scan')} className="flex-1">
                  ← Retour
                </Button>
                <Button
                  onClick={handleBulkDeliver}
                  disabled={!signature.trim() || isSubmitting}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  {isSubmitting
                    ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    : <CheckCircle className="w-4 h-4 mr-2" />
                  }
                  Confirmer {scannedOrders.length} livraison{scannedOrders.length > 1 ? 's' : ''}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}