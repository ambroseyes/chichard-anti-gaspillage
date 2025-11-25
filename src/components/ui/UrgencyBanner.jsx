import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, TrendingDown } from 'lucide-react';

export default function UrgencyBanner({ type = 'urgent' }) {
  const banners = {
    urgent: {
      bg: 'bg-gradient-to-r from-red-500 to-orange-500',
      icon: Clock,
      title: 'Dernières heures !',
      subtitle: 'Jusqu\'à -70% sur les produits qui expirent aujourd\'hui',
    },
    weekend: {
      bg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      icon: Zap,
      title: 'Offres du week-end',
      subtitle: 'Les meilleures affaires avant lundi',
    },
    savings: {
      bg: 'bg-gradient-to-r from-purple-500 to-indigo-500',
      icon: TrendingDown,
      title: 'Économies record',
      subtitle: 'Des réductions jusqu\'à 80% cette semaine',
    },
  };

  const banner = banners[type];
  const Icon = banner.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${banner.bg} rounded-2xl p-5 text-white shadow-xl`}
    >
      <div className="flex items-center gap-4">
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-lg">{banner.title}</h3>
          <p className="text-white/90 text-sm">{banner.subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}