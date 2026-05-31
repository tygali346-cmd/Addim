export async function askGemini(prompt: string, context: string = "") {
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
    return data.text || "Bağışlayın, cavab hazırlana bilmədi.";
  } catch (error: any) {
    console.error("Gemini service error:", error);
    return "Bağışlayın, hazırda cavab verə bilmirəm. Zəhmət olmasa bir qədər sonra yenidən cəhd edin.";
  }
}
