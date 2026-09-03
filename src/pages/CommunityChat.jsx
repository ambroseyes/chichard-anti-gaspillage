import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  MessageCircle, Send, ChefHat, Lightbulb,
  Flame, ShoppingBag, Search, ArrowLeft, Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { goToLogin } from '@/lib/navigation';

const categoryConfig = {
  recettes: { icon: ChefHat, color: 'bg-orange-100 text-orange-600', label: 'Recettes' },
  astuces: { icon: Lightbulb, color: 'bg-amber-100 text-amber-600', label: 'Astuces' },
  defis: { icon: Flame, color: 'bg-red-100 text-red-600', label: 'Défis' },
  bons_plans: { icon: ShoppingBag, color: 'bg-emerald-100 text-emerald-600', label: 'Bons plans' },
  general: { icon: MessageCircle, color: 'bg-blue-100 text-blue-600', label: 'Général' },
};

const defaultRooms = [
  { name: 'Recettes Anti-Gaspi', category: 'recettes', icon: '👨‍🍳', description: 'Partagez vos recettes' },
  { name: 'Astuces Conservation', category: 'astuces', icon: '💡', description: 'Conseils pour conserver' },
  { name: 'Défis du moment', category: 'defis', icon: '🔥', description: 'Discutez des défis' },
  { name: 'Bons Plans Locaux', category: 'bons_plans', icon: '🛒', description: 'Partagez les bons plans' },
  { name: 'Discussion Générale', category: 'general', icon: '💬', description: 'Échanges libres' },
];

export default function CommunityChat() {
  const [user, setUser] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await api.auth.me();
        setUser(userData);
      } catch (e) {
        goToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: rooms = [] } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: async () => {
      const existingRooms = await api.entities.ChatRoom.filter({ is_active: true });
      
      // Create default rooms if they don't exist
      if (existingRooms.length === 0) {
        for (const room of defaultRooms) {
          await api.entities.ChatRoom.create(room);
        }
        return await api.entities.ChatRoom.filter({ is_active: true });
      }
      return existingRooms;
    },
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['chat-messages', selectedRoom?.id],
    queryFn: () => api.entities.ChatMessage.filter(
      { room_id: selectedRoom?.id },
      '-created_date',
      100
    ),
    enabled: !!selectedRoom,
    refetchInterval: 3000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      await api.entities.ChatMessage.create({
        room_id: selectedRoom.id,
        sender_email: user.email,
        sender_name: user.full_name,
        content,
        message_type: 'text',
      });

      await api.entities.ChatRoom.update(selectedRoom.id, {
        last_message: content.substring(0, 50),
        last_message_date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      setNewMessage('');
      refetchMessages();
    }
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const filteredRooms = rooms.filter(room =>
    room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        {selectedRoom ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => setSelectedRoom(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-semibold">{selectedRoom.name}</h1>
              <p className="text-xs text-gray-500">{selectedRoom.members_count || 0} membres</p>
            </div>
          </>
        ) : (
          <>
            <MessageCircle className="w-6 h-6 text-purple-500" />
            <h1 className="text-lg font-bold">Salons de discussion</h1>
          </>
        )}
      </div>

      {selectedRoom ? (
        /* Chat View */
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {[...messages].reverse().map((message) => {
                const isOwn = message.sender_email === user.email;
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                      {!isOwn && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                            {message.sender_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        {!isOwn && (
                          <p className="text-xs text-gray-500 mb-1">{message.sender_name}</p>
                        )}
                        <div className={`rounded-2xl px-4 py-2 ${
                          isOwn 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-white border'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {format(new Date(message.created_date), 'HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 bg-white border-t">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (newMessage.trim()) {
                  sendMessageMutation.mutate(newMessage);
                }
              }}
              className="flex gap-2"
            >
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Votre message..."
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                className="bg-purple-500 hover:bg-purple-600"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      ) : (
        /* Room List */
        <div className="flex-1 p-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un salon..."
              className="pl-9"
            />
          </div>

          {/* Rooms */}
          <div className="space-y-3">
            {filteredRooms.map((room) => {
              const config = categoryConfig[room.category] || categoryConfig.general;
              const Icon = config.icon;
              
              return (
                <motion.div
                  key={room.id}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedRoom(room)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{room.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {room.members_count || 0}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {room.last_message || room.description}
                        </p>
                      </div>
                      {room.last_message_date && (
                        <span className="text-xs text-gray-400">
                          {format(new Date(room.last_message_date), 'HH:mm', { locale: fr })}
                        </span>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}