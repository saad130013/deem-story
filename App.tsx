
import React, { useState, useEffect } from 'react';
import { AppState, LessonData, LessonRequest, QuizQuestion, SavedLesson } from './types';
import { configureGemini, generateLesson, generateQuiz, isGeminiConfigured } from './services/geminiService';
import { LessonForm } from './components/LessonForm';
import { LessonView } from './components/LessonView';
import { QuizView } from './components/QuizView';
import { SavedLessonsList } from './components/SavedLessonsList';
import { GraduationCap, ArrowRight, Book, AlertTriangle, Bot, BotOff, KeyRound, X } from 'lucide-react';
import { get, del } from 'idb-keyval';

const createManualLesson = (request: LessonRequest): LessonData => {
  const isArabic = request.language !== 'en';
  const sectionTitles = request.subject === 'math'
    ? (isArabic ? ['شرح المفهوم', 'مثال تطبيقي', 'تدريب للطلاب'] : ['Explain the concept', 'Worked example', 'Student practice'])
    : request.subject === 'reading'
      ? (isArabic ? ['الصوت أو الحرف', 'كلمات للتدريب', 'قصة قصيرة'] : ['Sound or letter', 'Practice words', 'Short story'])
      : (isArabic ? ['مقدمة الموضوع', 'الأفكار الأساسية', 'نشاط ختامي'] : ['Topic introduction', 'Key ideas', 'Closing activity']);

  return {
    title: request.topic,
    emoji: request.subject === 'math' ? '🔢' : request.subject === 'reading' ? '📖' : '✨',
    introduction: isArabic ? 'اكتب مقدمة الدرس هنا...' : 'Write the lesson introduction here...',
    sections: sectionTitles.map((heading) => ({
      heading,
      content: isArabic ? 'أضف محتوى هذا القسم...' : 'Add this section content...',
    })),
    funFact: isArabic ? 'أضف معلومة ممتعة أو نشاطاً إضافياً...' : 'Add a fun fact or extra activity...',
    objectives: isArabic ? '• الهدف الأول\n• الهدف الثاني\n• الهدف الثالث' : '• First objective\n• Second objective\n• Third objective',
    teacherName: request.teacherName,
    className: request.className,
    language: request.language,
    isApproved: false,
  };
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [quizData, setQuizData] = useState<QuizQuestion[] | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [autoSavedLesson, setAutoSavedLesson] = useState<LessonData | null>(null);
  const [aiEnabled, setAiEnabled] = useState(() => isGeminiConfigured());
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    // Check for an auto-saved lesson when the app starts
    get('autosave_lesson').then(savedLesson => {
      if (savedLesson) {
        setAutoSavedLesson(savedLesson);
      }
    });
  }, []);

  const handleRestoreAutoSave = () => {
    if (autoSavedLesson) {
      setLessonData(autoSavedLesson);
      setAppState(AppState.LESSON_VIEW);
      setAutoSavedLesson(null); // Clear the prompt
    }
  };

  const handleDiscardAutoSave = () => {
    del('autosave_lesson');
    setAutoSavedLesson(null);
  };

  const handleSaveAiSettings = () => {
    configureGemini(apiKeyInput);
    setAiEnabled(Boolean(apiKeyInput.trim()));
    setApiKeyInput('');
    setShowAiSettings(false);
    setError(null);
  };

  const handleDisableAi = () => {
    configureGemini('');
    setAiEnabled(false);
    setApiKeyInput('');
    setShowAiSettings(false);
    setError(null);
  };

  const handleCreateLesson = async (request: LessonRequest) => {
    if (!aiEnabled) {
      setUploadedImage(request.image);
      setLessonData(createManualLesson(request));
      setAppState(AppState.LESSON_VIEW);
      setError(null);
      return;
    }

    setAppState(AppState.GENERATING_LESSON);
    setError(null);
    setUploadedImage(request.image);
    
    try {
      const data = await generateLesson(request);
      setLessonData(data);
      setAppState(AppState.LESSON_VIEW);
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء تحضير الدرس. يرجى المحاولة مرة أخرى.");
      setAppState(AppState.IDLE);
    }
  };

  const handleStartQuiz = async () => {
    if (!lessonData) return;
    if (!aiEnabled) {
      setError('إنشاء الاختبار بالذكاء الاصطناعي يتطلب إضافة مفتاح Gemini من الإعدادات.');
      return;
    }
    setAppState(AppState.GENERATING_QUIZ);
    setError(null);
    try {
      const questions = await generateQuiz(lessonData, lessonData.language || 'ar');
      setQuizData(questions);
      setAppState(AppState.QUIZ_VIEW);
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء تحضير الأسئلة.");
      setAppState(AppState.LESSON_VIEW);
    }
  };

  const handleUpdateLesson = (newData: LessonData) => {
    setLessonData(newData);
  };

  const handleOpenSavedLessons = () => {
    setAppState(AppState.SAVED_LESSONS_LIST);
    setError(null);
  };

  const handleSelectSavedLesson = (lesson: SavedLesson) => {
    setLessonData(lesson.data);
    setUploadedImage(lesson.imagePreview);
    setAppState(AppState.LESSON_VIEW);
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setLessonData(null);
    setQuizData(null);
    setUploadedImage(undefined);
    setError(null);
    del('autosave_lesson'); // Clear auto-save on reset
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="blob bg-kid-blue w-96 h-96 rounded-full -top-20 -left-20 opacity-20"></div>
      <div className="blob bg-kid-pink w-80 h-80 rounded-full top-40 -right-20 opacity-20 animation-delay-2000"></div>
      <div className="blob bg-kid-yellow w-64 h-64 rounded-full bottom-0 left-1/4 opacity-20 animation-delay-4000"></div>

      <nav className="bg-white shadow-sm sticky top-0 z-50 px-4 py-3 border-b-2 border-gray-100 no-print">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={resetApp}>
            <div className="bg-kid-purple p-2 rounded-lg text-white"><GraduationCap size={28} /></div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">{lessonData?.teacherName ? (<span className="text-kid-purple">{lessonData.teacherName}</span>) : (<>منصة <span className="text-kid-pink">ديم</span> التعليمية</>)}</h1>
          </div>
          <div className="flex gap-2 md:gap-4">
             <button
               type="button"
               onClick={() => setShowAiSettings(true)}
               className={`font-bold flex items-center gap-1 text-sm md:text-base px-3 py-2 rounded-lg transition-colors ${aiEnabled ? 'text-green-700 bg-green-50 hover:bg-green-100' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
               title="إعدادات الذكاء الاصطناعي"
             >
               {aiEnabled ? <Bot size={18} /> : <BotOff size={18} />}
               <span className="hidden md:inline">{aiEnabled ? 'AI مفعّل' : 'الوضع اليدوي'}</span>
             </button>
             {appState === AppState.IDLE && (<button onClick={handleOpenSavedLessons} className="text-gray-600 font-bold hover:text-kid-purple flex items-center gap-1 text-sm md:text-base px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors"><Book size={18} /><span>مكتبة دروسي</span></button>)}
             {appState !== AppState.IDLE && (<button onClick={resetApp} className="text-gray-500 font-bold hover:text-kid-blue flex items-center gap-1 text-sm md:text-base"><ArrowRight size={18} /><span>العودة للرئيسية</span></button>)}
          </div>
        </div>
      </nav>

      {showAiSettings && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 no-print">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 relative">
            <button type="button" onClick={() => setShowAiSettings(false)} className="absolute top-4 left-4 text-gray-400 hover:text-gray-700" aria-label="إغلاق">
              <X size={24} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-kid-purple text-white p-3 rounded-2xl"><KeyRound size={24} /></div>
              <div>
                <h2 className="text-2xl font-black text-gray-800">إعدادات الذكاء الاصطناعي</h2>
                <p className="text-sm text-gray-500">اختياري — يعمل التطبيق بدونه في الوضع اليدوي.</p>
              </div>
            </div>
            <label className="block font-bold text-gray-700 mb-2">مفتاح Gemini API</label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(event) => setApiKeyInput(event.target.value)}
              placeholder="AIza..."
              autoComplete="off"
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-kid-purple outline-none"
              dir="ltr"
            />
            <p className="mt-3 text-xs leading-5 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
              يُحفظ المفتاح في جلسة هذا التبويب فقط ويُحذف عند إغلاقه. إدخال المفتاح في تطبيق متصفح أقل أماناً من استخدام خادم وسيط.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={handleSaveAiSettings} disabled={!apiKeyInput.trim()} className="flex-1 py-3 rounded-xl bg-kid-purple text-white font-bold disabled:opacity-40">
                حفظ وتفعيل AI
              </button>
              {aiEnabled && (
                <button type="button" onClick={handleDisableAi} className="flex-1 py-3 rounded-xl border-2 border-red-200 text-red-600 font-bold hover:bg-red-50">
                  تعطيل AI وحذف المفتاح
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        {error && (<div className="max-w-2xl mx-auto mb-6 bg-red-100 border-2 border-red-200 text-red-700 p-4 rounded-xl text-center font-bold no-print">{error}</div>)}
        
        {autoSavedLesson && appState === AppState.IDLE && (
          <div className="max-w-2xl mx-auto mb-6 bg-yellow-50 border-2 border-yellow-200 text-yellow-800 p-4 rounded-xl text-center no-print">
              <div className="flex items-center justify-center gap-3">
                <AlertTriangle className="w-8 h-8 text-yellow-600"/>
                <div className="text-left">
                  <h3 className="font-bold">استعادة جلسة سابقة!</h3>
                  <p className="text-sm">وجدنا درساً غير مكتمل. هل تريد استعادته؟</p>
                </div>
              </div>
              <div className="mt-4 flex gap-4 justify-center">
                  <button onClick={handleRestoreAutoSave} className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-bold">نعم، استعادة</button>
                  <button onClick={handleDiscardAutoSave} className="px-4 py-2 bg-white border border-yellow-300 text-yellow-800 rounded-lg">لا، تجاهل</button>
              </div>
          </div>
        )}

        {appState === AppState.IDLE && (
          <div className="animate-fade-in-up">
            <header className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black text-gray-800 mb-4 leading-tight">حوّل أفكارك إلى <br/><span className="text-kid-blue">قصص</span> و <span className="text-kid-pink">ألعاب</span> تعليمية</h2>
              <p className="text-xl text-gray-500 max-w-2xl mx-auto">مساعد المعلم الذكي: صمم دروساً تفاعلية تناسب أعمار الأطفال في ثوانٍ معدودة.</p>
            </header>
            <LessonForm onSubmit={handleCreateLesson} isLoading={false} aiEnabled={aiEnabled} />
          </div>
        )}

        {appState === AppState.SAVED_LESSONS_LIST && (<SavedLessonsList onSelectLesson={handleSelectSavedLesson} onBack={resetApp} />)}

        {appState === AppState.GENERATING_LESSON && (
           <div className="flex flex-col items-center justify-center py-20 animate-pulse">
              <div className="w-32 h-32 relative"><div className="absolute inset-0 border-8 border-gray-200 rounded-full"></div><div className="absolute inset-0 border-8 border-kid-blue rounded-full border-t-transparent animate-spin"></div><div className="absolute inset-0 flex items-center justify-center"><span className="text-4xl">🚀</span></div></div>
              <h3 className="mt-8 text-2xl font-bold text-gray-700">جاري كتابة الدرس...</h3>
              <p className="text-gray-500 mt-2">نجهز المعلومات والصور الممتعة!</p>
           </div>
        )}

        {appState === AppState.LESSON_VIEW && lessonData && (
          <LessonView data={lessonData} image={uploadedImage} onStartQuiz={handleStartQuiz} isGeneratingQuiz={false} onUpdateLesson={handleUpdateLesson} />
        )}

        {appState === AppState.GENERATING_QUIZ && lessonData && (
          <LessonView data={lessonData} image={uploadedImage} onStartQuiz={() => {}} isGeneratingQuiz={true} onUpdateLesson={handleUpdateLesson} />
        )}

        {appState === AppState.QUIZ_VIEW && quizData && (
          <QuizView questions={quizData} lessonTitle={lessonData?.title || 'درس ممتع'} onReset={resetApp} />
        )}
      </main>

      <footer className="text-center py-8 text-gray-400 text-sm no-print">© {new Date().getFullYear()} منصة ديم التعليمية - تم التطوير بحب للتعليم</footer>
    </div>
  );
};

export default App;