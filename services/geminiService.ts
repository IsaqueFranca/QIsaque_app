import { GoogleGenAI, Type } from "@google/genai";

// A chave será injetada pelo Vite via 'define' no vite.config.ts
const getApiKey = () => {
  return process.env.API_KEY;
};

// Safely initialize the client only when needed to avoid issues if key is missing during initial load
const getAiClient = () => {
  const currentKey = getApiKey();
  if (!currentKey) {
    console.warn("Gemini API Key is missing. Verifique se a Secret 'API_KEY' foi adicionada no GitHub Settings.");
    return null;
  }
  return new GoogleGenAI({ apiKey: currentKey });
};

export const generateSubtopicsForSubject = async (subjectTitle: string, healthDegree: string = 'Medicine'): Promise<string[]> => {
  const ai = getAiClient();
  if (!ai) return ["Erro: Chave API ausente. Configure no GitHub Secrets."];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a comprehensive list of 5 to 10 key study subtopics for the subject: "${subjectTitle}" in the context of a ${healthDegree} degree. 
      Keep the titles concise (under 6 words). Focus on high-yield topics for residency exams.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtopics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        },
      },
    });

    if (response.text) {
        const json = JSON.parse(response.text);
        return json.subtopics || [];
    }
    return [];
  } catch (error) {
    console.error("Failed to generate subtopics:", error);
    return [];
  }
};

export const getStudyChatResponse = async (
  subject: string,
  degree: string,
  message: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Não foi possível conectar com a IA. Verifique sua chave API nas configurações do GitHub.";

  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `You are a specialized study tutor for a student of ${degree}. 
        The student is currently studying the subject: "${subject}". 
        
        Your goals:
        1. Answer questions specifically related to ${subject} in the context of ${degree}.
        2. Provide short, high-yield summaries when asked.
        3. Suggest correlated topics if requested.
        4. If asked for a "Quiz" or "Question", generate a multiple-choice question suitable for a Residency Exam in ${degree}.
        
        Keep answers concise, professional, and encouraging. Language: Portuguese (Brazil).`,
      },
      history: history,
    });

    const response = await chat.sendMessage({ message });
    return response.text || "Sem resposta.";
  } catch (error) {
    console.error("Chat error", error);
    return "Desculpe, ocorreu um erro ao processar sua pergunta.";
  }
};

export const generateBehavioralInsights = async (
  streakData: { currentStreak: number, longestStreak: number, totalActiveDays: number },
  recentSessions: any[],
  degree: string
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "A IA está analisando seus dados...";

  try {
    // Simplify session data for the prompt to save tokens
    const sessionSummary = recentSessions.slice(0, 20).map(s => ({
      duration: s.duration,
      hour: new Date(s.startTime).getHours()
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze this study data for a ${degree} student and provide 3 short, behavioral insights (1 sentence each) in Portuguese.
      
      Stats:
      - Current Streak: ${streakData.currentStreak} days
      - Longest Streak: ${streakData.longestStreak} days
      - Total Days Active: ${streakData.totalActiveDays}
      
      Recent Sessions Sample: ${JSON.stringify(sessionSummary)}
      
      Focus on: Consistency, Time of day patterns, and Motivation. 
      Example output: "Você rende mais à noite.", "Sua consistência está ótima, continue!", "Cuidado com os fins de semana."`,
    });

    return response.text || "Continue estudando para gerar insights!";
  } catch (error) {
    console.error("Insight generation error", error);
    return "Mantenha a constância para desbloquear mais insights!";
  }
};