'use client';

import { useState } from 'react';
import { MessageCircle, SendHorizontal, Sparkles, X } from 'lucide-react';
import { chatWithAssistant, type ChatHistoryMessage } from '@/lib/api';
import { clsx } from 'clsx';

type UiMessage = ChatHistoryMessage & { id: string };

const HISTORY_LIMIT = 20;
const PRODUCT_LINK_REGEX = /(\/products\/[a-zA-Z0-9-]+)/g;

const initialMessage: UiMessage = {
  id: 'welcome',
  role: 'model',
  content:
    'Привет! Я AI-консультант VOLT. Опиши, что хочешь купить, и я подберу варианты из каталога со ссылками.',
};

const renderWithProductLinks = (text: string) => {
  const parts = text.split(PRODUCT_LINK_REGEX);
  return parts.map((part, index) => {
    if (part.match(PRODUCT_LINK_REGEX)) {
      return (
        <a
          key={`${part}-${index}`}
          href={part}
          className="underline decoration-sky-500/60 underline-offset-2 hover:text-sky-300"
        >
          {part}
        </a>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [lastFallbackUsed, setLastFallbackUsed] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([initialMessage]);

  const trimmed = input.trim();
  const canSend = trimmed.length > 0 && !isSending;

  const sendMessage = async () => {
    if (!canSend) return;

    const userMessage: UiMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    };

    const nextMessages = [...messages, userMessage].slice(-HISTORY_LIMIT);
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const response = await chatWithAssistant(
        nextMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      );

      const modelMessage: UiMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content: response.reply,
      };

      setLastFallbackUsed(response.fallbackUsed);
      setMessages((prev) => [...prev, modelMessage].slice(-HISTORY_LIMIT));
    } catch {
      setLastFallbackUsed(true);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'model',
          content:
            'Сейчас не получилось ответить. Попробуй еще раз через несколько секунд.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const onInputKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={clsx(
          'absolute bottom-16 right-0 w-[24rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-950 text-slate-100 shadow-2xl transition-all duration-300',
          isOpen
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-2 opacity-0',
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-400" />
            <p className="text-sm font-semibold">VOLT AI Ассистент</p>
            <span
              className={clsx(
                'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                lastFallbackUsed
                  ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                  : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
              )}
            >
              {lastFallbackUsed ? 'Fallback mode' : 'AI online'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            aria-label="Закрыть чат"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[26rem] space-y-2 overflow-y-auto bg-slate-950 px-3 py-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={clsx(
                'max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                message.role === 'user'
                  ? 'ml-auto bg-sky-600 text-white'
                  : 'mr-auto bg-slate-900 text-slate-100',
              )}
            >
              {renderWithProductLinks(message.content)}
            </div>
          ))}
          {isSending && (
            <div className="mr-auto max-w-[90%] rounded-2xl bg-slate-900 px-3 py-2 text-sm text-slate-300">
              Думаю над подборкой...
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 bg-slate-900/80 p-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onInputKeyDown}
            rows={2}
            maxLength={1200}
            placeholder="Например: нужен смартфон до 300000 тг с хорошей камерой"
            className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-slate-400">Enter отправит, Shift+Enter новая строка</p>
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={!canSend}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SendHorizontal className="h-4 w-4" />
              Отправить
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-white shadow-xl transition hover:bg-sky-500"
        aria-label="Открыть AI чат"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
