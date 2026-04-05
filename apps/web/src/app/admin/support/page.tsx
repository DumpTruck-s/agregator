'use client';
import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, ArrowLeft, User } from 'lucide-react';
import { api } from '@/lib/api';
import { connectSocket, getSocket, joinAdminSupport, joinSupportRoom } from '@/lib/socket';

interface Msg {
  id: string;
  userId: string;
  fromAdmin: boolean;
  text: string;
  isRead: boolean;
  createdAt: string;
}

interface Chat {
  user: { id: string; name: string; role: string; phone?: string };
  lastMessage: Msg;
  unread: number;
}

const ROLE_RU: Record<string, string> = {
  CUSTOMER: 'Клиент',
  COURIER:  'Курьер',
  OWNER:    'Ресторан',
  ADMIN:    'Админ',
};

const ROLE_COLOR: Record<string, string> = {
  CUSTOMER: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
  COURIER:  'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
  OWNER:    'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400',
};

function fmtTime(d: string) {
  const date = new Date(d);
  const now  = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function AdminSupportPage() {
  const [chats, setChats]         = useState<Chat[]>([]);
  const [selected, setSelected]   = useState<Chat | null>(null);
  const [msgs, setMsgs]           = useState<Msg[]>([]);
  const [text, setText]           = useState('');
  const [sending, setSending]     = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLInputElement>(null);

  // Load chat list
  useEffect(() => {
    api.get<Chat[]>('/api/support/admin/chats').then(setChats).catch(() => {});
  }, []);

  // Socket
  useEffect(() => {
    connectSocket();
    joinAdminSupport();
    const socket = getSocket();

    socket.on('support:notify', (msg: Msg & { user: { id: string; name: string; role: string } }) => {
      setChats(prev => {
        const exists = prev.find(c => c.user.id === msg.userId);
        if (exists) {
          return prev.map(c =>
            c.user.id === msg.userId
              ? { ...c, lastMessage: msg, unread: selected?.user.id === msg.userId ? 0 : c.unread + 1 }
              : c
          ).sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
        }
        return [{ user: msg.user, lastMessage: msg, unread: 1 }, ...prev];
      });
      // If this chat is open, add to messages
      if (selected?.user.id === msg.userId) {
        setMsgs(p => [...p, msg]);
      }
    });

    socket.on('support:message', (msg: Msg) => {
      if (selected?.user.id === msg.userId && msg.fromAdmin) {
        setMsgs(p => {
          if (p.find(m => m.id === msg.id)) return p;
          return [...p, msg];
        });
      }
    });

    return () => { socket.off('support:notify'); socket.off('support:message'); };
  }, [selected?.user.id]);

  // Load messages for selected chat
  useEffect(() => {
    if (!selected) return;
    setLoadingMsgs(true);
    setMsgs([]);
    joinSupportRoom(selected.user.id);
    api.get<Msg[]>(`/api/support/admin/chats/${selected.user.id}`)
      .then(data => {
        setMsgs(data);
        // Mark chat as read in sidebar
        setChats(p => p.map(c => c.user.id === selected.user.id ? { ...c, unread: 0 } : c));
      })
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));
  }, [selected?.user.id]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  useEffect(() => {
    if (selected) setTimeout(() => inputRef.current?.focus(), 100);
  }, [selected?.user.id]);

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || !selected || sending) return;
    setSending(true);
    setText('');
    try {
      const msg = await api.post<Msg>(`/api/support/admin/chats/${selected.user.id}`, { text: trimmed });
      setMsgs(p => [...p, msg]);
      setChats(p => p.map(c => c.user.id === selected.user.id ? { ...c, lastMessage: msg } : c));
    } catch { setText(trimmed); }
    finally { setSending(false); }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const totalUnread = chats.reduce((s, c) => s + c.unread, 0);

  return (
    <div className="max-w-5xl mx-auto animate-fade-in" style={{ height: 'calc(100vh - 112px)' }}>
      <div className="flex h-full border border-border rounded-2xl overflow-hidden shadow-theme-sm m-4 sm:m-6">

        {/* Sidebar */}
        <div className={`${selected ? 'hidden sm:flex' : 'flex'} flex-col w-full sm:w-72 border-r border-border bg-card shrink-0`}>
          <div className="px-4 py-3.5 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-accent" strokeWidth={2} />
              <h1 className="font-semibold text-text text-sm">Обращения</h1>
              {totalUnread > 0 && (
                <span className="ml-auto bg-accent text-accent-fg text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                  {totalUnread}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 && (
              <div className="text-center py-16 text-subtle px-4">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" strokeWidth={1.5} />
                <p className="text-xs">Обращений пока нет</p>
              </div>
            )}
            {chats.map(chat => (
              <button
                key={chat.user.id}
                onClick={() => setSelected(chat)}
                className={`w-full text-left px-4 py-3 border-b border-border/50 transition-colors hover:bg-muted/50 ${selected?.user.id === chat.user.id ? 'bg-accent/5 border-l-2 border-l-accent' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-subtle" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-semibold text-text truncate">{chat.user.name}</p>
                      <span className="text-[10px] text-subtle/70 shrink-0">{fmtTime(chat.lastMessage.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none ${ROLE_COLOR[chat.user.role] ?? ''}`}>
                        {ROLE_RU[chat.user.role] ?? chat.user.role}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-subtle truncate flex-1">
                        {chat.lastMessage.fromAdmin ? <span className="text-accent/70">Вы: </span> : ''}
                        {chat.lastMessage.text}
                      </p>
                      {chat.unread > 0 && (
                        <span className="ml-2 w-4 h-4 rounded-full bg-accent text-accent-fg text-[10px] font-bold flex items-center justify-center shrink-0">
                          {chat.unread > 9 ? '9+' : chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat view */}
        {selected ? (
          <div className="flex flex-col flex-1 min-w-0 bg-bg">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
              <button onClick={() => setSelected(null)} className="sm:hidden text-subtle hover:text-text transition-colors p-1">
                <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              </button>
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-subtle" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">{selected.user.name}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none ${ROLE_COLOR[selected.user.role] ?? ''}`}>
                    {ROLE_RU[selected.user.role] ?? selected.user.role}
                  </span>
                  {selected.user.phone && (
                    <span className="text-[10px] text-subtle">{selected.user.phone}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 min-h-0">
              {loadingMsgs && (
                <div className="space-y-2">
                  {[1,2,3,4].map(i => <div key={i} className="h-10 bg-muted rounded-xl animate-pulse" />)}
                </div>
              )}
              {!loadingMsgs && msgs.map(msg => (
                <div key={msg.id} className={`flex ${msg.fromAdmin ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-3.5 py-2.5 ${
                    msg.fromAdmin
                      ? 'bg-accent text-accent-fg rounded-tr-sm'
                      : 'bg-card border border-border text-text rounded-tl-sm shadow-theme-sm'
                  }`}>
                    <p className="text-sm leading-snug break-words">{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${msg.fromAdmin ? 'text-accent-fg/70' : 'text-subtle'}`}>
                      {fmtTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border px-4 py-3 flex items-center gap-3 bg-card shrink-0">
              <input
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKey}
                placeholder={`Ответить ${selected.user.name}…`}
                maxLength={1000}
                className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-subtle/50 outline-none focus:ring-2 focus:ring-accent/30 transition-all"
              />
              <button
                onClick={send}
                disabled={!text.trim() || sending}
                className="w-10 h-10 rounded-xl bg-accent text-accent-fg flex items-center justify-center shrink-0 neon-btn active:scale-95 disabled:opacity-40 transition-all"
              >
                <Send className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 items-center justify-center text-subtle flex-col gap-3">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <MessageCircle className="w-7 h-7 opacity-40" strokeWidth={1.5} />
            </div>
            <p className="text-sm">Выберите обращение</p>
          </div>
        )}
      </div>
    </div>
  );
}
