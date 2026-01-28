import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, Send, X, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const quickQuestions = [
  "Comment ajouter un produit ?",
  "Comment gérer mes stocks ?",
  "Comment traiter une commande ?",
  "Quelles sont les meilleures pratiques pour vendre ?",
];

export default function PartnerChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Bonjour ! Je suis l'assistant CHICHARD. Comment puis-je vous aider avec votre boutique aujourd'hui ?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const userMessage = text || input;
    if (!userMessage.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const context = `Tu es un assistant IA pour la plateforme CHICHARD, spécialisé dans l'aide aux partenaires (commerçants).
      
Contexte de CHICHARD:
- Plateforme de lutte contre le gaspillage alimentaire au Cameroun
- Les partenaires peuvent vendre des produits proches de la péremption à prix réduit
- StockGuardian IA aide à optimiser les prix et gérer les stocks
- Les partenaires peuvent créer des défis, des expériences de fidélité, et des bundles de produits

Fonctionnalités principales:
1. Gestion des produits (ajout, modification, suppression, variantes)
2. Gestion des commandes (statut, livraison, QR codes)
3. Tableau de bord avec analytiques et prédictions
4. Alertes automatiques (stock faible, expiration proche)
5. Bundles et promotions
6. Programme de fidélité et défis

Réponds de manière concise, pratique et en français. Sois amical et professionnel.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${context}\n\nQuestion du partenaire: ${userMessage}`,
        add_context_from_internet: false,
      });

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: typeof response === 'string' ? response : response.content || 'Désolé, je n\'ai pas pu générer une réponse.'
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Désolé, une erreur est survenue. Veuillez réessayer.'
      }]);
    }

    setIsLoading(false);
  };

  const handleQuickQuestion = (question) => {
    sendMessage(question);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="rounded-full h-14 w-14 shadow-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)]"
          >
            <Card className="flex flex-col h-[600px] max-h-[80vh] shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-xl">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-semibold">Assistant CHICHARD</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Questions */}
              {messages.length === 1 && (
                <div className="px-4 py-2 border-t bg-white">
                  <p className="text-xs text-gray-500 mb-2">Questions fréquentes:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickQuestion(q)}
                        className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t bg-white rounded-b-xl">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Posez votre question..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}