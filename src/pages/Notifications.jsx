import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bell, Check, Trash2, Package, MessageCircle, Flame, Tag } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Notifications() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email }, '-created_date', 50),
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Notification.update(id, { is_read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const getIcon = (type) => {
    switch (type) {
      case 'order': return <Package className="w-5 h-5 text-blue-500" />;
      case 'social': return <MessageCircle className="w-5 h-5 text-purple-500" />;
      case 'challenge': return <Flame className="w-5 h-5 text-orange-500" />;
      case 'deal': return <Tag className="w-5 h-5 text-emerald-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {notifications.some(n => !n.is_read) && (
            <Button variant="outline" size="sm" onClick={() => markAllReadMutation.mutate()}>
              <Check className="w-4 h-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <Card className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune notification</p>
            </Card>
          ) : (
            notifications.map((notif) => (
              <Card 
                key={notif.id} 
                className={`p-4 transition-colors ${!notif.is_read ? 'bg-white border-l-4 border-l-emerald-500' : 'bg-gray-50/50'}`}
                onClick={() => !notif.is_read && markReadMutation.mutate(notif.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-full shadow-sm">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className={`font-medium ${!notif.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                        {notif.title}
                      </h3>
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                        {format(new Date(notif.created_date), 'd MMM HH:mm', { locale: fr })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-400 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(notif.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}