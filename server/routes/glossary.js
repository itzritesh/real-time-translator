const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const GLOSSARY_FILE = path.join(__dirname, '../data/glossary.json');

// Helper to read glossary file
function readGlossary() {
  try {
    if (!fs.existsSync(GLOSSARY_FILE)) {
      fs.writeFileSync(GLOSSARY_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(GLOSSARY_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error("Error reading glossary file:", err);
    return [];
  }
}

// Helper to write glossary file
function writeGlossary(data) {
  try {
    fs.writeFileSync(GLOSSARY_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error writing glossary file:", err);
    return false;
  }
}

// @route   GET /glossary
// @desc    Get glossary items (with optional search query)
router.get('/', (req, res) => {
  const { q } = req.query;
  let glossary = readGlossary();

  if (q) {
    const query = q.toLowerCase();
    glossary = glossary.filter(item => 
      item.original.toLowerCase().includes(query) ||
      item.translation.toLowerCase().includes(query) ||
      (item.language && item.language.toLowerCase().includes(query))
    );
  }

  res.json(glossary);
});

// @route   POST /glossary
// @desc    Add new glossary term
router.post('/', (req, res) => {
  const { original, translation, language } = req.body;

  if (!original || !translation) {
    return res.status(400).json({ error: "Original and translation terms are required." });
  }

  const glossary = readGlossary();
  
  // Prevent duplicate original terms
  const exists = glossary.some(item => 
    item.original.toLowerCase() === original.toLowerCase() && 
    (item.language || '').toLowerCase() === (language || '').toLowerCase()
  );

  if (exists) {
    return res.status(400).json({ error: "Term already exists in glossary for this language." });
  }

  const newItem = {
    id: Date.now().toString(),
    original: original.trim(),
    translation: translation.trim(),
    language: (language || 'Any').trim()
  };

  glossary.push(newItem);
  const success = writeGlossary(glossary);

  if (!success) {
    return res.status(500).json({ error: "Failed to save glossary term." });
  }

  res.status(201).json(newItem);
});

// @route   PUT /glossary/:id
// @desc    Update a glossary term
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { original, translation, language } = req.body;

  if (!original || !translation) {
    return res.status(400).json({ error: "Original and translation terms are required." });
  }

  const glossary = readGlossary();
  const index = glossary.findIndex(item => item.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Glossary term not found." });
  }

  glossary[index] = {
    ...glossary[index],
    original: original.trim(),
    translation: translation.trim(),
    language: (language || 'Any').trim()
  };

  const success = writeGlossary(glossary);

  if (!success) {
    return res.status(500).json({ error: "Failed to update glossary term." });
  }

  res.json(glossary[index]);
});

// @route   DELETE /glossary/:id
// @desc    Delete a glossary term
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const glossary = readGlossary();
  const initialLength = glossary.length;
  const filtered = glossary.filter(item => item.id !== id);

  if (filtered.length === initialLength) {
    return res.status(404).json({ error: "Glossary term not found." });
  }

  const success = writeGlossary(filtered);

  if (!success) {
    return res.status(500).json({ error: "Failed to delete glossary term." });
  }

  res.json({ success: true, message: "Glossary term deleted successfully." });
});

module.exports = router;
