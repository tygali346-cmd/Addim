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
  const modelChain = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-3.5-flash"];
  let lastError: any = null;

  for (const model of modelChain) {
    try {
      console.log(`[Vercel-AI] Attempting content generation with model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      console.log(`[Vercel-AI] ✅ Success using model: ${model}`);
      return { response, activeModel: model };
    } catch (err: any) {
      console.warn(`[Vercel-AI] ⚠️ Model failed or rate-limited: ${model}. Error:`, err?.message || err);
      lastError = err;
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
    const fullPrompt = `Sən Azərbaycanda fəaliyyət göstərən, əlilliyi olan şəxslər üçün nəzərdə tutulmuş "ADDIM" rəqəmsal əlçatımlılıq platformasının rəsmi köməkçisisən. 
Platformanın 4 modulu var: 
1. Xəritə (Məkanların əlil arabası və digər əlçatımlılıq dərəcələri haqqında məlumat).
2. Bələdçi (Dövlət və özəl qurumların əlçatımlılıq üzrə xidmət bələdçiləri).
3. Könüllülük (Dəstək axtaranlar və kömək etmək istəyən könüllülər).
4. İş imkanları (Əlilliyi olan şəxslər üçün əmək bazarı və vakansiyalar).

DANIŞIQ QAYDALARI (MÜTLƏQ KƏNARSIZ ƏMƏL ET):
- Çox qısa və sadə danış. Cavabın maksimum 2-3 cümlədən ibarət olmalıdır.
- İnsan kimi səmimi və təbii yaz. Süni, şablon, robotik və ya müştəri xidmətləri tonundakı ifadələri ("Əlbəttə!", "Xoş gördük!", "Sizə kömək etməkdən məmnunam!", "Buyurun, necə kömək edə bilərəm?") QƏTİYYƏN İSTİFADƏ ETMƏ.
- Cavabı uzatmadan birbaşa məsələnin özünə keç.
- Əgər qeyri-müəyyənlik varsa və ya daha dəqiq məlumat lazımdırsa, mütləq yönləndirici əks-sual ver ("Hansı rayonda/şəhərdəsiniz?", "Nə növ məkandır?", "Nə növ yardım lazımdır?" kimi).
- Siyahı və ya bəndləri yalnız həqiqətən məlumatı qruplaşdırmaq tam zəruri olduqda istifadə et, adətən düz mətndən istifadə et.

NÜMUNƏ 1 (MÜKƏMMƏL DÜZGÜN):
İstifadəçi: "Bakıda əlil arabası ilə girə biləcəyim restoran varmı?"
Sən: "Xəritə modulundan yoxlaya bilərsiniz. Hansı rayonda axtarırsınız?"

NÜMUNƏ 2 (MÜKƏMMƏL DÜZGÜN):
İstifadəçi: "Könüllü olmaq üçün hara daxil olum?"
Sən: "Könüllülük modulunun onboarding suallarını tamamlayıb qeydiyyatdan keçə bilərsiniz. Hansı sahədə kömək edə bilərsiniz?"

Context: ${context || ""}
User: ${prompt}`;

    const { response } = await generateContentWithFallback({
      contents: fullPrompt
    });

    res.json({ text: response.text || "Bağışlayın, cavab hazırlana bilmədi." });
  } catch (error: any) {
    console.error("Gemini Vercel API Error:", error);
    res.status(500).json({ error: "Google Gemini xidmətinə qoşularkən xəta baş verdi. Zəhmət olmasa bir qədər sonra yenidən yoxlayın." });
  }
});

export default app;
