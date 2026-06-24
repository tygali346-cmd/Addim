import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const apiKey = process.env.GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Helper for resilient fallback content generation to bypass model-specific free-tier quotas (e.g. 429)
  async function generateContentWithFallback(params: { contents: string; config?: any }) {
    const modelChain = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    let lastError: any = null;

    for (const model of modelChain) {
      let attempts = 2;
      for (let i = 0; i < attempts; i++) {
        try {
          console.log(`[AI] Requesting model: ${model} (attempt ${i + 1})`);
          const response = await ai.models.generateContent({
            model,
            contents: params.contents,
            config: params.config,
          });
          console.log(`[AI] Ready with model: ${model}`);
          return { response, activeModel: model };
        } catch (err: any) {
          console.log(`[AI] Note: ${model} (attempt ${i + 1}) returned status info: ${err?.message || ''}`);
          lastError = err;
          const errStr = String(err?.message || err || "").toLowerCase();
          const isRateLimitOrTemp = errStr.includes('429') || errStr.includes('503') || errStr.includes('resource_exhausted') || errStr.includes('unavailable');
          if (isRateLimitOrTemp && i < attempts - 1) {
            console.log(`[AI] Re-trying ${model} in 300ms...`);
            await new Promise(res => setTimeout(res, 300));
          } else {
            break; // Proceed to the next model in chain immediately
          }
        }
      }
    }
    throw lastError || new Error("Süni intellekt modellərinin hamısı xətalı cavab verdi.");
  }

  // Diagnostics check at server startup
  console.log(`[DIAGNOSTICS] Checking GEMINI_API_KEY in environment variables...`);
  if (!apiKey) {
    console.warn(`[DIAGNOSTICS] ⚠️ GEMINI_API_KEY is NOT defined in process.env!`);
  } else {
    console.log(`[DIAGNOSTICS] ✅ GEMINI_API_KEY is loaded! (Length: ${apiKey.length} characters)`);
    const masked = apiKey.length > 8 ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : "***";
    console.log(`[DIAGNOSTICS] API Key preview: ${masked}`);
    
    console.log(`[DIAGNOSTICS] Pre-testing resilient model reachability...`);
    generateContentWithFallback({
      contents: "Hi, this is a diagnostic startup test. Please respond with a single short greeting in Azerbaijani."
    }).then(({ response, activeModel }) => {
      console.log(`[DIAGNOSTICS] ✅ Success! Active model is '${activeModel}' and responding.`);
      console.log(`[DIAGNOSTICS] Test query response: "${response.text?.trim()}"`);
    }).catch((err) => {
      console.error(`[DIAGNOSTICS] ❌ Failed all models in fallback chain on startup:`, err);
    });
  }

  // On-demand diagnostics endpoint
  app.get("/api/gemini-diagnostics", async (req, res) => {
    const diagnosticInfo = {
      apiKeyPresent: !!process.env.GEMINI_API_KEY,
      apiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
      env: process.env.NODE_ENV || "development",
      modelTestResult: "Not tested",
      error: null as any
    };

    if (!diagnosticInfo.apiKeyPresent) {
      res.json({
        success: false,
        status: "Missing API Key",
        message: "GEMINI_API_KEY env variable is completely missing or empty.",
        diagnostics: diagnosticInfo
      });
      return;
    }

    try {
      const { response, activeModel } = await generateContentWithFallback({
        contents: "Test query. Reply with 'Diagnostics OK.'"
      });
      diagnosticInfo.modelTestResult = `[${activeModel}] ${response.text || "No text returned"}`;
      res.json({
        success: true,
        status: "Healthy",
        message: `Google Gemini is working properly via active model '${activeModel}'!`,
        diagnostics: diagnosticInfo
      });
    } catch (err: any) {
      diagnosticInfo.error = err?.message || String(err);
      res.status(500).json({
        success: false,
        status: "Error",
        message: "Could not execute model query on any models in the fallback chain. See debug info.",
        diagnostics: diagnosticInfo
      });
    }
  });

  app.post("/api/gemini", async (req, res) => {
    const { prompt, context } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Sual daxil edilməyib" });
      return;
    }

    try {
      const fullPrompt = `Sən Azərbaycanda fəaliyyət göstərən, əlilliyi olan şəxslər üçün nəzərdə tutulmuş "ADDIM" rəqəmsal əlçatımlılıq platformasının rəsmi ağıllı köməkçisisən. 
Platformanın 4 modulu var: 
1. Xəritə (Məkanların əlil arabası və digər əlçatımlılıq dərəcələri haqqında məlumat).
2. Bələdçi (Dövlət və özəl qurumların əlçatımlılıq üzrə xidmət bələdçiləri).
3. Könüllülük (Dəstək axtaranlar və kömək etmək istəyən könüllülər).
4. İş imkanları (Əlilliyi olan şəxslər üçün əmək bazarı və vakansiyalar).

DÖVRİ/DİNAMİK PERSONAJ VƏ ƏHVAL ANALİZİ TƏLƏBİ:
İstifadəçinin səsli və ya yazılı daxil etdiyi sualın/söhbətin tərzini və əhval-ruhiyyəsini (hissini) mütləq analiz etməli və dinamik şəkildə əlaqəli şəxsiyyətə bürünməlisən.

Sənin uyğunlaşmalı olduğun 3 dynamic personaj (TONE) var:
1. "rəsmi" -> İstifadəçi ciddi, rəsmi, quru və ya konkret məlumat xarakterli suallar verəndə. Cavab tonu rəsmi, dəqiq, məsuliyyətli lakin səmimi olmalıdır.
2. "dostyana" -> İstifadəçi dildə qeyri-formal/casual danışanda, zarafat edəndə, salamlaşanda (məsələn: "salam", "necəsən qardaş", "əla"), və ya könüllülük üzrə yüksək həvəs göstərəndə. Cavab tonu istiqanlı, gənc, enerjili və qeyri-formal olmalıdır.
3. "dəstəkləyici" -> İstifadəçi fiziki/psixoloji maneədən, ümidsizlikdən, çətinlikdən şikayətlənəndə, qəmgin və ya yorğun olanda (məsələn: "belə yaşamaq çox çətindir", "hər yer bağlıdır", "mənə heç kim dəstək olmur"). Cavab tonu olduqca empatik, dərindən hiss edən, ürək-dirək verən, həssas və dəstəkləyici olmalıdır.

DANIŞIQ QAYDALARI (MÜTLƏQ ENMƏDƏN ƏMƏL ET):
- Canlı səsli danışıqda tamamilə təbii, rəvan, son dərəcə axıcı Azərbaycan dilində şifahi danış. Sözləri qətiyyən robot kimi və ya yazılı ədəbi mətn kimi qurma. Bir insanın digər insana deyəcəyi kimi səmimi şifahi ifadələr, təbii bağlayıcılar istifadə et (məsələn: "əlbəttə, kömək edərəm!", "narahat olmayın, birlikdə həll edərik", "çox gözəl", "baş üstə", "gəlin baxaq").
- Çox qısa və lakonik danış. Cavabın maksimum 2-3 cümlədən ibarət olmalıdır. Bu, səsli səsləndirmənin dərhal və axıcı olması üçün olduqca vacibdir!
- Süni, robotik və ya cansız şablon ifadələrini ("Əlbəttə!", "Mən sizə kömək etməkdən şadam!") QƏTİYYƏN İSTİFADƏ ETMƏ. Cavaba birbaşa və səmimi keç.
- Əgər mətndə qeyri-müəyyənlik varsa, həmişə yönləndirici, qısa sual ver ("Şəhərin hansı hissəsində axtarırsınız?", "Dəqiq necə bir köməyə ehtiyacınız var?" və s.)

Yalnız bu strukturu çıxış et:
[TONE: rəsmi və ya dostyana və ya dəstəkləyici]
[MOOD: <istifadəçinin daxil etdiyi mətndə hiss edilən əhval (məsələn: "Səmimi / Salamlaşma", "Ümidsiz / Kədərli", "Ciddi / Məlumat yönümlü", "Narahat / Şikayətçi")>]
[TEXT: <seçdiyin personaja uyğun 2-3 cümləlik cavabın>]

Məsələn:
İstifadəçi: "çox sıxılıram heç yerə çıxa bilmirəm hər yer pilləkəndir"
Sən:
[TONE: dəstəkləyici]
[MOOD: Sıxılmış və maneələrdən yorulmuş]
[TEXT: Sizi çox yaxşı anlayıram, bəzən pilləkənlər böyük əngəl olur. Amma gəlin xəritəmizə baxaq, yaxınlığınızda rampası və liftsiz girişi olan rahat parklar tapıb sizi sevindirək.]

Context: ${context || ""}
User: ${prompt}`;

      const { response } = await generateContentWithFallback({
        contents: fullPrompt
      });

      const rawText = response.text || "";
      console.log(`[AI RAW RESP]:`, rawText);

      // Extract details
      let tone = "rəsmi";
      let mood = "Məlumat yönümlü";
      let text = rawText;

      const toneMatch = rawText.match(/\[TONE:\s*(rəsmi|dostyana|dəstəkləyici)\]/i);
      const moodMatch = rawText.match(/\[MOOD:\s*([^\]]+)\]/i);
      const textMatch = rawText.match(/\[TEXT:\s*([\s\S]+)/i);

      if (toneMatch) tone = toneMatch[1].toLowerCase().trim();
      if (moodMatch) mood = moodMatch[1].trim();
      if (textMatch) {
        text = textMatch[1].trim();
      } else {
        // Fallback clean-up if structure is slightly skewed
        text = rawText
          .replace(/\[TONE:[^\]]+\]/gi, "")
          .replace(/\[MOOD:[^\]]+\]/gi, "")
          .replace(/\[TEXT:/gi, "")
          .replace(/\]/g, "")
          .trim();
      }

      res.json({ text, tone, mood });
    } catch (error: any) {
      console.error("Gemini server-side API Error:", error);
      res.status(500).json({ error: "Google Gemini xidmətinə qoşularkən xəta baş verdi. Zəhmət olmasa bir qədər sonra yenidən yoxlayın." });
    }
  });

  // Helper to wrap raw 24kHz 16-bit PCM mono audio in a standard 44-byte WAV header for native browser playback
  function encodeWav(pcmData: Buffer, sampleRate: number = 24000): Buffer {
    const header = Buffer.alloc(44);
    // RIFF identifier
    header.write("RIFF", 0);
    // file length minus RIFF identifier and size descriptor
    header.writeUInt32LE(36 + pcmData.length, 4);
    // RIFF type
    header.write("WAVE", 8);
    // format chunk identifier
    header.write("fmt ", 12);
    // format chunk length
    header.writeUInt32LE(16, 16);
    // sample format (raw PCM = 1)
    header.writeUInt16LE(1, 20);
    // channel count (mono = 1)
    header.writeUInt16LE(1, 22);
    // sample rate
    header.writeUInt32LE(sampleRate, 24);
    // byte rate (sample rate * block align)
    header.writeUInt32LE(sampleRate * 2, 28);
    // block align (channel count * bytes per sample)
    header.writeUInt16LE(2, 32);
    // bits per sample
    header.writeUInt16LE(16, 34);
    // data chunk identifier
    header.write("data", 36);
    // data chunk length
    header.writeUInt32LE(pcmData.length, 40);

    return Buffer.concat([header, pcmData]);
  }

  app.get("/api/tts", async (req, res) => {
    let text = req.query.text as string;
    if (!text) {
      res.status(400).send("Text is required");
      return;
    }
    
    // Clean and normalize the text
    let cleanedText = text
      .replace(/[*_#\-`[\]()]/g, '') // Remove markdown and brackets
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanedText) {
      res.status(400).send("Cleaned text is empty");
      return;
    }

    // Truncate to safe length limit
    if (cleanedText.length > 250) {
      cleanedText = cleanedText.substring(0, 250);
    }

    let lastTtsError: any = null;
    const ttsAttempts = 3;
    let base64Audio = "";

    for (let attempt = 1; attempt <= ttsAttempts; attempt++) {
      try {
        console.log(`[TTS] Generating premium fluent speech via gemini-3.1-flash-tts-preview for text: "${cleanedText}" (attempt ${attempt})`);
        
        const ttsResponse = await ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: cleanedText }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Kore" }, // Core speaker voice
              },
            },
          },
        });

        const audioData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioData) {
          base64Audio = audioData;
          break;
        } else {
          throw new Error("No inline audio data block found in Gemini TTS response");
        }
      } catch (err: any) {
        console.warn(`[TTS] Attempt ${attempt} failed:`, err?.message || err);
        lastTtsError = err;
        if (attempt < ttsAttempts) {
          await new Promise(res => setTimeout(res, 250));
        }
      }
    }

    try {
      if (base64Audio) {
        const pcmBuffer = Buffer.from(base64Audio, 'base64');
        const wavBuffer = encodeWav(pcmBuffer, 24000);
        
        console.log(`[TTS] ✅ Successfully generated WAV audio (size: ${wavBuffer.length} bytes)`);
        res.setHeader("Content-Type", "audio/wav");
        res.send(wavBuffer);
        return;
      } else {
        throw lastTtsError || new Error("No base64 audio data generated");
      }
    } catch (err: any) {
      console.warn("[TTS] ⚠️ Primary Gemini TTS failed. Attempting resilient public translate proxy fallbacks...", err?.message || err);
      
      // Sanitise more stringently for fallback Google TTS endpoint
      const safeFallbackText = cleanedText
        .replace(/[^\w\s\d.,!?;:öÖüÜıİəƏçÇşŞğĞA-Za-zа-яА-ЯёЁ\-\+]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const fallbackClients = [
        `https://translate.google.com/translate_tts?ie=UTF-8&tl=az&client=gtx&q=${encodeURIComponent(safeFallbackText)}`,
        `https://translate.google.com/translate_tts?ie=UTF-8&tl=az&client=tw-ob&total=1&idx=0&textlen=${safeFallbackText.length}&q=${encodeURIComponent(safeFallbackText)}`
      ];

      for (const url of fallbackClients) {
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36',
              'Referer': 'https://translate.google.com/'
            }
          });
          if (response.ok) {
            console.log(`[TTS] ✅ Fallback TTS succeeded: ${url}`);
            res.setHeader("Content-Type", "audio/mpeg");
            const arrayBuffer = await response.arrayBuffer();
            res.send(Buffer.from(arrayBuffer));
            return;
          }
        } catch (fetchErr) {
          console.warn(`[TTS] Fallback attempt failed for URL: ${url}`, fetchErr);
        }
      }

      console.error("[TTS] ❌ All TTS methods failed.");
      res.status(500).send("Speech generation failed across all systems.");
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
