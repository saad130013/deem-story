
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { LessonData, QuizQuestion, LessonRequest } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const lessonSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A catchy, fun title for the lesson in the requested language" },
    emoji: { type: Type.STRING, description: "A single emoji representing the topic" },
    introduction: { type: Type.STRING, description: "A warm, engaging introduction suitable for a child in the requested language" },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING, description: "Subheading for this section in the requested language" },
          content: { type: Type.STRING, description: "The educational content, written in simple language" },
          visualDescription: { type: Type.STRING, description: "A detailed description for a visual illustration of this section. Style: cheerful, colorful, 3D cartoon. Do NOT describe text or labels." }
        },
        required: ["heading", "content", "visualDescription"]
      }
    },
    funFact: { type: Type.STRING, description: "A surprising or funny fact related to the topic in the requested language" },
    objectives: { type: Type.STRING, description: "A brief summary of learning objectives (3 bullet points) in the requested language" }
  },
  required: ["title", "emoji", "introduction", "sections", "funFact", "objectives"]
};

const quizSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING, description: "The question text" },
      options: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "List of 3 or 4 possible answers"
      },
      correctAnswerIndex: { type: Type.INTEGER, description: "The index of the correct answer in the options array (0-based)" },
      explanation: { type: Type.STRING, description: "A brief positive explanation of why this answer is correct" }
    },
    required: ["question", "options", "correctAnswerIndex", "explanation"]
  }
};

const generateImageForSection = async (description: string): Promise<string | undefined> => {
  const model = "gemini-2.5-flash-image";
  try {
    // Added strict negative prompt regarding text
    const prompt = `Create a cheerful, bright, 3D cartoon style illustration for children based on this description: ${description}. 
    IMPORTANT RULES: 
    1. Do NOT include any text, letters, words, numbers, or labels inside the image. 
    2. The image must be purely visual. 
    3. No speech bubbles.`;

    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  } catch (e) {
      console.error("Image gen error:", e);
  }
  return undefined;
};

