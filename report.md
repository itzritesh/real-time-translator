# Real-Time Language Translator (AuraTranslate)

## Project Overview
Real-Time Language Translator built using React.js (Vite), Node.js, Express.js, Groq API, and Vanilla CSS. The system manages text translations across various contexts and tones, voice-to-voice translation using Web Speech APIs, custom glossary overrides, translation memory logs, and a Manifest V3 browser extension with selection-to-translate context menu bindings.

## Features Implemented
- Frosted-Glass Light Mode UI
- Tone-based Translation Settings (Casual, Business, Formal, Medical, Legal, Technical, Academic, Travel)
- Multilingual Support with Auto-Detect source selection
- Local Glossary CRUD (Overriding default translation behavior using glossary.json)
- Persistent Translation Memory / History Log (history.json with favoriting and deletion filters)
- Real-Time Voice-to-Text Input (SpeechRecognition API with waveform visualizers)
- Auto-Voice Synthesis Playback (SpeechSynthesis API)
- Accuracy Quality Scores visual tracking
- Character & Word Counters with swap languages utilities
- Manifest V3 Chrome Extension popup translate panel
- Webpage Selected Text Context Menu Translation (with dynamic content.js auto-injection)

## Technology Stack
*   **Frontend**: React.js, Vite, Axios, React Icons, Vanilla CSS
*   **Backend**: Node.js, Express.js, Axios, `dotenv`, `cors`
*   **Browser Extension**: Manifest V3, Content scripts, Background service workers, Chrome Scripting
*   **Web APIs**: Web Speech API (SpeechRecognition, SpeechSynthesis)
*   **API Testing**: Browser/React Integration & Integration Scripts

## Database Files
history.json, glossary.json

## Business Rules
- Custom glossary terms defined in `glossary.json` are supplied to the Groq API model prompts to ensure jargon translation overrides are strictly respected.
- Fallback mock service responses are served when no valid `GROQ_API_KEY` is present in the `.env` configuration, keeping all UI elements fully operational.
- Voice captures from `SpeechRecognition` triggers translated text payloads which automatically execute `SpeechSynthesisUtterance` readouts.
- Deletion of records in translation memory refreshes global volume counters.
- Right-click selections on webpages request target translations from the local server and inject a styled overlay tooltip in the active tab.
- If content scripts are missing in a tab, the background worker injects `content.js` dynamically using `chrome.scripting.executeScript` and retries.

## Dashboard
Displays active Translator interface with select controls, text areas, character counters, recently used language tags, accuracy score bars, collapsible sections (Alternatives, Formal/Casual versions, Culture Notes, Slangs Analysis), Voice mic controller panel, Glossary listing tables, and History translation memory log.

## Conclusion
The project successfully fulfills all required task objectives and provides a complete Real-Time Language Translator solution.
