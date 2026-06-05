import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
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

// Resilient model fallback chain to avoid free-tier model-specific 429 rate limit issue
async function generateContentWithFallback(params: { contents: string; config?: any }) {
  const modelChain = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-flash-latest"];
  let lastError: any = null;

  for (const model of modelChain) {
    let attempts = 2;
    for (let i = 0; i < attempts; i++) {
      try {
        console.log(`[Vercel-AI] Attempting content generation with model: ${model} (attempt ${i + 1})`);
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        console.log(`[Vercel-AI] ✅ Success using model: ${model}`);
        return { response, activeModel: model };
      } catch (err: any) {
        console.warn(`[Vercel-AI] ⚠️ Model failed or rate-limited: ${model} (attempt ${i + 1}). Error:`, err?.message || err);
        lastError = err;
        const errStr = String(err?.message || err || "").toLowerCase();
        const isRateLimitOrTemp = errStr.includes('429') || errStr.includes('503') || errStr.includes('resource_exhausted') || errStr.includes('unavailable');
        if (isRateLimitOrTemp && i < attempts - 1) {
          console.log(`[Vercel-AI] Retrying ${model} in 300ms due to temporary error...`);
          await new Promise(res => setTimeout(res, 300));
        } else {
          break; // Proceed to the next model in chain immediately
        }
      }
    }
  }
  throw lastError || new Error("Süni intellekt modellərinin hamısı xətalı cavab verdi.");
}

// Diagnostics check
app.get("/api/gemini-diagnostics", async (req, res) => {
  const diagnosticInfo = {
    apiKeyPresent: !!process.env.GEMINI_API_KEY,
    apiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
    env: process.env.NODE_ENV || "production",
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
      message: `Google Gemini is working properly via active model '${activeModel}' on Vercel!`,
      diagnostics: diagnosticInfo
    });
  } catch (err: any) {
    diagnosticInfo.error = err?.message || String(err);
    res.status(500).json({
      success: false,
      status: "Error",
      message: "Could not execute model query on any models in the fallback chain on Vercel. See debug info.",
      diagnostics: diagnosticInfo
    });
  }
});

// Main AI chat generation endpoint
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
- Çox qısa və sadə danış. Cavabın maksimum 2-3 cümlədən ibarət olmalıdır. (MƏQSƏD YALNIZ SƏSLƏNDİRMƏ VƏ RƏVANLIQDIR).
- Süni, robotik və ya cansız şablon müştəri xidməti ifadələrini ("Əlbəttə!", "Xoş gördük!", "Buyurun, mən sizə kömək etməkdən şadam!") QƏTİYYƏN İSTİFADƏ ETMƏ. Cavaba birbaşa və insani keç.
- Əgər mətndə qeyri-müəyyənlik varsa, həmişə yönləndirici sual ver ("Şəhərin hansı hissəsində axtarırsınız?", "Dəqiq necə bir köməyə ehtiyacınız var?" və s.)

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
    console.log(`[Vercel-AI RAW RESP]:`, rawText);

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
    console.error("Gemini Vercel API Error:", error);
    res.status(500).json({ error: "Google Gemini xidmətinə qoşularkən xəta baş verdi. Zəhmət olmasa bir qədər sonra yenidən yoxlayın." });
  }
});

export default app;
