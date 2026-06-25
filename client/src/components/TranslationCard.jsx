import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiCopy, FiVolume2, FiStar, FiDownload, FiChevronDown, FiChevronUp } from 'react-icons/fi';

export default function TranslationCard({ result, targetLang, onDownload, showToast }) {
  const [activeAccordion, setActiveAccordion] = useState(null); // 'alts', 'tones', 'culture', 'idioms'
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    // Reset states when a new result comes in
    setIsFavorite(false);
    setActiveAccordion(null);
  }, [result]);

  const toggleFavorite = async () => {
    if (!result.id) {
      showToast('Cannot favorite this translation (no ID found).', 'error');
      return;
    }

    try {
      await axios.put(`/history/${result.id}/favorite`);
      setIsFavorite(!isFavorite);
      showToast(isFavorite ? 'Removed from favorites' : 'Added to favorites', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to toggle favorite status.', 'error');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result.best_translation);
    showToast('Translation copied to clipboard!', 'success');
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any current speech
      const utterance = new SpeechSynthesisUtterance(result.best_translation);

      // Map language names to BCP-47 codes
      const langMap = {
        'English': 'en-US',
        'Spanish': 'es-ES',
        'French': 'fr-FR',
        'German': 'de-DE',
        'Italian': 'it-IT',
        'Portuguese': 'pt-PT',
        'Russian': 'ru-RU',
        'Chinese (Simplified)': 'zh-CN',
        'Japanese': 'ja-JP',
        'Korean': 'ko-KR',
        'Hindi': 'hi-IN',
        'Gujarati': 'gu-IN',
        'Arabic': 'ar-SA'
      };

      const langCode = langMap[targetLang] || 'en-US';
      utterance.lang = langCode;
      
      // Attempt to load native voices matching the language code
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith(langCode));
      if (voice) {
        utterance.voice = voice;
      }

      window.speechSynthesis.speak(utterance);
      showToast(`Speaking translation in ${targetLang}...`, 'success');
    } else {
      showToast('Speech synthesis not supported in this browser.', 'error');
    }
  };

  const toggleAccordion = (section) => {
    if (activeAccordion === section) {
      setActiveAccordion(null);
    } else {
      setActiveAccordion(section);
    }
  };

  // Convert quality score to numeric
  const score = parseInt(result.quality_score, 10) || 95;

  return (
    <div className="glass-card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Header with Title and Quality Score */}
      <div className="result-header">
        <div className="result-title">
          <span>Best Translation</span>
          <span className="term-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--secondary)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            Localized
          </span>
        </div>
        <div className="score-container">
          <div className="score-header">
            <span>Accuracy Score</span>
            <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{score}%</span>
          </div>
          <div className="score-bar-bg">
            <div className="score-bar-fill" style={{ width: `${score}%` }}></div>
          </div>
        </div>
      </div>

      {/* Main output text */}
      <div className="output-container">
        <div className="output-text typing-container">{result.best_translation}</div>
        
        <div className="output-actions">
          <button className={`icon-btn ${isFavorite ? 'active' : ''}`} onClick={toggleFavorite} title="Favorite Translation">
            <FiStar style={{ fill: isFavorite ? 'currentColor' : 'none' }} />
          </button>
          <button className="icon-btn" onClick={handleSpeak} title="Listen translation">
            <FiVolume2 />
          </button>
          <button className="icon-btn" onClick={handleCopy} title="Copy translation">
            <FiCopy />
          </button>
          <button className="icon-btn" onClick={onDownload} title="Download as TXT">
            <FiDownload />
          </button>
        </div>
      </div>

      {/* Collapsible details panels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        
        {/* Accordion 1: Alternatives */}
        <div className="accordion-section">
          <button className="accordion-trigger" onClick={() => toggleAccordion('alts')}>
            <span>Alternative Phrasings</span>
            {activeAccordion === 'alts' ? <FiChevronUp /> : <FiChevronDown />}
          </button>
          {activeAccordion === 'alts' && (
            <div className="accordion-content">
              {result.alternatives && result.alternatives.length > 0 ? (
                <div className="alternative-list">
                  {result.alternatives.map((alt, idx) => (
                    <div key={idx} className="alt-item">
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginRight: '0.5rem' }}>#{idx+1}</span>
                      {alt}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No alternative phrasings available.</p>
              )}
            </div>
          )}
        </div>

        {/* Accordion 2: Tone Adjustments */}
        <div className="accordion-section">
          <button className="accordion-trigger" onClick={() => toggleAccordion('tones')}>
            <span>Tone Adjustments</span>
            {activeAccordion === 'tones' ? <FiChevronUp /> : <FiChevronDown />}
          </button>
          {activeAccordion === 'tones' && (
            <div className="accordion-content">
              <div className="info-grid">
                <div className="sub-card">
                  <div className="sub-card-title">Casual Context</div>
                  <div className="sub-card-content" style={{ color: 'var(--text-primary)' }}>
                    {result.casual || 'Not available'}
                  </div>
                </div>
                <div className="sub-card">
                  <div className="sub-card-title">Formal Context</div>
                  <div className="sub-card-content" style={{ color: 'var(--text-primary)' }}>
                    {result.formal || 'Not available'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 3: Cultural Adaptation Notes */}
        <div className="accordion-section">
          <button className="accordion-trigger" onClick={() => toggleAccordion('culture')}>
            <span>Cultural Adaptation Notes</span>
            {activeAccordion === 'culture' ? <FiChevronUp /> : <FiChevronDown />}
          </button>
          {activeAccordion === 'culture' && (
            <div className="accordion-content">
              <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
                {result.culture_notes || "No specific cultural adaptations needed for this translation."}
              </p>
            </div>
          )}
        </div>

        {/* Accordion 4: Slang & Idiom Explanations */}
        <div className="accordion-section">
          <button className="accordion-trigger" onClick={() => toggleAccordion('idioms')}>
            <span>Idioms & Slang Analysis</span>
            {activeAccordion === 'idioms' ? <FiChevronUp /> : <FiChevronDown />}
          </button>
          {activeAccordion === 'idioms' && (
            <div className="accordion-content">
              <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
                {result.idiom_explanation || "No specialized idioms or slang detected."}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
