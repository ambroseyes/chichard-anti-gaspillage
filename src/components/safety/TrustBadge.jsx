import React from 'react';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function TrustBadge({ verificationStatus, trustScore, showScore = false }) {
  const config = {
    verified: { icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Vérifié & Fiable' },
    pending: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Vérification en cours' },
    unverified: { icon: AlertCircle, color: 'text-gray-400', bg: 'bg-gray-50', label: 'Non vérifié' },
    rejected: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Non fiable' }
  };

  const status = config[verificationStatus] || config.unverified;
  const Icon = status.icon;

  return (
    <div className="inline-flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${status.bg} border border-opacity-20 border-current`}>
              <Icon className={`w-4 h-4 ${status.color}`} />
              <span className={`text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Statut: {status.label}</p>
            {trustScore !== undefined && <p>Score de confiance: {trustScore}/100</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {showScore && trustScore !== undefined && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <div className="h-1.5 w-12 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${trustScore > 80 ? 'bg-emerald-500' : trustScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
              style={{ width: `${trustScore}%` }} 
            />
          </div>
          <span>{trustScore}%</span>
        </div>
      )}
    </div>
  );
}