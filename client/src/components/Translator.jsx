import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiDelete, FiDownload, FiRefreshCw, FiBookOpen } from 'react-icons/fi';
import { HiOutlineSwitchHorizontal } from 'react-icons/hi';
import TranslationCard from './TranslationCard';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'hi', name: 'Hindi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'ar', name: 'Arabic' }
];

const CONTEXTS = [
  'Casual',
  'Business',
  'Formal',
  'Medical',
  'Legal',
  'Technical',
  'Academic',
  'Travel'
];

export default function Translator({ onTranslateSuccess, showToast }) {
  const [text, setText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('es');
  const [context, setContext] = useState('Casual');
  const [loading, setLoading] = useState(false);
  const [translationResult, setTranslationResult] = useState(null);
  const [recentTargets, setRecentTargets] = useState(['es', 'fr', 'hi']);

  // Load recently used target languages from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent_targets');
    if (saved) {
      try {
        setRecentTargets(JSON.parse(saved));
      } catch (e) {
        // Fallback
      }
    }
  }, []);

  const saveRecentTarget = (langCode) => {
    let updated = [langCode, ...recentTargets.filter(c => c !== langCode)];
    updated = updated.slice(0, 3); // keep top 3
    setRecentTargets(updated);
    localStorage.setItem('recent_targets', JSON.stringify(updated));
  };

  const handleTranslate = async () => {
    if (!text || text.trim() === '') {
      showToast('Please enter some text to translate.', 'error');
      return;
    }

    setLoading(true);
    setTranslationResult(null);

    const srcLangName = sourceLang === 'auto' ? 'Auto-Detect' : LANGUAGES.find(l => l.code === sourceLang)?.name;
    const tgtLangName = LANGUAGES.find(l => l.code === targetLang)?.name;

    try {
      const response = await axios.post('/translate', {
        text: text,
        source: srcLangName,
        target: tgtLangName,
        context: context
      });

      setTranslationResult(response.data);
      saveRecentTarget(targetLang);
      
      if (onTranslateSuccess) {
        onTranslateSuccess();
      }
      showToast('Translation completed successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to connect to the translation API.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    if (sourceLang === 'auto') {
      showToast('Cannot swap with Auto-Detect source.', 'error');
      return;
    }
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
  };

  const handleClear = () => {
    setText('');
    setTranslationResult(null);
  };

  const handleDownload = () => {
    if (!translationResult) return;
    const textToDownload = `AuraTranslate Output
Original: ${text}
Translation: ${translationResult.best_translation}
From: ${sourceLang === 'auto' ? 'Auto Detect' : sourceLang} To: ${targetLang}
Context: ${context}
Quality Score: ${translationResult.quality_score}%`;

    const element = document.createElement("a");
    const file = new Blob([textToDownload], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `translation_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('Translation downloaded as TXT file.', 'success');
  };

  // Word and Char Counters
  const charCount = text.length;
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

  return (
    <div className="translator-dashboard">
      {/* Input Section */}
      <div className="glass-card">
        <h2 style={{ marginBottom: '1.25rem', fontSize: '1.35rem', fontWeight: 700 }}>Source Content</h2>

        <div className="controls-row">
          {/* Source Language Select */}
          <div className="select-wrapper">
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="custom-select"
            >
              <option value="auto">🔍 Auto Detect Language</option>
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <button 
            type="button" 
            className="swap-btn" 
            onClick={handleSwap}
            disabled={sourceLang === 'auto'}
            title="Swap Languages"
          >
            <HiOutlineSwitchHorizontal />
          </button>

          {/* Target Language Select */}
          <div className="select-wrapper">
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="custom-select"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>

          {/* Context/Tone Select */}
          <div className="select-wrapper">
            <select
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="custom-select"
            >
              {CONTEXTS.map(ctx => (
                <option key={ctx} value={ctx}>Tone: {ctx}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Recently Used Languages */}
        {recentTargets.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', margin: '-0.25rem 0 1rem 0', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Recent Targets:</span>
            {recentTargets.map(code => {
              const lang = LANGUAGES.find(l => l.code === code);
              if (!lang) return null;
              return (
                <button
                  key={code}
                  className={`term-badge ${targetLang === code ? 'active' : ''}`}
                  onClick={() => setTargetLang(code)}
                  style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)', background: targetLang === code ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.02)' }}
                >
                  {lang.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Source Text Area */}
        <div className="text-area-container">
          <textarea
            className="translation-textarea"
            placeholder="Type or paste text to translate here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={3000}
          />
          <div className="text-meta">
            <div>
              <span>{wordCount} words</span>
              <span style={{ margin: '0 0.5rem' }}>•</span>
              <span>{charCount}/3000 chars</span>
            </div>
            <div className="textarea-actions">
              {text && (
                <button className="icon-btn" onClick={handleClear} title="Clear text">
                  <FiDelete />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="action-bar">
          <button
            onClick={handleTranslate}
            disabled={loading}
            className="btn btn-primary"
            style={{ minWidth: '130px' }}
          >
            {loading ? (
              <>
                <FiRefreshCw className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Translating...</span>
              </>
            ) : (
              <span>Translate</span>
            )}
          </button>
        </div>
      </div>

      {/* Output / Result Card */}
      <div className="translation-results">
        {loading && (
          <div className="glass-card">
            <div className="result-header">
              <div className="skeleton-box skeleton-text" style={{ width: '40%' }}></div>
              <div className="skeleton-box skeleton-text" style={{ width: '25%' }}></div>
            </div>
            <div className="skeleton-box" style={{ height: '80px', marginBottom: '1rem' }}></div>
            <div className="skeleton-box skeleton-text" style={{ width: '70%' }}></div>
            <div className="skeleton-box skeleton-text" style={{ width: '50%' }}></div>
          </div>
        )}

        {!loading && !translationResult && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', color: 'var(--text-secondary)' }}>
            <FiBookOpen style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.05)', marginBottom: '1rem' }} />
            <p>Your localized translation will appear here.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Select your target languages and context settings.</p>
          </div>
        )}

        {translationResult && (
          <TranslationCard
            result={translationResult}
            targetLang={LANGUAGES.find(l => l.code === targetLang)?.name}
            onDownload={handleDownload}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  );
}
