import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Leaf, Award, Zap } from 'lucide-react';

const ecoLevels = {
  debutant: { name: 'Débutant', color: 'text-gray-500', next: 5000, icon: '🌱' },
  eco_citoyen: { name: 'Éco-Citoyen', color: 'text-emerald-500', next: 15000, icon: '🌿' },
  eco_hero: { name: 'Éco-Héros', color: 'text-blue-500', next: 35000, icon: '🌳' },
  eco_champion: { name: 'Éco-Champion', color: 'text-purple-500', next: 75000, icon: '🌲' },
  eco_legend: { name: 'Éco-Légende', color: 'text-orange-500', next: null, icon: '🌍' },
};

export default function SavingsCounter({ totalSavings = 0, wasteAvoided = 0, ecoLevel = 'debutant', co2Saved = 0 }) {
  const level = ecoLevels[ecoLevel] || ecoLevels.debutant;
  const progress = level.next ? (totalSavings / level.next) * 100 : 100;

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{level.icon}</span>
          <span className={`font-semibold ${level.color}`}>{level.name}</span>
        </div>
        {level.next && (
          <span className="text-xs text-gray-500">
            {Math.round(progress)}% vers le prochain niveau
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-xl p-3 shadow-sm"
        >
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Économies</span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {totalSavings?.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">FCFA</div>
        </motion.div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-3 shadow-sm"
        >
          <div className="flex items-center gap-2 text-teal-600 mb-1">
            <Leaf className="w-4 h-4" />
            <span className="text-xs font-medium">Sauvé</span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {wasteAvoided?.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">kg</div>
        </motion.div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-3 shadow-sm"
        >
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-medium">CO₂</span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {(co2Saved || wasteAvoided * 2.5)?.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">kg évités</div>
        </motion.div>
      </div>

      {level.next && (
        <div className="mt-4">
          <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}