import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiTrash2, FiStar, FiSearch, FiVolume2, FiCopy, FiClock, FiTrash } from 'react-icons/fi';
import { HiOutlineSwitchHorizontal } from 'react-icons/hi';

export default function History({ showToast, onRefreshStats }) {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/history?q=${encodeURIComponent(search)}`);
      setHistory(response.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch translation history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchHistory();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this translation from history?')) return;
    try {
      await axios.delete(`/history/${id}`);
      showToast('Item deleted.', 'success');
      fetchHistory();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete history item.', 'error');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to CLEAR ALL translation history? This cannot be undone.')) return;
    try {
      await axios.delete('/history');
      showToast('All translation history cleared.', 'success');
      fetchHistory();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error(err);
      showToast('Failed to clear history.', 'error');
    }
  };

  const handleToggleFavorite = async (id) => {
    try {
      const response = await axios.put(`/history/${id}/favorite`);
      
      // Update local state state to avoid complete list refetch
      setHistory(prev => prev.map(item => 
        item.id === id ? { ...item, favorite: response.data.favorite } : item
      ));

      showToast(response.data.favorite ? 'Added to favorites' : 'Removed from favorites', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update favorite status.', 'error');
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  };

  const handleSpeak = (text, targetLang) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
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
      
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith(langCode.slice(0, 2)));
      if (voice) {
        utterance.voice = voice;
      }

      window.speechSynthesis.speak(utterance);
    } else {
      showToast('Speech synthesis not supported in this browser.', 'error');
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div className="glass-card">
        {/* Search and control header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Translation Memory / History</h2>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%', maxWidth: '450px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="Search history by word, language, or context..."
                className="search-input"
                style={{ paddingLeft: '2.5rem' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>

            {history.length > 0 && (
              <button className="btn btn-secondary" onClick={handleClearAll} style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '0.65rem 1rem' }}>
                <FiTrash />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Loading display */}
        {loading && (
          <div className="history-list">
            {[1, 2].map(i => (
              <div key={i} className="history-card">
                <div className="skeleton-box skeleton-text" style={{ width: '30%', marginBottom: '1rem' }}></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="skeleton-box" style={{ height: '60px' }}></div>
                  <div className="skeleton-box" style={{ height: '60px' }}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && history.length === 0 && (
          <div className="empty-state">
            <FiClock className="empty-icon" />
            <p>No translation history available.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Translations triggered on the Translator or Audio tab are automatically stored here.
            </p>
          </div>
        )}

        {/* History List */}
        {!loading && history.length > 0 && (
          <div className="history-list">
            {history.map(item => (
              <div key={item.id} className="history-card">
                
                {/* Meta details */}
                <div className="history-meta">
                  <div className="history-lang-flow">
                    <span>{item.source_lang}</span>
                    <HiOutlineSwitchHorizontal style={{ fontSize: '0.9rem' }} />
                    <span>{item.target_lang}</span>
                    <span className="term-badge" style={{ fontSize: '0.7rem', padding: '0.05rem 0.4rem', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                      {item.context}
                    </span>
                    {item.details?.quality_score && (
                      <span className="term-badge" style={{ fontSize: '0.7rem', padding: '0.05rem 0.4rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)', borderColor: 'rgba(16, 185, 129, 0.2)', marginLeft: '0.5rem' }}>
                        Acc: {item.details.quality_score}%
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className="history-time">{formatDate(item.timestamp)}</span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        className={`icon-btn ${item.favorite ? 'active' : ''}`}
                        onClick={() => handleToggleFavorite(item.id)}
                        title="Favorite"
                      >
                        <FiStar style={{ fill: item.favorite ? 'currentColor' : 'none' }} />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => handleDeleteItem(item.id)}
                        style={{ color: 'var(--danger)' }}
                        title="Delete record"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Text boxes */}
                <div className="history-grid">
                  <div className="history-text-box">
                    <div className="history-label">Original Text</div>
                    <div className="history-content">{item.original_text}</div>
                  </div>

                  <div className="history-text-box" style={{ borderLeft: '3px solid var(--primary)', background: 'rgba(99, 102, 241, 0.02)' }}>
                    <div className="history-label">Translated Text</div>
                    <div className="history-content">{item.translated_text}</div>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem', marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.5rem' }}>
                      <button className="icon-btn" onClick={() => handleSpeak(item.translated_text, item.target_lang)} title="Listen">
                        <FiVolume2 />
                      </button>
                      <button className="icon-btn" onClick={() => handleCopy(item.translated_text)} title="Copy">
                        <FiCopy />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
