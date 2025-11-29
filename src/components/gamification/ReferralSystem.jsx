import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Users, Copy, Share2, Gift, Trophy } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

export default function ReferralSystem({ user }) {
  const [referralCode] = useState(user?.referral_code || user?.id?.substring(0, 8).toUpperCase() || 'CHICHARD');

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Code copié !');
  };

  const shareReferral = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Rejoins CHICHARD',
        text: `Utilise mon code ${referralCode} pour gagner des réductions sur CHICHARD !`,
        url: window.location.origin
      });
    } else {
      copyCode();
    }
  };

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-xl">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Parrainage</h3>
            <p className="text-purple-100 text-sm">Invitez des amis, gagnez des récompenses</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-sm mb-2 text-purple-100">Votre code unique</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-white/20 rounded-lg px-3 py-2 font-mono font-bold tracking-wider text-center flex items-center justify-center">
                  {referralCode}
                </div>
                <Button variant="secondary" size="icon" onClick={copyCode} title="Copier">
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="secondary" size="icon" onClick={shareReferral} title="Partager">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm px-1">
              <span>Amis parrainés: <strong>{user?.referrals_count || 0}</strong></span>
              <span>Points gagnés: <strong>{(user?.referrals_count || 0) * 500}</strong></span>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-4 text-sm space-y-3">
            <h4 className="font-bold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-300" />
              Récompenses
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-300 rounded-full" />
                <span>500 points par ami inscrit</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-300 rounded-full" />
                <span>Badge "Ambassadeur" à 5 amis</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-300 rounded-full" />
                <span>5% de remise à vie après 10 amis</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}