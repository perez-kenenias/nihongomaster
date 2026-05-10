'use client';

import { useState, useEffect } from 'react';
import { api, Deck } from '@/lib/api';
import { Download, Trash2, Plus } from 'lucide-react';

export default function SettingsPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [dailyGoal, setDailyGoal] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('nihongomaster_daily_goal') || '20';
    return '20';
  });
  const [ollamaModel, setOllamaModel] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('nihongomaster_ollama_model') || 'elyza-jp-8b';
    return 'elyza-jp-8b';
  });
  const [message, setMessage] = useState('');
  const [ollamaStatus, setOllamaStatus] = useState<string>('checking');

  useEffect(() => {
    api.study.getDecks().then(setDecks).catch(() => {});
    fetch('/api/health')
      .then((r) => r.ok ? setOllamaStatus('connected') : setOllamaStatus('error'))
      .catch(() => setOllamaStatus('disconnected'));
  }, []);

  const saveDailyGoal = (val: string) => {
    setDailyGoal(val);
    localStorage.setItem('nihongomaster_daily_goal', val);
    flash('Meta diaria guardada');
  };

  const saveOllamaModel = (val: string) => {
    setOllamaModel(val);
    localStorage.setItem('nihongomaster_ollama_model', val);
    flash('Modelo Ollama guardado');
  };

  const flash = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const deleteDeck = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}" y todas sus tarjetas?`)) return;
    await api.study.deleteDeck(id);
    setDecks((prev) => prev.filter((d) => d.id !== id));
    flash('Mazo eliminado');
  };

  const exportData = async () => {
    try {
      const allDecks = await api.study.getDecks();
      const allData: any[] = [];
      for (const deck of allDecks) {
        const cards = await api.study.getCards(deck.id);
        allData.push({ deck, cards });
      }
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nihongomaster_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      flash('Datos exportados');
    } catch {
      flash('Error al exportar');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Ajustes</h1>
      </div>

      {message && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm">
          {message}
        </div>
      )}

      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Estudio</h2>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Tarjetas nuevas por día</label>
          <div className="flex gap-2">
            <input
              type="number" min={1} max={200} value={dailyGoal}
              onChange={(e) => setDailyGoal(e.target.value)}
              className="bg-[#0d0d17] border border-white/10 rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:border-jp-accent/50"
            />
            <button onClick={() => saveDailyGoal(dailyGoal)} className="btn btn-secondary text-xs">
              Guardar
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Modelo Ollama</label>
          <div className="flex gap-2">
            <input
              type="text" value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
              placeholder="ej: elyza-jp-8b"
              className="flex-1 bg-[#0d0d17] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-jp-accent/50"
            />
            <button onClick={() => saveOllamaModel(ollamaModel)} className="btn btn-secondary text-xs">
              Guardar
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className={`w-2 h-2 rounded-full ${
              ollamaStatus === 'connected' ? 'bg-green-400' : ollamaStatus === 'checking' ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            <span className="text-xs text-gray-500">
              {ollamaStatus === 'connected' ? 'Conectado a Ollama' : ollamaStatus === 'checking' ? 'Verificando...' : 'Sin conexión a Ollama'}
            </span>
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Datos</h2>
        <button onClick={exportData} className="btn btn-secondary w-full justify-center">
          <Download size={16} />
          Exportar todos los datos (JSON)
        </button>
      </div>

      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Mazos creados</h2>
        {decks.length === 0 ? (
          <p className="text-sm text-gray-500">No hay mazos creados manualmente.</p>
        ) : (
          <div className="space-y-2">
            {decks.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
                <div>
                  <span className="text-sm font-medium">{d.title}</span>
                  <span className="text-xs text-gray-500 ml-2">{d.card_count} tarjetas</span>
                </div>
                <button
                  onClick={() => deleteDeck(d.id, d.title)}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Acerca de</h2>
        <div className="text-sm text-gray-500 space-y-1">
          <p>NihongoMaster v0.1.0</p>
          <p>Backend: FastAPI + SQLite + Ollama</p>
          <p>Frontend: Next.js + Tailwind CSS</p>
          <p>Sistema SRS: FSRS</p>
        </div>
      </div>
    </div>
  );
}
