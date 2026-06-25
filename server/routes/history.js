const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, '../data/history.json');

// Helper to read history file
function readHistory() {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      fs.writeFileSync(HISTORY_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(HISTORY_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error("Error reading history file:", err);
    return [];
  }
}

// Helper to write history file
function writeHistory(data) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error writing history file:", err);
    return false;
  }
}

// @route   GET /history
// @desc    Get history items (newest first, with search filter)
router.get('/', (req, res) => {
  const { q } = req.query;
  let history = readHistory();

  // Sort by timestamp newest first
  history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (q) {
    const query = q.toLowerCase();
    history = history.filter(item => 
      item.original_text.toLowerCase().includes(query) ||
      item.translated_text.toLowerCase().includes(query) ||
      item.source_lang.toLowerCase().includes(query) ||
      item.target_lang.toLowerCase().includes(query) ||
      item.context.toLowerCase().includes(query)
    );
  }

  res.json(history);
});

// @route   POST /history
// @desc    Add a translation to history manually
router.post('/', (req, res) => {
  const { original_text, translated_text, source_lang, target_lang, context, details } = req.body;

  if (!original_text || !translated_text) {
    return res.status(400).json({ error: "Original and translated text are required." });
  }

  const history = readHistory();

  const newHistoryItem = {
    id: Date.now().toString(),
    original_text: original_text.trim(),
    translated_text: translated_text.trim(),
    source_lang: (source_lang || 'Auto-Detect').trim(),
    target_lang: target_lang.trim(),
    context: (context || 'Casual').trim(),
    details: details || {},
    favorite: false,
    timestamp: new Date().toISOString()
  };

  history.push(newHistoryItem);
  const success = writeHistory(history);

  if (!success) {
    return res.status(500).json({ error: "Failed to save history item." });
  }

  res.status(201).json(newHistoryItem);
});

// @route   PUT /history/:id/favorite
// @desc    Toggle favorite status of a history item
router.put('/:id/favorite', (req, res) => {
  const { id } = req.params;
  const history = readHistory();
  const index = history.findIndex(item => item.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "History item not found." });
  }

  history[index].favorite = !history[index].favorite;
  const success = writeHistory(history);

  if (!success) {
    return res.status(500).json({ error: "Failed to toggle favorite." });
  }

  res.json(history[index]);
});

// @route   DELETE /history
// @desc    Clear all history
router.delete('/', (req, res) => {
  const success = writeHistory([]);
  if (!success) {
    return res.status(500).json({ error: "Failed to clear history." });
  }
  res.json({ success: true, message: "History cleared successfully." });
});

// @route   DELETE /history/:id
// @desc    Delete a single history item
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const history = readHistory();
  const initialLength = history.length;
  const filtered = history.filter(item => item.id !== id);

  if (filtered.length === initialLength) {
    return res.status(404).json({ error: "History item not found." });
  }

  const success = writeHistory(filtered);

  if (!success) {
    return res.status(500).json({ error: "Failed to delete history item." });
  }

  res.json({ success: true, message: "History item deleted successfully." });
});

module.exports = router;
