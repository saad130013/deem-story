
export enum AppState {
  IDLE = 'IDLE',
  GENERATING_LESSON = 'GENERATING_LESSON',
  LESSON_VIEW = 'LESSON_VIEW',
  GENERATING_QUIZ = 'GENERATING_QUIZ',
  QUIZ_VIEW = 'QUIZ_VIEW',
  SAVED_LESSONS_LIST = 'SAVED_LESSONS_LIST',
}

export interface LessonData {
  title: string;
  emoji: string;
  introduction: string;
  sections: Array<{
    heading: string;
    content: string;
    visualDescription?: string;
    imageUrl?: string;
  }>;
  funFact: string;
  teacherName?: string;
  className?: string;
  isApproved?: boolean;
  objectives?: string; // Markdown bullet points
  reviewNotes?: string;
  language: 'ar' | 'en';
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface LessonRequest {
  topic: string;
  subject: 'general' | 'math' | 'reading'; // Added subject type
  ageGroup: string; // "6-8" or "9-11"
  tone: string; // "funny", "adventurous", "scientific"
  image?: string; // Base64 string
  teacherName: string;
  className: string;
  language: 'ar' | 'en';
}

export interface SavedLesson {
  id: string;
  date: number; // timestamp
  data: LessonData;
  imagePreview?: string; // Optional cover image from the request
}

// New interface for Team Quiz Mode
export interface Team {
  id: number;
  name: string;
  emoji: string;
  score: number;
}