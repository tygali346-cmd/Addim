import { TextToSpeechClient } from '@google-cloud/text-to-speech';

const client = new TextToSpeechClient();

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Text-i həm query, həm body-dən al
  const text = req.query.text || (req.body && req.body.text);
  
  if (!text) {
    return res.status(400).json({ 
      error: 'Text parametri tələb olunur',
      example: '/api/tts?text=salam'
    });
  }

  // Çox uzun mətnləri kəs (Google TTS limiti 5000 simvol)
  const truncatedText = text.length > 4500 
    ? text.substring(0, 4500) + '...' 
    : text;

  try {
    const [response] = await client.synthesizeSpeech({
      input: { text: truncatedText },
      voice: { 
        languageCode: 'az-AZ',
        name: 'az-AZ-Standard-A',
        ssmlGender: 'FEMALE'
      },
      audioConfig: { 
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0
      },
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.send(response.audioContent);
  } catch (error) {
    console.error('TTS xətası:', error);
    return res.status(500).json({ 
      error: 'TTS xidməti xətası',
      detail: error.message 
    });
  }
}
