import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  MessageCircle, Send, Search, ArrowLeft, User, Bell,
  Check, CheckCheck, Loader2, Plus
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';

export default function EnhancedDirectMessages({ user }) {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatEmail, setNewChatEmail] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [], refetch } = useQuery({
    queryKey: ['direct-messages', user?.email],
    queryFn: () => base44.entities.Message.filter({ 
      $or: [
        { sender_email: user?.email },
        { recipient_email: user?.email }
      ]
    }, '-created_date', 200),
    enabled: !!user,
    refetchInterval: 5000,
  });

  // Group messages into conversations
  const conversations = React.useMemo(() => {
    const convMap = {};
    messages.forEach(msg => {
      const otherEmail = msg.sender_email === user?.email ? msg.recipient_email : msg.sender_email;
      const otherName = msg.sender_email === user?.email ? msg.recipient_name : msg.sender_name;
      
      if (!convMap[otherEmail]) {
        convMap[otherEmail] = {
          email: otherEmail,
          name: otherName,
          messages: [],
          unreadCount: 0,
          lastMessage: null,
        };
      }
      convMap[otherEmail].messages.push(msg);
      if (!msg.is_read && msg.recipient_email === user?.email) {
        convMap[otherEmail].unreadCount++;
      }
    });

    return Object.values(convMap).map(conv => ({
      ...conv,
      messages: conv.messages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)),
      lastMessage: conv.messages[0],
    })).sort((a, b) => new Date(b.lastMessage?.created_date) - new Date(a.lastMessage?.created_date));
  }, [messages, user]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      await base44.entities.Message.create({
        sender_email: user.email,
        sender_name: user.full_name,
        recipient_email: selectedConversation.email,
        recipient_name: selectedConversation.name,
        content,
        conversation_id: [user.email, selectedConversation.email].sort().join('-'),
      });

      // Create notification
      await base44.entities.Notification.create({
        user_email: selectedConversation.email,
        title: 'Nouveau message',
        message: `${user.full_name}: ${content.substring(0, 50)}...`,
        type: 'social',
      });
    },
    onSuccess: () => {
      setNewMessage('');
      refetch();
    }
  });

  const startNewChatMutation = useMutation({
    mutationFn: async () => {
      const users = await base44.entities.User.filter({ email: newChatEmail });
      if (users.length === 0) {
        throw new Error('Utilisateur non trouvé');
      }
      
      setSelectedConversation({
        email: newChatEmail,
        name: users[0].full_name,
        messages: [],
      });
      setShowNewChat(false);
      setNewChatEmail('');
    },
    onError: (e) => {
      toast.error(e.message || 'Utilisateur non trouvé');
    }
  });

  // Mark messages as read
  useEffect(() => {
    if (selectedConversation) {
      const unreadMessages = messages.filter(
        m => m.sender_email === selectedConversation.email && 
             m.recipient_email === user?.email && 
             !m.is_read
      );
      unreadMessages.forEach(m => {
        base44.entities.Message.update(m.id, { is_read: true });
      });
    }
  }, [selectedConversation, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  const filteredConversations = conversations.filter(conv =>
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMessages = selectedConversation 
    ? messages.filter(m => 
        (m.sender_email === selectedConversation.email && m.recipient_email === user?.email) ||
        (m.sender_email === user?.email && m.recipient_email === selectedConversation.email)
      ).sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    : [];

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Connectez-vous pour envoyer des messages</p>
      </Card>
    );
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden h-[500px] flex">
      {/* Conversations List */}
      <div className={`w-full md:w-80 border-r flex flex-col ${selectedConversation ? 'hidden md:flex' : ''}`}>
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Messages</h3>
            <Button size="sm" variant="ghost" onClick={() => setShowNewChat(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9 h-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Aucune conversation</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.email}
                onClick={() => setSelectedConversation(conv)}
                className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedConversation?.email === conv.email ? 'bg-purple-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-purple-100 text-purple-600">
                      {conv.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{conv.name}</p>
                      {conv.unreadCount > 0 && (
                        <Badge className="bg-purple-500">{conv.unreadCount}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {conv.lastMessage?.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat View */}
      <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : ''}`}>
        {selectedConversation ? (
          <>
            <div className="p-3 border-b flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="md:hidden"
                onClick={() => setSelectedConversation(null)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Avatar>
                <AvatarFallback className="bg-purple-100 text-purple-600">
                  {selectedConversation.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedConversation.name}</p>
                <p className="text-xs text-gray-500">{selectedConversation.email}</p>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {currentMessages.map((msg) => {
                  const isOwn = msg.sender_email === user.email;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isOwn ? 'bg-purple-500 text-white' : 'bg-gray-100'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${
                          isOwn ? 'text-purple-200' : 'text-gray-400'
                        }`}>
                          <span className="text-[10px]">
                            {format(new Date(msg.created_date), 'HH:mm')}
                          </span>
                          {isOwn && (
                            msg.is_read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-3 border-t">
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Sélectionnez une conversation</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Input
                value={newChatEmail}
                onChange={(e) => setNewChatEmail(e.target.value)}
                placeholder="Email de l'utilisateur"
                type="email"
              />
            </div>
            <Button 
              onClick={() => startNewChatMutation.mutate()}
              disabled={!newChatEmail || startNewChatMutation.isPending}
              className="w-full"
            >
              {startNewChatMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Démarrer la conversation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}