export const enhanceLessonLanguage = async (lesson: LessonData, language: 'ar' | 'en'): Promise<LessonData> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    Review and improve the following educational lesson content.
    Target Audience: Children (6-11 years).
    Language: ${language === 'ar' ? 'Educational Arabic (Fusha)' : 'Simple Educational English'}.
    
    Tasks:
    1. Correct any grammar or spelling mistakes.
    2. Improve flow and clarity.
    3. Ensure tone is engaging and age-appropriate.
    4. Keep the same JSON structure.
    
    Lesson JSON:
    ${JSON.stringify(lesson)}
  `;

  try {
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: lessonSchema
        }
    });

    if (response.text) {
        const improvedData = JSON.parse(response.text) as LessonData;
        // Restore non-generated fields
        improvedData.teacherName = lesson.teacherName;
        improvedData.className = lesson.className;
        improvedData.language = lesson.language;
        improvedData.sections = improvedData.sections.map((s, i) => ({
            ...s,
            imageUrl: lesson.sections[i]?.imageUrl // Preserve images
        }));
        return improvedData;
    }
  } catch (e) {
      console.error("Enhancement error", e);
  }
  return lesson;
};

export const generateLesson = async (request: LessonRequest): Promise<LessonData> => {
  const model = "gemini-2.5-flash";
  const isArabic = request.language !== 'en';
  
  // Custom Logic based on Subject
  let specializedInstruction = "";
  
  if (request.subject === 'math') {
    specializedInstruction = `
      SUBJECT: MATHEMATICS (Arithmetic, Shapes, Logic).
      STYLE GUIDE:
      1. Use Emojis to visualize numbers (e.g., "3 Apples: 🍎🍎🍎").
      2. Explain concepts step-by-step with simple examples.
      3. For 'sections', create: 
         - Section 1: The Concept (What is it?)
         - Section 2: Visual Example (Real world usage)
         - Section 3: Let's Practice (A guided problem)
      4. Avoid complex formulas. Use friendly text-based math.
    `;
  } else if (request.subject === 'reading') {
    specializedInstruction = `
      SUBJECT: LITERACY & READING (Phonics, Vocabulary, Story).
      STYLE GUIDE:
      1. If Arabic: Use Tashkeel (Diacritics/Harakat) extensively to help with pronunciation.
      2. Focus on the target letter or word.
      3. For 'sections', create:
         - Section 1: The Sound/Letter (Pronunciation)
         - Section 2: Words list (Vocabulary with images descriptions)
         - Section 3: A short 3-sentence story using these words.
      4. Highlight key words in the content.
    `;
  } else {
    specializedInstruction = `
      SUBJECT: GENERAL KNOWLEDGE (Science, History, Story).
      STYLE: ${request.tone}.
      Break down the topic into:
      - Section 1: Definition / Intro
      - Section 2: How it works / Details
      - Section 3: Why it matters / Conclusion
    `;
  }

  const prompt = `
    You are an expert elementary school teacher who creates magical, engaging lessons for children.
    
    CRITICAL CONTENT POLICY - STRICTLY ENFORCED:
    1. This platform is strictly for GENERAL EDUCATIONAL, SCIENTIFIC, HISTORICAL, and IMAGINATIVE topics.
    2. DO NOT generate content related to RELIGIOUS TOPICS, THEOLOGY, RELIGIOUS FIGURES (Prophets, Sahaba, Saints), or RELIGIOUS RITUALS (Prayer, Fasting, Worship) of ANY religion (Islam, Christianity, etc.).
    3. IF the requested Topic is Religious:
       - You MUST REFUSE to generate the lesson content.
       - Instead, return a valid JSON structure representing an apology.
       - Title: "عذراً - موضوع غير متاح" (or "Topic Not Available" if English).
       - Introduction: "نعتذر منك، ولكن منصة ديم التعليمية مخصصة للمواضيع العلمية، الثقافية، والقصص الخيالية العامة، ولا تدعم المواضيع الدينية."
       - Sections: Create one section titled "تنبيه" (Notice) asking the user to choose a different topic like Space, Animals, Math, or Values.
       - Emoji: 🚫

    If the topic is NOT religious, proceed to create a lesson for a child aged ${request.ageGroup} years old.
    
    Topic: ${request.topic}
    Subject Category: ${request.subject}
    Language: ${isArabic ? 'Modern Standard Arabic (Fusha) suitable for primary education' : 'English suitable for primary education'}.
    
    ${specializedInstruction}

    General Instructions:
    1. Use simple, clear, and educational vocabulary.
    2. Make it visually descriptive.
    3. Ensure the content is accurate and educational.
    4. Include 3 specific learning objectives.
    
    The content MUST be in ${isArabic ? 'Arabic' : 'English'}.
  `;

  const parts: any[] = [{ text: prompt }];

  if (request.image) {
    const base64Data = request.image.split(',')[1] || request.image;
    parts.unshift({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Data
      }
    });
    parts.push({ text: "Please incorporate the content of the attached image into the lesson explanation if relevant." });
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: lessonSchema,
      systemInstruction: `You are '${request.teacherName || 'Teacher'}'. Write in clear, educational language suitable for children. STRICTLY NO RELIGIOUS CONTENT.`
    }
  });

  if (!response.text) {
    throw new Error("No response from Gemini");
  }

  const lessonData = JSON.parse(response.text) as LessonData;
  
  // Inject teacher and class info provided by user
  lessonData.teacherName = request.teacherName;
  lessonData.className = request.className;
  lessonData.language = request.language;
  lessonData.isApproved = false; // Default state

  // Generate images for sections
  try {
    const sectionsWithImages = await Promise.all(lessonData.sections.map(async (section) => {
        if (section.visualDescription) {
            const imageUrl = await generateImageForSection(section.visualDescription);
            return { ...section, imageUrl };
        }
        return section;
    }));
    return { ...lessonData, sections: sectionsWithImages };
  } catch (e) {
      console.error("Error generating section images", e);
      return lessonData; 
  }
};

export const generateQuiz = async (lessonContext: LessonData, language: 'ar' | 'en'): Promise<QuizQuestion[]> => {
  const model = "gemini-2.5-flash";
  const isArabic = language !== 'en';
  
  const prompt = `
    Based on the following lesson, create 3 fun multiple-choice questions to check understanding.
    Language: ${isArabic ? 'Modern Standard Arabic (Fusha)' : 'English'}.
    
    Lesson Title: ${lessonContext.title}
    Lesson Content Summary: ${lessonContext.introduction} ${lessonContext.sections.map(s => s.content).join(' ')}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: quizSchema,
      systemInstruction: "Create supportive, non-tricky questions suitable for children."
    }
  });

  if (!response.text) {
    throw new Error("No response from Gemini");
  }

  return JSON.parse(response.text) as QuizQuestion[];
};