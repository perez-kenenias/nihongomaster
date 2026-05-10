'use client';

import { useState, useCallback, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { api } from '@/lib/api';

const PRACTICE_PHRASES = [
  { jp: 'こんにちは', reading: 'Konnichiwa', es: 'Hola' },
  { jp: 'ありがとうございます', reading: 'Arigatou gozaimasu', es: 'Muchas gracias' },
  { jp: 'すみません', reading: 'Sumimasen', es: 'Disculpe / Perdón' },
  { jp: 'お願いします', reading: 'Onegai shimasu', es: 'Por favor' },
  { jp: 'いただきます', reading: 'Itadakimasu', es: 'Buen provecho (antes de comer)' },
  { jp: 'おはようございます', reading: 'Ohayou gozaimasu', es: 'Buenos días' },
  { jp: '私は学生です', reading: 'Watashi wa gakusei desu', es: 'Soy estudiante' },
  { jp: 'いくらですか', reading: 'Ikura desu ka', es: '¿Cuánto cuesta?' },
  { jp: 'トイレはどこですか', reading: 'Toire wa doko desu ka', es: '¿Dónde está el baño?' },
  { jp: 'おいしいです', reading: 'Oishii desu', es: 'Está delicioso' },
];

export default function PronouncePage() {
  const [selectedPhrase, setSelectedPhrase] = useState(PRACTICE_PHRASES[0]);
  const [transcription, setTranscription] = useState('');
  const [listening, setListening] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [phonemeScores, setPhonemeScores] = useState<{ char: string; score: number; status: string }[]>([]);
  const [scoring, setScoring] = useState(false);
  const recognitionRef = useRef<any>(null);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = 0.8;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  }, []);

  const toggleListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setFeedback('Tu navegador no soporta reconocimiento de voz. Usa Chrome.');
      return;
    }

    if (listening) {
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTranscription(transcript);
      setListening(false);
      setScoring(true);
      try {
        const result = await api.pronounce.score(selectedPhrase.jp, transcript);
        setScore(result.score);
        setFeedback(result.feedback);
        setPhonemeScores(result.phoneme_scores);
      } catch {
        setFeedback('Error al evaluar. Intenta de nuevo.');
      } finally {
        setScoring(false);
      }
    };
    recognition.onerror = () => {
      setListening(false);
      setFeedback('Error de micrófono. Verifica los permisos.');
    };
    recognition.onend = () => setListening(false);
    recognition.start();
    setListening(true);
    setScore(null);
    setFeedback('');
    setPhonemeScores([]);
    setTranscription('');
  }, [listening, selectedPhrase]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Práctica de pronunciación</h1>
        <p className="text-gray-400 mt-1">Mejora tu acento japonés con feedback instantáneo</p>
      </div>

      <div className="card text-center py-12">
        <p className="text-4xl font-jp font-bold mb-3">{selectedPhrase.jp}</p>
        <p className="text-lg text-gray-400 font-jp mb-1">{selectedPhrase.reading}</p>
        <p className="text-sm text-gray-500 mb-6">{selectedPhrase.es}</p>
        <button onClick={() => speak(selectedPhrase.jp)} className="btn btn-secondary mb-6">
          <Volume2 size={18} />
          Escuchar referencia
        </button>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={toggleListening}
            disabled={scoring}
            className={`btn px-8 py-4 text-lg rounded-2xl transition-all ${
              listening
                ? 'bg-red-500/20 text-red-400 border-2 border-red-500/30 animate-pulse'
                : 'btn-primary'
            }`}
          >
            {listening ? (
              <><MicOff size={24} /> Escuchando...</>
            ) : (
              <><Mic size={24} /> Grabar pronunciación</>
            )}
          </button>

          {scoring && (
            <div className="animate-spin w-6 h-6 border-2 border-jp-accent border-t-transparent rounded-full" />
          )}

          {score !== null && (
            <div className="w-full mt-4">
              <div className={`text-5xl font-bold mb-2 ${
                score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {score}%
              </div>
              <p className="text-gray-300 mb-4">{feedback}</p>
              {transcription && (
                <p className="text-sm text-gray-500 mb-3 font-jp">
                  Detectado: <span className="text-gray-300">{transcription}</span>
                </p>
              )}
              {phonemeScores.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                  {phonemeScores.map((p, i) => (
                    <span
                      key={i}
                      className={`text-lg font-jp px-1.5 py-0.5 rounded ${
                        p.status === 'correct' ? 'bg-green-500/20 text-green-400' :
                        p.status === 'missing' ? 'bg-red-500/20 text-red-400' :
                        p.status === 'incorrect' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-500'
                      }`}
                    >
                      {p.char}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Frases para practicar</h2>
        <div className="grid grid-cols-2 gap-2">
          {PRACTICE_PHRASES.map((phrase) => (
            <button
              key={phrase.jp}
              onClick={() => { setSelectedPhrase(phrase); setScore(null); setFeedback(''); setTranscription(''); }}
              className={`text-left p-3 rounded-xl transition-colors ${
                selectedPhrase.jp === phrase.jp
                  ? 'bg-jp-accent/15 border border-jp-accent/30'
                  : 'bg-white/5 border border-transparent hover:bg-white/10'
              }`}
            >
              <p className="font-jp font-medium text-sm">{phrase.jp}</p>
              <p className="text-xs text-gray-500">{phrase.es}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
