import React from 'react';
import { HiOutlineTranslate } from 'react-icons/hi';
import { FiMessageSquare, FiMic, FiBook, FiClock, FiSun } from 'react-icons/fi';

export default function Navbar({ activeTab, setActiveTab, translationCount = 0 }) {
  return (
    <nav className="navbar">
      <div className="nav-brand" onClick={() => setActiveTab('translator')}>
        <HiOutlineTranslate />
        <span>AuraTranslate</span>
      </div>

      <div className="nav-menu">
        <button
          className={`nav-item ${activeTab === 'translator' ? 'active' : ''}`}
          onClick={() => setActiveTab('translator')}
          title="Text Translator"
        >
          <FiMessageSquare />
          <span>Translator</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'audio' ? 'active' : ''}`}
          onClick={() => setActiveTab('audio')}
          title="Voice-to-Voice Translator"
        >
          <FiMic />
          <span>Audio Translator</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'glossary' ? 'active' : ''}`}
          onClick={() => setActiveTab('glossary')}
          title="Manage Custom Terms"
        >
          <FiBook />
          <span>Glossary</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
          title="Translation Memory"
        >
          <FiClock />
          <span>History</span>
        </button>
      </div>

      <div className="nav-stats">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#7c3aed' }}>
          <FiSun />
          <span>Light Mode</span>
        </div>
        <div style={{ width: '1px', height: '16px', background: 'rgba(0,0,0,0.08)' }}></div>
        <div>
          Translations: <span className="counter-badge">{translationCount}</span>
        </div>
      </div>
    </nav>
  );
}
