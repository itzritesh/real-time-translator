import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiTrash2, FiEdit2, FiSearch, FiSave, FiX, FiCheck } from 'react-icons/fi';

const LANGUAGES = [
  'Any',
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Chinese (Simplified)',
  'Japanese',
  'Korean',
  'Hindi',
  'Gujarati',
  'Arabic'
];

export default function Glossary({ showToast }) {
  const [terms, setTerms] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [original, setOriginal] = useState('');
  const [translation, setTranslation] = useState('');
  const [language, setLanguage] = useState('Any');

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editOriginal, setEditOriginal] = useState('');
  const [editTranslation, setEditTranslation] = useState('');
  const [editLanguage, setEditLanguage] = useState('Any');

  // Fetch glossary terms
  const fetchGlossary = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/glossary?q=${encodeURIComponent(search)}`);
      setTerms(response.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch glossary terms.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchGlossary();
    }, 300); // Debounce search

    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleAddTerm = async (e) => {
    e.preventDefault();
    if (!original.trim() || !translation.trim()) {
      showToast('Please fill out both original and translation fields.', 'error');
      return;
    }

    try {
      await axios.post('/glossary', {
        original,
        translation,
        language
      });
      showToast('Glossary term added successfully!', 'success');
      setOriginal('');
      setTranslation('');
      setLanguage('Any');
      fetchGlossary();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to save glossary term.', 'error');
    }
  };

  const handleDeleteTerm = async (id) => {
    if (!window.confirm('Are you sure you want to delete this glossary term?')) return;
    try {
      await axios.delete(`/glossary/${id}`);
      showToast('Glossary term deleted.', 'success');
      fetchGlossary();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete glossary term.', 'error');
    }
  };

  const startEdit = (term) => {
    setEditingId(term.id);
    setEditOriginal(term.original);
    setEditTranslation(term.translation);
    setEditLanguage(term.language || 'Any');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdateTerm = async (id) => {
    if (!editOriginal.trim() || !editTranslation.trim()) {
      showToast('Both original and translation fields are required.', 'error');
      return;
    }

    try {
      await axios.put(`/glossary/${id}`, {
        original: editOriginal,
        translation: editTranslation,
        language: editLanguage
      });
      showToast('Glossary term updated.', 'success');
      setEditingId(null);
      fetchGlossary();
    } catch (err) {
      console.error(err);
      showToast('Failed to update glossary term.', 'error');
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Create form */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.25rem', fontSize: '1.35rem', fontWeight: 700 }}>Add Custom Translation Term</h2>
        <form onSubmit={handleAddTerm} className="glossary-form">
          <div className="form-group">
            <label className="form-label">Original Jargon / Slang</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Break a leg"
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Custom Target Translation</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. ¡Buena suerte!"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Language Association</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="custom-select"
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', height: '46px' }}>
            <FiPlus />
            <span>Add Term</span>
          </button>
        </form>
      </div>

      {/* Glossary list card */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Custom Glossary Terms</h2>
          
          <div className="search-row" style={{ marginBottom: 0, width: '100%', maxWidth: '320px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                placeholder="Search glossary..."
                className="search-input"
                style={{ paddingLeft: '2.5rem' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>

        {loading && (
          <div className="glossary-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="glossary-card">
                <div className="skeleton-box skeleton-text" style={{ width: '40%' }}></div>
                <div className="skeleton-box skeleton-text" style={{ width: '80%' }}></div>
                <div className="skeleton-box skeleton-text" style={{ width: '60%' }}></div>
              </div>
            ))}
          </div>
        )}

        {!loading && terms.length === 0 && (
          <div className="empty-state">
            <FiSearch className="empty-icon" />
            <p>No glossary terms found.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Add a new term above to customize Claude's translation behavior.
            </p>
          </div>
        )}

        {!loading && terms.length > 0 && (
          <div className="glossary-grid wide">
            {terms.map(term => (
              <div key={term.id} className="glossary-card">
                
                {editingId === term.id ? (
                  /* Edit Mode UI */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                    <div className="form-group">
                      <input
                        type="text"
                        className="form-input"
                        value={editOriginal}
                        onChange={(e) => setEditOriginal(e.target.value)}
                        placeholder="Original term"
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        className="form-input"
                        value={editTranslation}
                        onChange={(e) => setEditTranslation(e.target.value)}
                        placeholder="Translation"
                      />
                    </div>
                    <div className="form-group">
                      <select
                        value={editLanguage}
                        onChange={(e) => setEditLanguage(e.target.value)}
                        className="custom-select"
                      >
                        {LANGUAGES.map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                    </div>
                    <div className="card-actions">
                      <button className="icon-btn" onClick={() => handleUpdateTerm(term.id)} style={{ color: 'var(--secondary)' }} title="Save">
                        <FiCheck />
                      </button>
                      <button className="icon-btn" onClick={cancelEdit} style={{ color: 'var(--danger)' }} title="Cancel">
                        <FiX />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Read Mode UI */
                  <>
                    <div className="term-header">
                      <span className="term-badge">{term.language || 'Any'}</span>
                    </div>
                    <div className="term-body">
                      <div className="term-original">{term.original}</div>
                      <div className="term-arrow">translates to</div>
                      <div className="term-translation">{term.translation}</div>
                    </div>
                    <div className="card-actions">
                      <button className="icon-btn" onClick={() => startEdit(term)} title="Edit term">
                        <FiEdit2 />
                      </button>
                      <button className="icon-btn" onClick={() => handleDeleteTerm(term.id)} style={{ color: 'var(--danger)' }} title="Delete term">
                        <FiTrash2 />
                      </button>
                    </div>
                  </>
                )}

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
