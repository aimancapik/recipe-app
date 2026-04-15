import { useState, useCallback, useEffect, useRef } from 'react';

export interface SpeechSettings {
  rate: number;
  pitch: number;
  voiceURI: string;
}

const DEFAULT_SETTINGS: SpeechSettings = {
  rate: 0.9,
  pitch: 1,
  voiceURI: '',
};

function loadSpeechSettings(): SpeechSettings {
  try {
    const data = localStorage.getItem('cooking_speech_settings');
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}

function saveSpeechSettings(settings: SpeechSettings) {
  try { localStorage.setItem('cooking_speech_settings', JSON.stringify(settings)); } catch {}
}

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useState<SpeechSettings>(loadSpeechSettings);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load available voices (they load async on some browsers)
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) setVoices(available);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [isSupported]);

  const updateSettings = useCallback((updates: Partial<SpeechSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      saveSpeechSettings(next);
      return next;
    });
  }, []);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text.trim()) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = 1;

    if (settings.voiceURI) {
      const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === settings.voiceURI);
      if (voice) utterance.voice = voice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, settings]);

  const toggle = useCallback(() => {
    setIsEnabled(prev => {
      if (prev) stop();
      return !prev;
    });
  }, [stop]);

  useEffect(() => {
    return () => { if (isSupported) window.speechSynthesis.cancel(); };
  }, [isSupported]);

  return {
    speak,
    stop,
    toggle,
    isSpeaking,
    isEnabled,
    setIsEnabled,
    isSupported,
    voices,
    settings,
    updateSettings,
  };
}
