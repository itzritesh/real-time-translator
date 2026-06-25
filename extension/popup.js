document.getElementById('translateBtn').addEventListener('click', async () => {
  const text = document.getElementById('sourceText').value;
  const source = document.getElementById('sourceLang').value;
  const target = document.getElementById('targetLang').value;
  const btn = document.getElementById('translateBtn');
  const resultContainer = document.getElementById('resultContainer');
  const resultText = document.getElementById('resultText');
  const qualityScore = document.getElementById('qualityScore');
  const toneBadge = document.getElementById('toneBadge');

  if (!text || text.trim() === '') {
    alert('Please enter some text to translate.');
    return;
  }

  btn.disabled = true;
  btn.innerText = 'Translating...';
  resultContainer.style.display = 'none';

  try {
    const response = await fetch('http://localhost:5065/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        source: source === 'Auto-Detect' ? 'Auto-Detect' : source,
        target,
        context: 'Casual'
      })
    });

    if (!response.ok) {
      throw new Error('Translation request failed.');
    }

    const data = await response.json();

    resultText.innerText = data.best_translation;
    qualityScore.innerText = `Accuracy: ${data.quality_score}%`;
    toneBadge.innerText = `Tone: Casual`;
    
    resultContainer.style.display = 'block';
  } catch (err) {
    console.error(err);
    alert('Failed to connect to local translation server. Please make sure the server is running on http://localhost:5065');
  } finally {
    btn.disabled = false;
    btn.innerText = 'Translate';
  }
});

// Copy Action
document.getElementById('copyLink').addEventListener('click', () => {
  const resultText = document.getElementById('resultText').innerText;
  navigator.clipboard.writeText(resultText).then(() => {
    const originalText = document.getElementById('copyLink').innerText;
    document.getElementById('copyLink').innerText = 'Copied!';
    setTimeout(() => {
      document.getElementById('copyLink').innerText = originalText;
    }, 1500);
  });
});

// Speak Action
document.getElementById('speakLink').addEventListener('click', () => {
  const text = document.getElementById('resultText').innerText;
  const target = document.getElementById('targetLang').value;

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

    const langCode = langMap[target] || 'en-US';
    utterance.lang = langCode;
    window.speechSynthesis.speak(utterance);
  } else {
    alert('Speech synthesis is not supported in your browser.');
  }
});
