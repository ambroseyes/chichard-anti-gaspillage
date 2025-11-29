import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Settings, DollarSign, RefreshCw, Percent, Package } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const availableKPIs = [
  { id: 'margin', label: 'Marge Nette', icon: Percent, value: '24%', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { id: 'turnover', label: 'Rotation Stock', icon: RefreshCw, value: '12j', color: 'text-blue-600', bg: 'bg-blue-100' },
  { id: 'revenue', label: 'Chiffre d\'affaires', icon: DollarSign, value: '1.2M', color: 'text-purple-600', bg: 'bg-purple-100' },
  { id: 'sold_items', label: 'Unités Vendues', icon: Package, value: '845', color: 'text-orange-600', bg: 'bg-orange-100' },
];

export default function CustomKPIs() {
  const [selected, setSelected] = useState(['margin', 'turnover', 'revenue']);
  const [isEditing, setIsEditing] = useState(false);

  const toggleKPI = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(k => k !== id));
    } else {
      if (selected.length < 3) setSelected([...selected, id]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Indicateurs Clés (KPIs)</h3>
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {isEditing && (
        <div className="p-3 bg-gray-50 rounded-lg mb-4 grid grid-cols-2 gap-2">
          {availableKPIs.map(kpi => (
            <div key={kpi.id} className="flex items-center space-x-2">
              <Checkbox 
                id={kpi.id} 
                checked={selected.includes(kpi.id)}
                onCheckedChange={() => toggleKPI(kpi.id)}
                disabled={!selected.includes(kpi.id) && selected.length >= 3}
              />
              <label htmlFor={kpi.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {kpi.label}
              </label>
            </div>
          ))}
          <p className="text-xs text-gray-500 col-span-2 mt-2">Sélectionnez jusqu'à 3 indicateurs</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {selected.map(id => {
          const kpi = availableKPIs.find(k => k.id === id);
          const Icon = kpi.icon;
          return (
            <div key={id} className="bg-white border rounded-xl p-3 text-center">
              <div className={`w-8 h-8 ${kpi.bg} ${kpi.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xs text-gray-500">{kpi.label}</p>
              <p className="font-bold text-gray-900">{kpi.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}