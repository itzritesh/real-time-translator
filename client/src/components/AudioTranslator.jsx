import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FiMic, FiMicOff, FiRefreshCw, FiVolume2, FiCopy } from 'react-icons/fi';
import TranslationCard from './TranslationCard';

const LANGUAGES = [
  { code: 'en-US', name: 'English', apiName: 'English' },
  { code: 'es-ES', name: 'Spanish', apiName: 'Spanish' },
  { code: 'fr-FR', name: 'French', apiName: 'French' },
  { code: 'de-DE', name: 'German', apiName: 'German' },
  { code: 'it-IT', name: 'Italian', apiName: 'Italian' },
  { code: 'pt-PT', name: 'Portuguese', apiName: 'Portuguese' },
  { code: 'ru-RU', name: 'Russian', apiName: 'Russian' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', apiName: 'Chinese (Simplified)' },
  { code: 'ja-JP', name: 'Japanese', apiName: 'Japanese' },
  { code: 'ko-KR', name: 'Korean', apiName: 'Korean' },
  { code: 'hi-IN', name: 'Hindi', apiName: 'Hindi' },
  { code: 'gu-IN', name: 'Gujarati', apiName: 'Gujarati' },
  { code: 'ar-SA', name: 'Arabic', apiName: 'Arabic' }
];

export default function AudioTranslator({ onTranslateSuccess, showToast }) {
  const [sourceLang, setSourceLang] = useState('en-US');
  const [targetLang, setTargetLang] = useState('es-ES');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [translatedResult, setTranslatedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech Recognition API is not supported in this browser. Try Chrome or Edge.', 'error');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false; // Stop after speaking
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsRecording(true);
      setTranscript('');
      setTranslatedResult(null);
    };

    rec.onresult = (event) => {
      const resultText = event.results[0][0].transcript;
      setTranscript(resultText);
      showToast('Speech captured!', 'success');
      // Trigger translation automatically after speech ends
      translateAudioSpeech(resultText);
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      if (event.error === 'not-allowed') {
        showToast('Microphone access blocked. Please enable microphone permissions.', 'error');
      } else {
        showToast(`Speech recognition failed: ${event.error}`, 'error');
      }
    };

    rec.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = rec;
  }, [sourceLang, targetLang]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      showToast('Speech recognition is not supported/initialized.', 'error');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      // Set the appropriate language dialect for listening
      recognitionRef.current.lang = sourceLang;
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const translateAudioSpeech = async (speechText) => {
    if (!speechText || speechText.trim() === '') return;

    setLoading(true);
    const srcLangObj = LANGUAGES.find(l => l.code === sourceLang);
    const tgtLangObj = LANGUAGES.find(l => l.code === targetLang);

    try {
      const response = await axios.post('/translate', {
        text: speechText,
        source: srcLangObj?.apiName,
        target: tgtLangObj?.apiName,
        context: 'Travel' // Audio translation is optimized for verbal communication/travel
      });

      setTranslatedResult(response.data);
      if (onTranslateSuccess) {
        onTranslateSuccess();
      }

      // Automatically speak translation back to the user
      speakTranslation(response.data.best_translation, tgtLangObj?.apiName);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to translate audio input.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const speakTranslation = (text, languageName) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const matchedLang = LANGUAGES.find(l => l.apiName === languageName);
      const langCode = matchedLang ? matchedLang.code : 'en-US';
      
      utterance.lang = langCode;
      
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith(langCode.slice(0, 2)));
      if (voice) {
        utterance.voice = voice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div className="glass-card audio-panel" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Real-Time Audio Translator</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          Speak into your microphone. AuraTranslate will detect, translate, and read it back to you.
        </p>

        {/* Language Selection Row */}
        <div className="controls-row" style={{ width: '100%', maxWidth: '600px', marginBottom: '2.5rem' }}>
          <div className="select-wrapper">
            <label className="form-label" style={{ marginBottom: '0.35rem', display: 'block', fontSize: '0.8rem' }}>I Speak:</label>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="custom-select"
              disabled={isRecording}
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: '1.25rem', color: 'var(--text-muted)', paddingTop: '1.25rem' }}>➔</div>

          <div className="select-wrapper">
            <label className="form-label" style={{ marginBottom: '0.35rem', display: 'block', fontSize: '0.8rem' }}>Translate To:</label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="custom-select"
              disabled={isRecording}
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Microphone Button Controls */}
        <div className="mic-wrapper">
          <button
            onClick={toggleRecording}
            className={`mic-btn ${isRecording ? 'recording' : ''}`}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
            disabled={loading}
          >
            {isRecording ? <FiMicOff /> : <FiMic />}
          </button>
          <div className="mic-glow"></div>
        </div>

        {/* Waveform Visualizer */}
        <div className="waveform">
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
        </div>

        <div style={{ color: isRecording ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.95rem' }}>
          {isRecording ? 'Listening... Speak now.' : 'Tap microphone to start speaking'}
        </div>
      </div>

      {/* Captured Transcripts */}
      {transcript && (
        <div className="glass-card" style={{ marginBottom: '1.5rem', animation: 'fadeIn 0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--primary)' }}>Detected Speech</span>
            <button className="icon-btn" onClick={() => handleCopy(transcript)} title="Copy original text">
              <FiCopy />
            </button>
          </div>
          <div style={{ fontSize: '1.15rem', fontStyle: 'italic', color: 'var(--text-primary)' }}>
            "{transcript}"
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="glass-card">
          <div className="result-header">
            <div className="skeleton-box skeleton-text" style={{ width: '40%' }}></div>
            <div className="skeleton-box skeleton-text" style={{ width: '25%' }}></div>
          </div>
          <div className="skeleton-box" style={{ height: '80px', marginBottom: '1rem' }}></div>
          <div className="skeleton-box skeleton-text" style={{ width: '60%' }}></div>
        </div>
      )}

      {/* Result translation card */}
      {!loading && translatedResult && (
        <TranslationCard
          result={translatedResult}
          targetLang={LANGUAGES.find(l => l.code === targetLang)?.apiName}
          onDownload={() => {
            const element = document.createElement("a");
            const file = new Blob([translatedResult.best_translation], { type: 'text/plain' });
            element.href = URL.createObjectURL(file);
            element.download = `voice_translation_${Date.now()}.txt`;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
            showToast('Voice translation saved.', 'success');
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}
