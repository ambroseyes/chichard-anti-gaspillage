import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, TrendingDown, TrendingUp, 
  Clock, Zap, CheckCircle, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SmartAlert({ alerts, onDismiss }) {
  const getAlertIcon = (type) => {
    switch (type) {
      case 'low_stock': return AlertTriangle;
      case 'urgent_delivery': return Clock;
      case 'high_demand': return TrendingUp;
      case 'low_sales': return TrendingDown;
      case 'target_reached': return CheckCircle;
      default: return Zap;
    }
  };

  const getAlertColor = (priority) => {
    switch (priority) {
      case 'critical': return 'border-red-300 bg-red-50';
      case 'high': return 'border-orange-300 bg-orange-50';
      case 'medium': return 'border-yellow-300 bg-yellow-50';
      case 'low': return 'border-blue-300 bg-blue-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getIconColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {alerts.map((alert, idx) => {
          const Icon = getAlertIcon(alert.type);
          const colorClass = getAlertColor(alert.priority);
          const iconColor = getIconColor(alert.priority);

          return (
            <motion.div
              key={alert.id || idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`border-2 ${colorClass} p-4`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${iconColor} bg-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{alert.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {alert.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">{alert.message}</p>
                      {alert.action && (
                        <Button 
                          size="sm" 
                          className="mt-3"
                          onClick={alert.action.onClick}
                        >
                          {alert.action.label}
                        </Button>
                      )}
                    </div>
                  </div>
                  {onDismiss && (
                    <button
                      onClick={() => onDismiss(alert.id)}
                      className="p-1 hover:bg-white rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}