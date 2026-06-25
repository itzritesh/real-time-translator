const axios = require('axios');

/**
 * Get translation context instructions for Groq LLM
 */
function getSystemPrompt(glossary = []) {
  let glossaryText = "";
  if (glossary && glossary.length > 0) {
    glossaryText = "\nHere is a list of glossary terms/custom translations you MUST respect if they appear in the source text:\n" +
      glossary.map(g => `- Original: "${g.original}", Translation: "${g.translation}", Language: "${g.language || 'Any'}"`).join('\n');
  }

  return `You are a highly advanced AI Real-Time Language Translator, Localization Expert, and Cultural Advisor. 
Your task is to translate the provided text from the source language to the target language, taking into account the specified context/tone (e.g., Business, Casual, Formal, Medical, Legal, Technical, Academic, Travel).

${glossaryText}

Please perform the translation according to the following strict guidelines:
1. **Avoid Literal Translations**: Focus on localization, natural flow, and conveying the precise meaning.
2. **Context Adaptation**: Tailor the language structure, grammar, and vocabulary to the selected context.
3. **Slang & Idioms**: Correctly translate slang and idioms to their equivalents in the target language.
4. **Cultural Relevance**: Ensure the translation is culturally appropriate for the target audience.
5. **Quality Assessment**: Provide an objective translation quality score out of 100 based on accuracy, tone fit, and natural phrasing.

You MUST respond with a RAW JSON object ONLY. Do not include any introductory or concluding text, explanations, or markdown code block formatting. Just return the JSON object matching this schema:
{
  "best_translation": "The most accurate, contextually-appropriate and natural translation",
  "alternatives": [
    "Alternative translation variation 1",
    "Alternative translation variation 2",
    "Alternative translation variation 3"
  ],
  "formal": "The translation adapted specifically for a formal context",
  "casual": "The translation adapted specifically for a casual/informal context",
  "culture_notes": "Explanation of cultural adaptations, context changes, or nuances in the target language",
  "idiom_explanation": "Explanation of any idioms, slang, or figurative speech translated, or N/A if none",
  "quality_score": "Quality score as a string percentage (e.g., '98')"
}`;
}

/**
 * Generates mock response for local testing when Groq API key is missing or invalid
 */
function getMockTranslation(text, source, target, context) {
  const src = source || 'Auto-Detected';
  const tgt = target || 'English';
  const ctx = context || 'Casual';

  return {
    best_translation: `[Mock Groq Translation] "${text}" from ${src} to ${tgt} (${ctx} context)`,
    alternatives: [
      `Groq alternative variation 1 for: "${text}"`,
      `Groq alternative variation 2 for: "${text}"`,
      `Groq alternative variation 3 for: "${text}"`
    ],
    formal: `[Groq Formal version of: "${text}"] in ${tgt}`,
    casual: `[Groq Casual version of: "${text}"] in ${tgt}`,
    culture_notes: `This is a mock cultural insight. When translating from ${src} to ${tgt}, localization adjustments are typically made to align with native patterns and conversational pacing.`,
    idiom_explanation: `No idioms were detected in the source text "${text}". If an idiom were present, its figurative meaning and translation rationale would be detailed here.`,
    quality_score: "96"
  };
}

/**
 * Translate text using Groq API
 */
async function translateText(text, source, target, context, glossary = []) {
  const apiKey = process.env.GROQ_API_KEY;

  // Fallback to mock data if key is placeholder or empty
  if (!apiKey || apiKey === 'your-groq-api-key-here' || apiKey.trim() === '') {
    console.warn("WARNING: GROQ_API_KEY is not configured or is placeholder. Using mock translation service.");
    return getMockTranslation(text, source, target, context);
  }

  const systemPrompt = getSystemPrompt(glossary);
  const userMessage = `Source Language: ${source || 'Auto-Detect'}
Target Language: ${target}
Selected Context: ${context || 'General'}
Text to Translate:
"${text}"`;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15s timeout
      }
    );

    const content = response.data.choices[0].message.content;
    
    try {
      return JSON.parse(content.trim());
    } catch (e) {
      console.error("Failed to parse JSON response from Groq:", content);
      throw new Error("Invalid response format from Groq translation service");
    }
  } catch (error) {
    console.error("Groq API Translation error:", error.response ? error.response.data : error.message);
    
    // If it's a authorization error, fallback to mock so client is still testable
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn("Groq API key appears to be invalid. Falling back to mock translation.");
      return getMockTranslation(text, source, target, context);
    }
    
    throw error;
  }
}

module.exports = {
  translateText
};
