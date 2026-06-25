const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { translateText } = require('../services/groqService');

const GLOSSARY_FILE = path.join(__dirname, '../data/glossary.json');
const HISTORY_FILE = path.join(__dirname, '../data/history.json');

// Helper to read glossary
function readGlossary() {
  try {
    if (!fs.existsSync(GLOSSARY_FILE)) return [];
    return JSON.parse(fs.readFileSync(GLOSSARY_FILE, 'utf8') || '[]');
  } catch (err) {
    return [];
  }
}

// Helper to save to history
function saveToHistory(item) {
  try {
    let history = [];
    if (fs.existsSync(HISTORY_FILE)) {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8') || '[]');
    }
    history.push(item);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
  } catch (err) {
    console.error("Failed to append translation to history:", err);
  }
}

// @route   POST /translate
// @desc    Translate text with context and glossary integration
router.post('/', async (req, res) => {
  const { text, source, target, context } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({ error: "Source text is required." });
  }
  if (!target || target.trim() === '') {
    return res.status(400).json({ error: "Target language is required." });
  }

  try {
    // Get glossary to pass to translation service
    const glossary = readGlossary();
    
    // Call translation service
    const result = await translateText(text, source, target, context, glossary);
    
    // Auto-save to history database
    const historyItem = {
      id: Date.now().toString(),
      original_text: text,
      translated_text: result.best_translation,
      source_lang: source || 'Auto-Detect',
      target_lang: target,
      context: context || 'Casual',
      details: {
        alternatives: result.alternatives || [],
        formal: result.formal || '',
        casual: result.casual || '',
        culture_notes: result.culture_notes || '',
        idiom_explanation: result.idiom_explanation || '',
        quality_score: result.quality_score || '90'
      },
      favorite: false,
      timestamp: new Date().toISOString()
    };
    
    saveToHistory(historyItem);

    // Send translation result back to client
    res.json({
      ...result,
      id: historyItem.id
    });
  } catch (error) {
    console.error("Translation route error:", error.message);
    res.status(500).json({ 
      error: "Translation failed. Please verify your connection or Anthropic API Key configuration.",
      details: error.message 
    });
  }
});

module.exports = router;
