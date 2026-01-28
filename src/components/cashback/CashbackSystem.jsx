import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DollarSign, Upload, Check, Clock, TrendingUp, Gift, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function CashbackSystem({ userEmail }) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptData, setReceiptData] = useState({
    store_name: '',
    total_amount: '',
    purchase_date: new Date().toISOString().split('T')[0]
  });
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: receipts = [] } = useQuery({
    queryKey: ['digital-receipts', userEmail],
    queryFn: () => base44.entities.DigitalReceipt.filter({ user_email: userEmail }, '-created_date'),
    enabled: !!userEmail
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['loyalty-transactions', userEmail],
    queryFn: () => base44.entities.LoyaltyTransaction.filter({ user_email: userEmail }, '-created_date', 50),
    enabled: !!userEmail
  });

  const uploadReceiptMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.DigitalReceipt.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-transactions'] });
      setShowUploadDialog(false);
      resetForm();
      toast.success('Ticket ajouté ! Cashback en attente de validation');
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setReceiptFile(file_url);
      
      // Optional: Use AI to extract data from receipt
      try {
        const extractedData = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: {
            type: 'object',
            properties: {
              store_name: { type: 'string' },
              total_amount: { type: 'number' },
              purchase_date: { type: 'string' }
            }
          }
        });

        if (extractedData.status === 'success' && extractedData.output) {
          setReceiptData(prev => ({
            ...prev,
            ...extractedData.output
          }));
          toast.success('Données extraites automatiquement !');
        }
      } catch (error) {
        console.log('Auto-extraction failed, manual entry needed');
      }
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
    setIsUploading(false);
  };

  const handleSubmitReceipt = () => {
    if (!receiptData.store_name || !receiptData.total_amount) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const totalAmount = parseFloat(receiptData.total_amount);
    const cashbackRate = 0.05; // 5% cashback
    const cashbackAmount = Math.round(totalAmount * cashbackRate);

    uploadReceiptMutation.mutate({
      user_email: userEmail,
      store_name: receiptData.store_name,
      total_amount: totalAmount,
      purchase_date: receiptData.purchase_date,
      receipt_image_url: receiptFile,
      cashback_earned: cashbackAmount,
      cashback_status: 'pending',
      verified: false
    });

    // Create pending loyalty transaction
    base44.entities.LoyaltyTransaction.create({
      user_email: userEmail,
      transaction_type: 'cashback_pending',
      amount: cashbackAmount,
      description: `Cashback ${receiptData.store_name}`,
      status: 'pending'
    });
  };

  const resetForm = () => {
    setReceiptFile(null);
    setReceiptData({
      store_name: '',
      total_amount: '',
      purchase_date: new Date().toISOString().split('T')[0]
    });
  };

  const totalCashback = receipts
    .filter(r => r.cashback_status === 'approved' || r.cashback_status === 'paid')
    .reduce((sum, r) => sum + (r.cashback_earned || 0), 0);

  const pendingCashback = receipts
    .filter(r => r.cashback_status === 'pending')
    .reduce((sum, r) => sum + (r.cashback_earned || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cashback total</p>
              <p className="text-2xl font-bold text-emerald-600">
                {totalCashback.toLocaleString()} F
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">En attente</p>
              <p className="text-2xl font-bold text-orange-600">
                {pendingCashback.toLocaleString()} F
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Gift className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tickets scannés</p>
              <p className="text-2xl font-bold text-purple-600">
                {receipts.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Upload Button */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg mb-1">Gagnez du cashback</h3>
            <p className="text-gray-500 text-sm">
              Scannez vos tickets et recevez 5% de cashback sur vos achats
            </p>
          </div>
          <Button onClick={() => setShowUploadDialog(true)} className="bg-emerald-500">
            <Camera className="w-4 h-4 mr-2" />
            Scanner un ticket
          </Button>
        </div>
      </Card>

      {/* Receipts List */}
      <Card className="p-6">
        <h3 className="font-bold mb-4">Mes tickets</h3>
        <div className="space-y-3">
          {receipts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun ticket scanné pour le moment
            </div>
          ) : (
            receipts.map((receipt) => (
              <Card key={receipt.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{receipt.store_name}</p>
                      <Badge className={
                        receipt.cashback_status === 'paid' ? 'bg-green-500' :
                        receipt.cashback_status === 'approved' ? 'bg-blue-500' :
                        'bg-orange-500'
                      }>
                        {receipt.cashback_status === 'paid' && <Check className="w-3 h-3 mr-1" />}
                        {receipt.cashback_status === 'approved' && <Check className="w-3 h-3 mr-1" />}
                        {receipt.cashback_status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {receipt.cashback_status === 'paid' ? 'Payé' :
                         receipt.cashback_status === 'approved' ? 'Approuvé' :
                         'En attente'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {format(new Date(receipt.purchase_date), 'dd/MM/yyyy')} • 
                      {' '}{receipt.total_amount.toLocaleString()} F
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Cashback</p>
                    <p className="text-lg font-bold text-emerald-600">
                      +{receipt.cashback_earned?.toLocaleString() || 0} F
                    </p>
                  </div>
                </div>
                {receipt.receipt_image_url && (
                  <img
                    src={receipt.receipt_image_url}
                    alt="Ticket"
                    className="mt-3 rounded-lg max-h-40 object-contain"
                  />
                )}
              </Card>
            ))
          )}
        </div>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scanner un ticket</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {!receiptFile ? (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <Camera className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">
                  {isUploading ? 'Chargement...' : 'Cliquez pour prendre une photo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
            ) : (
              <div className="relative">
                <img
                  src={receiptFile}
                  alt="Ticket"
                  className="w-full rounded-lg max-h-64 object-contain"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReceiptFile(null)}
                  className="absolute top-2 right-2"
                >
                  Changer
                </Button>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1 block">Nom du magasin</label>
              <Input
                value={receiptData.store_name}
                onChange={(e) => setReceiptData({ ...receiptData, store_name: e.target.value })}
                placeholder="Ex: Carrefour"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Montant total (FCFA)</label>
              <Input
                type="number"
                value={receiptData.total_amount}
                onChange={(e) => setReceiptData({ ...receiptData, total_amount: e.target.value })}
                placeholder="10000"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Date d'achat</label>
              <Input
                type="date"
                value={receiptData.purchase_date}
                onChange={(e) => setReceiptData({ ...receiptData, purchase_date: e.target.value })}
              />
            </div>

            {receiptData.total_amount && (
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="text-sm text-gray-600">Cashback estimé (5%)</p>
                <p className="text-xl font-bold text-emerald-600">
                  {Math.round(parseFloat(receiptData.total_amount) * 0.05).toLocaleString()} F
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadDialog(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmitReceipt}
                disabled={!receiptData.store_name || !receiptData.total_amount}
                className="flex-1 bg-emerald-500"
              >
                Valider
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}