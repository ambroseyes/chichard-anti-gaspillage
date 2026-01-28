import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scan, Camera, X, Search, Loader2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'sonner';

export default function BarcodeScanner({ open, onClose }) {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      setScanning(true);
      html5QrCodeRef.current = new Html5Qrcode('barcode-reader');
      
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        onScanSuccess,
        onScanFailure
      );
    } catch (error) {
      console.error('Scanner error:', error);
      toast.error('Erreur lors du démarrage du scanner');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      } catch (error) {
        console.error('Stop scanner error:', error);
      }
    }
    setScanning(false);
  };

  const onScanSuccess = (decodedText) => {
    stopScanner();
    searchByBarcode(decodedText);
  };

  const onScanFailure = (error) => {
    // Ignore errors during scanning
  };

  const searchByBarcode = async (barcode) => {
    setLoading(true);
    try {
      const products = await base44.entities.Product.filter({ barcode, status: 'active' });
      
      if (products.length === 0) {
        toast.error('Produit non trouvé');
        setResults(null);
      } else {
        // Group by stores and compare prices
        const comparison = {
          product_name: products[0].name,
          barcode,
          stores: products.map(p => ({
            store_id: p.store_id,
            store_name: p.store_name,
            price: p.original_price,
            discounted_price: p.discounted_price,
            in_stock: p.quantity_available > 0,
            quantity: p.quantity_available,
            expiration_date: p.expiration_date,
            product_id: p.id
          })).sort((a, b) => a.discounted_price - b.discounted_price)
        };

        const bestDeal = comparison.stores[0];
        const averagePrice = comparison.stores.reduce((sum, s) => sum + s.discounted_price, 0) / comparison.stores.length;
        
        comparison.best_deal = {
          ...bestDeal,
          savings: averagePrice - bestDeal.discounted_price
        };

        setResults(comparison);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Erreur lors de la recherche');
    }
    setLoading(false);
  };

  const handleManualSearch = () => {
    if (manualCode.trim()) {
      searchByBarcode(manualCode.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            Scanner un code-barres
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scanner Area */}
          {!results && (
            <>
              <div className="border-2 border-dashed rounded-lg p-4">
                {!scanning ? (
                  <div className="text-center py-8">
                    <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <Button onClick={startScanner} className="bg-emerald-500 hover:bg-emerald-600">
                      <Camera className="w-4 h-4 mr-2" />
                      Démarrer le scanner
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div id="barcode-reader" className="rounded-lg overflow-hidden" />
                    <Button
                      variant="outline"
                      onClick={stopScanner}
                      className="w-full mt-4"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Arrêter
                    </Button>
                  </div>
                )}
              </div>

              {/* Manual Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Ou entrez le code manuellement..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                />
                <Button onClick={handleManualSearch} disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{results.product_name}</h3>
                  <p className="text-sm text-gray-500">Code: {results.barcode}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setResults(null)}>
                  Nouvelle recherche
                </Button>
              </div>

              {results.best_deal && (
                <Card className="p-4 bg-emerald-50 border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-emerald-500">Meilleure offre</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{results.best_deal.store_name}</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {results.best_deal.discounted_price.toLocaleString()} F
                      </p>
                    </div>
                    {results.best_deal.savings > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Économie vs moyenne</p>
                        <p className="font-bold text-emerald-600">
                          {results.best_deal.savings.toFixed(0)} F
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              <div className="space-y-2">
                <h4 className="font-semibold">Comparaison des magasins</h4>
                {results.stores.map((store, idx) => {
                  const discount = Math.round((1 - store.discounted_price / store.price) * 100);
                  const daysLeft = Math.ceil(
                    (new Date(store.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <Card key={idx} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{store.store_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">-{discount}%</Badge>
                            {!store.in_stock && (
                              <Badge variant="outline" className="bg-red-50 text-red-600">
                                Rupture
                              </Badge>
                            )}
                            {daysLeft <= 3 && (
                              <Badge className="bg-orange-500 text-white text-xs">
                                {daysLeft}j
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-600">
                            {store.discounted_price.toLocaleString()} F
                          </p>
                          <p className="text-xs text-gray-400 line-through">
                            {store.price.toLocaleString()} F
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}