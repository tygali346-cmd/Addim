export interface GeminiResponse {
  text: string;
  tone: 'rəsmi' | 'dostyana' | 'dəstəkləyici';
  mood: string;
}

export async function askGemini(prompt: string, context: string = ""): Promise<GeminiResponse> {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt, context })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Gözlənilməyən server xətası.");
    }

    const data = await response.json();
    return {
      text: data.text || "Bağışlayın, cavab hazırlana bilmədi.",
      tone: data.tone || "rəsmi",
      mood: data.mood || "Məlumat yönümlü"
    };
  } catch (error: any) {
    console.error("Gemini service error:", error);
    return {
      text: "Bağışlayın, hazırda cavab verə bilmirəm. Zəhmət olmasa bir qədər sonra yenidən cəhd edin.",
      tone: "rəsmi",
      mood: "Məlumat yönümlü"
    };
  }
}
