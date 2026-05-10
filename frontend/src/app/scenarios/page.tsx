'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api, Scenario, ChatMessage } from '@/lib/api';
import { ChevronLeft, Send, Mic, MicOff, Volume2 } from 'lucide-react';

export default function ScenariosPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-jp-accent border-t-transparent rounded-full" />
      </div>
    }>
      <ScenariosContent />
    </Suspense>
  );
}

function ScenariosContent() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const scenarioId = searchParams.get('id');

  useEffect(() => {
    api.chat.getScenarios().then(setScenarios).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (scenarioId) {
    return <ScenarioChat scenarioId={scenarioId} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-jp-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const categoryLabels: Record<string, string> = {
    restaurant: '🍜 Restaurante',
    airport: '✈️ Aeropuerto',
    cafe: '☕ Café',
    interview: '💼 Entrevista',
    konbini: '🏪 Konbini',
    hospital: '🏥 Hospital',
    school: '🏫 Escuela',
    station: '🚃 Estación',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Escenarios de conversación</h1>
        <p className="text-gray-400 mt-1">Practica situaciones reales con IA en japonés</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((s) => (
          <a
            key={s.id}
            href={`/scenarios?id=${s.id}`}
            className="card block hover:border-jp-accent/30"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{categoryLabels[s.category]?.split(' ')[0]}</span>
              <span className="text-xs px-2 py-1 bg-jp-accent/20 text-jp-accent rounded-full">
                {'⭐'.repeat(s.difficulty)}
              </span>
            </div>
            <h3 className="font-bold text-lg mb-1">{s.title}</h3>
            <p className="text-sm text-gray-400 mb-3">{s.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {s.key_phrases.slice(0, 3).map((p, i) => (
                <span key={i} className="text-xs font-jp px-2 py-0.5 bg-white/5 rounded-md text-gray-300">
                  {p}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function ScenarioChat({ scenarioId }: { scenarioId: string }) {
  const router = useRouter();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.chat.getScenario(scenarioId).then((s) => {
      setScenario(s);
      setMessages([{ role: 'assistant', content: '会話を始めましょう！ (¡Empecemos la conversación!)', translation: '¿En qué puedo ayudarte hoy?' }]);
    }).catch(() => {});
  }, [scenarioId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setSending(true);

    try {
      const res = await api.chat.sendMessage({
        scenario_id: scenarioId,
        message: text,
        conversation_id: conversationId || undefined,
      });
      setConversationId(res.conversation_id);
      const newMsgs: ChatMessage[] = [{ role: 'assistant', content: res.reply, translation: res.reply_translation }];
      if (res.correction) newMsgs.push({ role: 'assistant', content: `💡 ${res.correction}` });
      if (res.suggestion) newMsgs.push({ role: 'assistant', content: `🗣️ ${res.suggestion}` });
      setMessages((prev) => [...prev, ...newMsgs]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'すみません、エラーが発生しました。もう一度お願いします。(Error, intenta de nuevo.)' }]);
    } finally {
      setSending(false);
    }
  };

  const toggleListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (listening) {
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    setListening(true);
  }, [listening]);

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.push('/scenarios')} className="text-gray-400 hover:text-white">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-lg font-bold">{scenario?.title || 'Cargando...'}</h1>
          <p className="text-xs text-gray-500">{scenario?.category}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role === 'user' ? 'chat-user' : 'chat-assistant'}`}>
            <p className="font-jp text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
            {m.translation && (
              <p className="text-xs text-gray-400 mt-1">{m.translation}</p>
            )}
            {m.role === 'assistant' && !m.content.startsWith('💡') && !m.content.startsWith('🗣️') && m.content.length < 200 && (
              <button onClick={() => speak(m.content)} className="mt-1.5 text-gray-500 hover:text-white">
                <Volume2 size={14} />
              </button>
            )}
          </div>
        ))}
        {sending && (
          <div className="chat-bubble chat-assistant">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <button
          onClick={toggleListening}
          className={`btn btn-secondary px-3 ${listening ? 'bg-red-500/20 text-red-400 border-red-500/30' : ''}`}
        >
          {listening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Escribe en japonés..."
          className="flex-1 bg-[#0d0d17] border border-white/10 rounded-xl px-4 py-3 text-sm font-jp focus:outline-none focus:border-jp-accent/50 text-white placeholder-gray-600"
        />
        <button onClick={sendMessage} disabled={sending || !input.trim()} className="btn btn-primary px-4">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
