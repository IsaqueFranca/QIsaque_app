import { GoogleGenAI, Type } from "@google/genai";

// A chave será obtida via process.env.API_KEY conforme diretrizes
const getApiKey = () => {
  return process.env.API_KEY;
};

// Safely initialize the client only when needed to avoid issues if key is missing during initial load
const getAiClient = () => {
  const currentKey = getApiKey();
  if (!currentKey) {
    console.warn("Gemini API Key is missing. Verifique se a Secret 'API_KEY' foi adicionada no GitHub Settings e mapeada corretamente.");
    return null;
  }
  return new GoogleGenAI({ apiKey: currentKey });
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
      1. O idioma DEVE ser Português do Brasil (PT-BR).
      2. Mantenha os títulos concisos (máximo 6 palavras).
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
        const json = JSON.parse(response.text);
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
      contents: `Analise o texto fornecido pelo usuário, que contém uma lista desorganizada de assuntos/matérias de estudo (ex: edital de residência ou ementa de curso).
      
      Sua tarefa:
      1. Identificar e extrair os nomes das matérias principais.
      2. Organizar os nomes de forma padronizada, com primeira letra maiúscula (Title Case).
      3. Remover duplicatas óbvias.
      4. Traduzir para Português do Brasil se estiver em outra língua.
      5. Retornar apenas a lista limpa.
      
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
      const json = JSON.parse(response.text);
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