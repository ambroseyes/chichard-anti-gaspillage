import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

export default function QRCodeGenerator({ orderId, orderData }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // Générer un code sécurisé unique
  const generateSecureCode = () => {
    const timestamp = Date.now();
    const hash = btoa(`${orderId}_${timestamp}_${orderData.customer_email}`).substring(0, 16);
    return `ORDER_${orderId}_${timestamp}_${hash}`;
  };

  const qrCode = generateSecureCode();

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrCode, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    }
  }, [qrCode]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `order_${orderId}_qr.png`;
      link.href = url;
      link.click();
      toast.success('QR Code téléchargé');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    toast.success('Code copié');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg border">
      <canvas ref={canvasRef} className="border rounded-lg"></canvas>
      <div className="text-center">
        <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
          {qrCode}
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={handleCopy}>
          {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
          {copied ? 'Copié' : 'Copier'}
        </Button>
        <Button size="sm" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-1" />
          Télécharger
        </Button>
      </div>
    </div>
  );
}