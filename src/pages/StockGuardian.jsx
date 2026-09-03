import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles, Send, ArrowLeft, AlertTriangle, TrendingDown,
  Package, Clock, Zap, RefreshCw, Bot, User, Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from '@/lib/AuthContext';

export default function StockGuardian() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState(null);
  const messagesEndRef = useRef(null);

  const { data: products = [] } = useQuery({
    queryKey: ['partner-products', user?.email],
    queryFn: () => api.entities.Product.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  // Calculate stats
  const urgentProducts = products.filter(p => {
    const daysLeft = Math.ceil((new Date(p.expiration_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 3 && daysLeft > 0;
  });

  const potentialLoss = urgentProducts.reduce((sum, p) => 
    sum + (p.discounted_price * (p.quantity_available || 1)), 0
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initConversation = async () => {
    if (!conversation) {
      const newConv = await api.agents.createConversation({
        agent_name: 'stock_guardian',
        metadata: { name: 'Session StockGuardian' }
      });
      setConversation(newConv);
      return newConv;
    }
    return conversation;
  };

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    setInputValue('');
    setIsLoading(true);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    // Initialize or get conversation
    const conv = await initConversation();

    // Add loading message
    setMessages(prev => [...prev, { role: 'assistant', content: '', isLoading: true }]);

    // Subscribe to updates
    const unsubscribe = api.agents.subscribeToConversation(conv.id, (data) => {
      const lastMessage = data.messages[data.messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: lastMessage.content || '',
            tool_calls: lastMessage.tool_calls,
            isLoading: !lastMessage.content
          };
          return newMessages;
        });
      }
    });

    // Send message
    await api.agents.addMessage(conv, { role: 'user', content: text });

    setIsLoading(false);

    // Cleanup subscription after a delay
    setTimeout(() => unsubscribe(), 30000);
  };

  const quickPrompts = [
    { icon: AlertTriangle, text: 'Analyser mes produits urgents', color: 'text-orange-500' },
    { icon: TrendingDown, text: 'Optimiser mes prix dynamiquement', color: 'text-blue-500' },
    { icon: Package, text: 'Bundles basés sur patterns d\'achat', color: 'text-purple-500' },
    { icon: Zap, text: 'Stratégie anti-gaspillage', color: 'text-emerald-500' },
    { icon: RefreshCw, text: 'Prévoir réapprovisionnement optimal', color: 'text-teal-500' },
    { icon: Clock, text: 'Promotions auto selon stock', color: 'text-indigo-500' },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-14 md:top-16 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to={createPageUrl('PartnerDashboard')} className="text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">StockGuardian</h1>
              <p className="text-xs text-gray-500">Assistant IA anti-gaspillage</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {urgentProducts.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">{urgentProducts.length} produit{urgentProducts.length > 1 ? 's' : ''} urgent{urgentProducts.length > 1 ? 's' : ''}</span>
            </div>
            <span className="text-sm">Risque: {potentialLoss.toLocaleString()} FCFA</span>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 pr-4">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Welcome */}
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Bonjour, {user.full_name?.split(' ')[0]} 👋
                </h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  Je suis StockGuardian, votre assistant IA pour optimiser vos stocks et éviter le gaspillage.
                </p>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-white/80 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Package className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{products.length}</p>
                      <p className="text-sm text-gray-500">Produits</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-white/80 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{urgentProducts.length}</p>
                      <p className="text-sm text-gray-500">Urgents</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Quick prompts */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Suggestions rapides</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(prompt.text)}
                      className="flex items-center gap-3 p-4 bg-white rounded-xl border hover:border-indigo-300 hover:shadow-md transition-all text-left"
                    >
                      <prompt.icon className={`w-5 h-5 ${prompt.color}`} />
                      <span className="text-sm font-medium text-gray-700">{prompt.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4 pb-4">
              <AnimatePresence>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
                        : 'bg-white border rounded-2xl rounded-tl-sm shadow-sm'
                    } px-4 py-3`}>
                      {msg.isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm text-gray-500">Analyse en cours...</span>
                        </div>
                      ) : (
                        <ReactMarkdown className="prose prose-sm max-w-none">
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="pt-4 border-t bg-white/50 backdrop-blur-sm -mx-4 px-4 pb-4 mt-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(inputValue);
            }}
            className="flex gap-3"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Demandez-moi d'analyser vos stocks..."
              className="flex-1 h-12 bg-white border-gray-200"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="h-12 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}