'use client';
import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import { connectSocket, getSocket, joinSupportRoom } from '@/lib/socket';

interface Msg {
  id: string;
  fromAdmin: boolean;
  text: string;
  createdAt: string;
  isRead: boolean;
}

export function SupportChatWidget({ userId }: { userId: string }) {
  const [open, setOpen]         = useState(false);
  const [msgs, setMsgs]         = useState<Msg[]>([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [sending, setSending]   = useState(false);
  const [unread, setUnread]     = useState(0);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  // Load messages when opened
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.get<Msg[]>('/api/support/messages')
      .then(data => { setMsgs(data); setUnread(0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // Socket subscription
  useEffect(() => {
    connectSocket();
    joinSupportRoom(userId);
    const socket = getSocket();

    socket.on('support:message', (msg: Msg) => {
      setMsgs(p => [...p, msg]);
      if (!open && msg.fromAdmin) setUnread(u => u + 1);
    });

    return () => { socket.off('support:message'); };
  }, [userId, open]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    try {
      const msg = await api.post<Msg>('/api/support/messages', { text: trimmed });
      setMsgs(p => [...p, msg]);
    } catch { setText(trimmed); }
    finally { setSending(false); }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const fmtTime = (d: string) =>
    new Date(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen(o => !o); setUnread(0); }}
        className="fixed bottom-20 right-4 sm:bottom-6 z-50 w-13 h-13 w-[52px] h-[52px] rounded-full bg-accent text-accent-fg shadow-lg neon-btn flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label="Чат с поддержкой"
      >
        {open
          ? <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
          : <MessageCircle className="w-5 h-5" strokeWidth={2} />
        }
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-[84px] sm:bottom-20 right-4 z-50 w-[320px] sm:w-[360px] bg-card border border-border rounded-2xl shadow-theme-lg flex flex-col overflow-hidden animate-scale-in"
          style={{ height: '420px' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/60 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                <MessageCircle className="w-3.5 h-3.5 text-accent" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-text leading-none">Поддержка</p>
                <p className="text-[10px] text-subtle mt-0.5">Отвечаем в рабочее время</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-subtle hover:text-text transition-colors p-1">
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
            {loading && (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-8 bg-muted rounded-xl animate-pulse" />)}
              </div>
            )}

            {!loading && msgs.length === 0 && (
              <div className="text-center py-8 text-subtle">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" strokeWidth={1.5} />
                <p className="text-xs">Напишите нам — мы поможем!</p>
              </div>
            )}

            {msgs.map(msg => (
              <div key={msg.id} className={`flex ${msg.fromAdmin ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  msg.fromAdmin
                    ? 'bg-muted text-text rounded-tl-sm'
                    : 'bg-accent text-accent-fg rounded-tr-sm'
                }`}>
                  <p className="leading-snug break-words">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${msg.fromAdmin ? 'text-subtle' : 'text-accent-fg/70'}`}>
                    {fmtTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border px-3 py-2.5 flex items-center gap-2 shrink-0 bg-muted/30">
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Написать сообщение…"
              maxLength={1000}
              className="flex-1 bg-transparent text-sm text-text placeholder:text-subtle/50 outline-none min-w-0"
            />
            <button
              onClick={send}
              disabled={!text.trim() || sending}
              className="w-8 h-8 rounded-full bg-accent text-accent-fg flex items-center justify-center shrink-0 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
