import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiX } from 'react-icons/fi';
import Navbar from './components/Navbar';
import Translator from './components/Translator';
import AudioTranslator from './components/AudioTranslator';
import Glossary from './components/Glossary';
import History from './components/History';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('translator');
  const [translationCount, setTranslationCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  // Fetch translation statistics (total count)
  const fetchStats = async () => {
    try {
      const response = await axios.get('/history');
      setTranslationCount(response.data.length);
    } catch (err) {
      console.error("Failed to load statistics:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleTranslateSuccess = () => {
    setTranslationCount(prev => prev + 1);
  };

  // Toast Notification System
  const showToast = (message, type = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto remove after 3.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'translator':
        return <Translator onTranslateSuccess={handleTranslateSuccess} showToast={showToast} />;
      case 'audio':
        return <AudioTranslator onTranslateSuccess={handleTranslateSuccess} showToast={showToast} />;
      case 'glossary':
        return <Glossary showToast={showToast} />;
      case 'history':
        return <History showToast={showToast} onRefreshStats={fetchStats} />;
      default:
        return <Translator onTranslateSuccess={handleTranslateSuccess} showToast={showToast} />;
    }
  };

  return (
    <div className="app-container">
      {/* Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        translationCount={translationCount}
      />

      {/* Main Workspace content area */}
      <main style={{ flex: 1 }}>
        {renderActiveView()}
      </main>

      {/* Footer */}
      <footer style={{ marginTop: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0', borderTop: '1px solid rgba(255,255,255,0.02)' }}>
        © {new Date().getFullYear()} AuraTranslate AI localization. Built for high fidelity real-time translation.
      </footer>

      {/* Toast Notification Mount */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              <FiX />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
