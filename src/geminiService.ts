import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export async function askGemini(prompt: string, context: string = "") {
  try {
    const fullPrompt = `Sən Azərbaycanda fəaliyyət göstərən "ADDIM" layihəsinin rəsmi köməkçisisən. 
ADDIM əlilliyi olan şəxslər üçün Azərbaycanda rəqəmsal əlçatımlılıq platformasıdır. 
4 modulu var: 
1. Əlçatanlıq Xəritəsi (Məkanların əlçatımlılığı haqqında məlumat).
2. Xidmət Bələdçisi (Dövlət və özəl xidmət qaydaları).
3. Sosial Könüllülük (Kömək etmək istəyənlər üçün).
4. Əmək Bazarı (İş imkanları).

Context: ${context}
User: ${prompt}

Xahiş edirəm, qısa, aydın və mehriban Azərbaycan dilində cavab ver.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: fullPrompt
    });

    return response.text || "Bağışlayın, cavab hazırlana bilmədi.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Bağışlayın, hazırda cavab verə bilmirəm. Zəhmət olmasa bir qədər sonra yenidən cəhd edin.";
  }
}
