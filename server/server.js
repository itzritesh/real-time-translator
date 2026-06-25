const express = require('express');
const cors = require('cors');
require('dotenv').config();

const translateRouter = require('./routes/translate');
const glossaryRouter = require('./routes/glossary');
const historyRouter = require('./routes/history');

const app = express();
const PORT = process.env.PORT || 5065;

// Enable CORS for frontend client and chrome extensions
app.use(cors({
  origin: '*', // Allow all origins including extension background/popup pages
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Base Route
app.get('/', (req, res) => {
  res.send('Server Running');
});

// Mounted Routes
app.use('/translate', translateRouter);
app.use('/glossary', glossaryRouter);
app.use('/history', historyRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err.stack);
  res.status(500).json({ error: "Something went wrong on the server!" });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`Real-Time Translator Server listening on PORT ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}`);
  console.log(`===============================================`);
});
