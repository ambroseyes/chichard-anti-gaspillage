import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

// Messages éphémères: on affiche uniquement les messages des dernières 24h
const EPHEMERAL_HOURS = 24;

export default function DeliveryChat({ order, currentUser }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const roomId = `delivery:${order.id}`;

  // Load initial messages
  useEffect(() => {
    if (!open) return;
    base44.entities.ChatMessage.filter({ room_id: roomId }, 'created_date', 100).then(msgs => {
      const cutoff = Date.now() - EPHEMERAL_HOURS * 3600 * 1000;
      const fresh = msgs.filter(m => new Date(m.created_date).getTime() > cutoff);
      setMessages(fresh);
      setUnread(0);
    });
  }, [open, roomId]);

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type === 'create' && event.data.room_id === roomId) {
        const cutoff = Date.now() - EPHEMERAL_HOURS * 3600 * 1000;
        if (new Date(event.data.created_date || Date.now()).getTime() > cutoff) {
          setMessages(prev => {
            if (prev.find(m => m.id === event.id)) return prev;
            return [...prev, event.data];
          });
          if (!open && event.data.sender_email !== currentUser?.email) {
            setUnread(u => u + 1);
          }
        }
      }
    });
    return () => unsub();
  }, [roomId, open, currentUser?.email]);

  // Auto scroll
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnread(0);
    }
  }, [messages, open]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const content = text.trim();
    setText('');
    await base44.entities.ChatMessage.create({
      room_id: roomId,
      sender_email: currentUser.email,
      sender_name: currentUser.full_name || currentUser.email,
      content,
      message_type: 'text',
    });
    setSending(false);
  };

  const isMyMessage = (msg) => msg.sender_email === currentUser?.email;

  return (
    <>
      {/* Floating button */}
      <div className="relative inline-block">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5"
        >
          <MessageCircle className="w-4 h-4 text-blue-500" />
          Chat
          {unread > 0 && (
            <span className="w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {unread}
            </span>
          )}
        </Button>
      </div>

      {/* Chat drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
            style={{ maxHeight: '70vh' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Chat livraison</p>
                <p className="text-xs text-blue-200 truncate">
                  {order.customer_name || order.driver_email || '—'} · Commande #{order.id?.slice(-6)}
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/20 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ephemeral notice */}
            <div className="bg-amber-50 px-3 py-1.5 text-xs text-amber-700 text-center border-b border-amber-100">
              💬 Messages éphémères — disparaissent après 24h
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
              {messages.length === 0 ? (
                <p className="text-center text-gray-400 text-xs py-8">Aucun message. Dites bonjour ! 👋</p>
              ) : messages.map((msg, idx) => (
                <div key={msg.id || idx} className={`flex ${isMyMessage(msg) ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                    isMyMessage(msg)
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 shadow-sm rounded-bl-sm border border-gray-100'
                  }`}>
                    {!isMyMessage(msg) && (
                      <p className="text-[10px] font-semibold text-blue-500 mb-0.5">{msg.sender_name}</p>
                    )}
                    <p className="text-sm leading-snug">{msg.content}</p>
                    <p className={`text-[9px] mt-0.5 ${isMyMessage(msg) ? 'text-blue-200' : 'text-gray-400'}`}>
                      {msg.created_date ? format(new Date(msg.created_date), 'HH:mm', { locale: fr }) : ''}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-2 border-t bg-white flex gap-2">
              <Input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Votre message..."
                className="text-sm h-9"
                disabled={sending}
              />
              <Button size="icon" className="h-9 w-9 bg-blue-600 hover:bg-blue-700 flex-shrink-0" onClick={handleSend} disabled={!text.trim() || sending}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}