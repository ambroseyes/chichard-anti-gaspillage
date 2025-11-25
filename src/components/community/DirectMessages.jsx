import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Send, ArrowLeft, Search, User, Shield,
  Lock, Check, CheckCheck
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DirectMessages({ user }) {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', user?.email],
    queryFn: () => base44.entities.Message.list('-created_date', 200),
    enabled: !!user,
  });

  // Group messages by conversation
  const conversations = messages.reduce((acc, msg) => {
    const otherPerson = msg.sender_email === user.email 
      ? { email: msg.recipient_email, name: msg.recipient_name }
      : { email: msg.sender_email, name: msg.sender_name };
    
    const convId = [msg.sender_email, msg.recipient_email].sort().join('_');
    
    if (!acc[convId]) {
      acc[convId] = {
        id: convId,
        otherPerson,
        messages: [],
        lastMessage: null,
        unread: 0
      };
    }
    acc[convId].messages.push(msg);
    if (!acc[convId].lastMessage || new Date(msg.created_date) > new Date(acc[convId].lastMessage.created_date)) {
      acc[convId].lastMessage = msg;
    }
    if (!msg.is_read && msg.recipient_email === user.email) {
      acc[convId].unread++;
    }
    return acc;
  }, {});

  const conversationList = Object.values(conversations).sort((a, b) => 
    new Date(b.lastMessage?.created_date) - new Date(a.lastMessage?.created_date)
  );

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.Message.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setNewMessage('');
    }
  });

  const handleSend = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    sendMutation.mutate({
      sender_email: user.email,
      sender_name: user.full_name,
      recipient_email: selectedConversation.otherPerson.email,
      recipient_name: selectedConversation.otherPerson.name,
      content: newMessage,
      conversation_id: selectedConversation.id
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Connectez-vous pour accéder aux messages</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden h-[500px] flex">
      {/* Conversations List */}
      <div className={`w-full md:w-80 border-r flex flex-col ${selectedConversation ? 'hidden md:flex' : ''}`}>
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          {conversationList.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aucune conversation</p>
            </div>
          ) : (
            conversationList.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conv.id ? 'bg-emerald-50' : ''
                }`}
              >
                <Avatar>
                  <AvatarFallback className="bg-emerald-100 text-emerald-600">
                    {conv.otherPerson.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium truncate">{conv.otherPerson.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {conv.lastMessage?.content}
                  </p>
                </div>
                {conv.unread > 0 && (
                  <Badge className="bg-emerald-500">{conv.unread}</Badge>
                )}
              </button>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : ''}`}>
        {selectedConversation ? (
          <>
            <div className="p-3 border-b flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                className="md:hidden"
                onClick={() => setSelectedConversation(null)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Avatar>
                <AvatarFallback className="bg-emerald-100 text-emerald-600">
                  {selectedConversation.otherPerson.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedConversation.otherPerson.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Messages privés
                </p>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {selectedConversation.messages
                  .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
                  .map((msg) => {
                    const isMine = msg.sender_email === user.email;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          isMine 
                            ? 'bg-emerald-500 text-white rounded-br-sm' 
                            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                          <div className={`flex items-center justify-end gap-1 mt-1 ${
                            isMine ? 'text-emerald-100' : 'text-gray-400'
                          }`}>
                            <span className="text-[10px]">
                              {new Date(msg.created_date).toLocaleTimeString('fr-FR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            {isMine && (msg.is_read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-3 border-t flex gap-2">
              <Input
                placeholder="Écrire un message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1"
              />
              <Button 
                onClick={handleSend}
                disabled={!newMessage.trim()}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <MessageCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-1">Vos messages</h3>
              <p className="text-sm text-gray-500">
                Sélectionnez une conversation pour commencer
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}