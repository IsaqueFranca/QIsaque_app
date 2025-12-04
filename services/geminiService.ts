import { GoogleGenAI, Type } from "@google/genai";

// A chave será obtida via process.env.API_KEY, que é injetada pelo vite.config.ts durante o build
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("Gemini API Key is missing. Verifique se a Secret 'API_KEY' ou 'VITE_API_KEY' foi configurada no .env ou nas variáveis de ambiente.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to clean Markdown code blocks from JSON response
const cleanJsonText = (text: string): string => {
  if (!text) return "";
  return text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
};

export const generateSubtopicsForSubject = async (subjectTitle: string, healthDegree: string = 'Medicine'): Promise<string[]> => {
  const ai = getAiClient();
  if (!ai) return ["Erro: Chave API ausente."];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Atue como um tutor especialista em concursos e residências da área da saúde no Brasil.
      
      Tarefa: Gere uma lista abrangente de 5 a 10 subtópicos de estudo essenciais para a matéria: "${subjectTitle}".
      Contexto: Graduação em ${healthDegree} (Área da Saúde).
      Objetivo: Preparação para provas de Residência ou Concursos no Brasil.

      Diretrizes:
      1. O idioma DEVE ser estritamente Português do Brasil (PT-BR).
      2. Mantenha os títulos concisos e diretos.
      3. Foque nos tópicos de maior incidência (high-yield) nas provas brasileiras.
      4. Evite introduções, retorne apenas os dados estruturados.`,
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
        const cleanedText = cleanJsonText(response.text);
        const json = JSON.parse(cleanedText);
        return json.subtopics || [];
    }
    return [];
  } catch (error) {
    console.error("Failed to generate subtopics:", error);
    return [];
  }
};

export const organizeSubjectsFromText = async (text: string): Promise<string[]> => {
  const ai = getAiClient();
  if (!ai) return [];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Você é um assistente organizacional especializado em editais de concursos e residências médicas no Brasil.
      
      Sua tarefa: Analisar o texto fornecido (que pode ser um edital copiado, um sumário ou anotações) e extrair uma lista limpa de matérias/disciplinas.

      Diretrizes Obrigatórias:
      1. Idioma de Saída: Português do Brasil (PT-BR). Se houver termos em inglês, traduza-os para o equivalente técnico usado no Brasil.
      2. Formatação: Use "Title Case" para nomes próprios ou convenções brasileiras (ex: "Saúde Pública", "Clínica Médica").
      3. Limpeza: Remova numeração (1.1, 2.0), pontuação excessiva e duplicatas.
      4. Contexto: Ignore textos irrelevantes (datas, locais de prova, nomes de fiscais). Foque apenas no CONTEÚDO PROGRAMÁTICO.
      
      Texto do usuário: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subjects: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        },
      },
    });

    if (response.text) {
      const cleanedText = cleanJsonText(response.text);
      const json = JSON.parse(cleanedText);
      return json.subjects || [];
    }
    return [];
  } catch (error) {
    console.error("Failed to organize subjects:", error);
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
  if (!ai) return "Não foi possível conectar com a IA. Verifique sua chave API.";

  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `Você é um tutor de estudos especializado para um estudante de ${degree} no Brasil. 
        O estudante está estudando a matéria: "${subject}". 
        
        Seus objetivos:
        1. Responder dúvidas especificamente sobre ${subject} no contexto de ${degree}.
        2. Fornecer resumos curtos e de alto rendimento quando solicitado.
        3. Sugerir tópicos correlatos se solicitado.
        4. Se pedirem um "Quiz" ou "Questão", gere uma questão de múltipla escolha adequada para provas de Residência no Brasil.
        
        Mantenha as respostas concisas, profissionais e encorajadoras. Idioma: Português (Brasil).`,
      },
      history: history,
    });

    const response = await chat.sendMessage({ message });
    return response.text || "Sem resposta.";
  } catch (error) {
    console.error("Chat error", error);
    return "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente mais tarde.";
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
      contents: `Analise estes dados de estudo de um estudante de ${degree} e forneça 3 insights comportamentais curtos (1 frase cada) em Português do Brasil.
      
      Estatísticas:
      - Sequência Atual: ${streakData.currentStreak} dias
      - Maior Sequência: ${streakData.longestStreak} dias
      - Dias Totais Ativos: ${streakData.totalActiveDays}
      
      Amostra de Sessões Recentes: ${JSON.stringify(sessionSummary)}
      
      Foque em: Consistência, Padrões de horário e Motivação. 
      Exemplo de saída: "Você rende mais à noite.", "Sua consistência está ótima, continue!", "Cuidado com os fins de semana."`,
    });

    return response.text || "Continue estudando para gerar insights!";
  } catch (error) {
    console.error("Insight generation error", error);
    return "Mantenha a constância para desbloquear mais insights!";
  }
};