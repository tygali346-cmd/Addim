import express from "express";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const apiKey = process.env.GEMINI_API_KEY || "";
  
  // Initialize AI client
  let ai: GoogleGenerativeAI | null = null;
  
  try {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    ai = new GoogleGenerativeAI(apiKey);
  } catch (err: any) {
    console.error("❌ Failed to initialize Google Gemini AI:", err.message);
  }

  // Diagnostics check at server startup
  console.log(`[DIAGNOSTICS] Checking GEMINI_API_KEY in environment variables...`);
  if (!apiKey) {
    console.warn(`[DIAGNOSTICS] ⚠️ GEMINI_API_KEY is NOT defined in process.env!`);
    console.warn(`[DIAGNOSTICS] Please set GEMINI_API_KEY in your .env.local file`);
  } else {
    console.log(`[DIAGNOSTICS] ✅ GEMINI_API_KEY is loaded! (Length: ${apiKey.length} characters)`);
    const masked = apiKey.length > 8 ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : "***";
    console.log(`[DIAGNOSTICS] API Key preview: ${masked}`);
    
    if (ai) {
      console.log(`[DIAGNOSTICS] Testing 'gemini-2.0-flash' model reachability...`);
      try {
        const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
        const resp = await model.generateContent("Hi, this is a diagnostic startup test. Please respond with a single short greeting in Azerbaijani.");
        console.log(`[DIAGNOSTICS] ✅ Success! 'gemini-2.0-flash' model is active and responding.`);
        console.log(`[DIAGNOSTICS] Test query response: "${resp.response.text()?.trim()}"`);
      } catch (err: any) {
        console.error(`[DIAGNOSTICS] ❌ Failed to reach 'gemini-2.0-flash' model on startup:`, err.message);
      }
    }
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

    if (!ai) {
      res.json({
        success: false,
        status: "AI Not Initialized",
        message: "Google Gemini AI client failed to initialize. Check your API key.",
        diagnostics: diagnosticInfo
      });
      return;
    }

    try {
      const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
      const testResp = await model.generateContent("Test query. Reply with 'Diagnostics OK.'");
      diagnosticInfo.modelTestResult = testResp.response.text() || "No text returned";
      res.json({
        success: true,
        status: "Healthy",
        message: "Google Gemini 2.0 Flash is working properly from server side!",
        diagnostics: diagnosticInfo
      });
    } catch (err: any) {
      diagnosticInfo.error = err?.message || String(err);
      res.status(500).json({
        success: false,
        status: "Error",
        message: "Could not execute model query on gemini-2.0-flash. See debug info.",
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

    if (!ai) {
      res.status(500).json({ error: "Google Gemini xidmətinə qoşula bilmədim. Zəhmət olmasa API açarını yoxlayın." });
      return;
    }

    try {
      const fullPrompt = `Sən Azərbaycanda fəaliyyət göstərən, əlilliyi olan şəxslər üçün nəzərdə tutulmuş "ADDIM" rəqəmsal əlçatımlılıq platformasının rəsmi köməkçisi.
Platformanın 4 modulu var: 
1. Xəritə (Məkanların əlil arabası və digər əlçatımlılıq dərəcələri haqqında məlumat).
2. Bələdçi (Dövlət və özəl qurumların əlçatımlılıq üzrə xidmət bələdçiləri).
3. Könüllülük (Dəstək axtaranlar və kömək etmək istəyən könüllülər).
4. İş imkanları (Əlilliyi olan şəxslər üçün əmək bazarı və vakansiyalar).

DANIŞIQ QAYDALARI (MÜTLƏQ KƏNARSIZ ƏMƏL ET):
- Çox qısa və sadə danış. Cavabın maksimum 2-3 cümlədən ibarət olmalıdır.
- İnsan kimi səmimi və təbii yaz. Süni, şablon, robotik və ya müştəri xidmətləri tonundakı ifadələri ("Əlbəttə!", "Xoş gördük!", "Sizə kömək etməkdən məmnunam!", "Buyur[...]
- Cavabı uzatmadan birbaşa məsələnin özünə keç.
- Əgər qeyri-müəyyənlik varsa və ya daha dəqiq məlumat lazımdırsa, mütləq yönləndirici əks-sual ver ("Hansı rayonda/şəhərdəsiniz?", "Nə növ məkandır?", "Nə növ yardım l[...]
- Siyahı və ya bəndləri yalnız həqiqətən məlumatı qruplaşdırmaq tam zəruri olduqda istifadə et, adətən düz mətndən istifadə et.

NÜMUNƏ 1 (MÜKƏMMƏL DÜZGÜN):
İstifadəçi: "Bakıda əlil arabası ilə girə biləcəyim restoran varmı?"
Sən: "Xəritə modulundan yoxlaya bilərsiniz. Hansı rayonda axtarırsınız?"

NÜMUNƏ 2 (MÜKƏMMƏL DÜZGÜN):
İstifadəçi: "Könüllü olmaq üçün hara daxil olum?"
Sən: "Könüllülük modulunun onboarding suallarını tamamlayıb qeydiyyatdan keçə bilərsiniz. Hansı sahədə kömək edə bilərsiniz?"

Context: ${context || ""}
User: ${prompt}`;

      const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
      const response = await model.generateContent(fullPrompt);
      const responseText = response.response.text() || "Bağışlayın, cavab hazırlana bilmədi.";

      res.json({ text: responseText });
    } catch (error: any) {
      console.error("Gemini server-side API Error:", error);
      
      // Provide specific error messages
      let errorMessage = "Google Gemini xidmətinə qoşularkən xəta baş verdi.";
      
      if (error.message.includes("API key")) {
        errorMessage = "API açarı yanlış və ya sürəsi bitib. Lütfən yenidən yoxlayın.";
      } else if (error.message.includes("429")) {
        errorMessage = "Çox sürətlə sual yönəldirdiniz. Bir az gözləyin.";
      } else if (error.message.includes("model")) {
        errorMessage = "Model disponibel deyil. Lütfən bir qədər sonra yenidən cəhd edin.";
      }
      
      res.status(500).json({ error: errorMessage });
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
