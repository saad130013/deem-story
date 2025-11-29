
import React, { useState, useEffect } from 'react';
import { QuizQuestion, Team } from '../types';
import { CheckCircle, XCircle, RefreshCw, Trophy, User, Play, Printer, Star, Download, MessageCircle, Mail, Users, PlusCircle, MinusCircle, Crown } from 'lucide-react';
// @ts-ignore
import confetti from 'canvas-confetti';

interface QuizViewProps {
  questions: QuizQuestion[];
  lessonTitle: string;
  onReset: () => void;
}

const TEAM_EMOJIS = ['🦋', '⭐️', '🍎', '🚀', '🌈', '💡', '👑', '☀️'];

export const QuizView: React.FC<QuizViewProps> = ({ questions, lessonTitle, onReset }) => {
  const [quizMode, setQuizMode] = useState<'idle' | 'individual' | 'team'>('idle');
  
  // Individual State
  const [studentName, setStudentName] = useState('');

  // Team State
  const [teams, setTeams] = useState<Team[]>([
    { id: 1, name: 'فريق الفراشات', emoji: '🦋', score: 0 },
    { id: 2, name: 'فريق النجوم', emoji: '⭐️', score: 0 }
  ]);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);

  // General Quiz State
  const [hasStarted, setHasStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const handleStartIndividual = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentName.trim()) {
      setHasStarted(true);
    }
  };

  const handleStartTeam = () => {
    if (teams.every(t => t.name.trim())) {
      setHasStarted(true);
    }
  };

  const handleOptionClick = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    if (index === currentQuestion.correctAnswerIndex) {
        if (quizMode === 'team') {
            const updatedTeams = [...teams];
            updatedTeams[currentTeamIndex].score += 1;
            setTeams(updatedTeams);
            confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
        } else {
            setScore(s => s + 1);
        }
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      if (quizMode === 'team') {
          setCurrentTeamIndex(prev => (prev + 1) % teams.length);
      }
    } else {
      setShowResult(true);
    }
  };

  const updateTeamName = (id: number, name: string) => {
    setTeams(teams.map(t => t.id === id ? { ...t, name } : t));
  };
  
  const addTeam = () => {
    const nextEmoji = TEAM_EMOJIS[teams.length % TEAM_EMOJIS.length];
    setTeams([...teams, { id: Date.now(), name: `الفريق ${teams.length + 1}`, emoji: nextEmoji, score: 0 }]);
  };
  
  const removeTeam = (id: number) => {
    setTeams(teams.filter(t => t.id !== id));
  };


  const handlePrintCertificate = () => { window.print(); };

  const handleDownloadCertificate = async () => {
    setIsDownloading(true);
    const element = document.getElementById('certificate-area');
    const opt = { margin: 0, filename: `شهادة_${studentName.replace(/\s+/g, '_')}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, scrollY: 0 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } };
    try {
      // @ts-ignore
      if (window.html2pdf) { await window.html2pdf().set(opt).from(element).save(); } 
      else { alert("عذراً، خاصية التحميل غير مدعومة في هذا المتصفح."); }
    } catch (e) { console.error("PDF Download Error", e); alert("حدث خطأ أثناء تحميل الشهادة"); } 
    finally { setIsDownloading(false); }
  };

  const handleShareWhatsApp = () => {
    const text = `السلام عليكم،\nأشارككم إنجاز البطل/ة: ${studentName}\nفي درس: ${lessonTitle}\nحيث حصل/ت على شهادة شكر وتقدير بنتيجة: ${score} من ${questions.length} 🌟\n\n- منصة ديم التعليمية`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareMail = () => {
     const subject = `نتيجة الطالب: ${studentName} - درس ${lessonTitle}`;
     const body = `السلام عليكم،\n\nأشارككم إنجاز البطل/ة: ${studentName}\nفي درس: ${lessonTitle}\nالنتيجة: ${score} من ${questions.length}\n\nيرجى الاطلاع على النتيجة.\n\nشكراً لكم.`;
     window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  
  // Mode Selection Screen
  if (quizMode === 'idle') {
    return (
        <div className="max-w-2xl mx-auto p-4 animate-fade-in text-center">
            <h2 className="text-3xl font-black text-gray-800 mb-8">اختر وضع المسابقة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <button onClick={() => setQuizMode('individual')} className="p-8 bg-white rounded-3xl shadow-lg border-4 border-transparent hover:border-kid-blue transition-all">
                    <User className="w-16 h-16 mx-auto text-kid-blue mb-4"/>
                    <h3 className="text-2xl font-bold">مسابقة فردية</h3>
                    <p className="text-gray-500">للطالب الواحد، وتنتهي بشهادة.</p>
                </button>
                <button onClick={() => setQuizMode('team')} className="p-8 bg-white rounded-3xl shadow-lg border-4 border-transparent hover:border-kid-pink transition-all">
                    <Users className="w-16 h-16 mx-auto text-kid-pink mb-4"/>
                    <h3 className="text-2xl font-bold">مسابقة فرق</h3>
                    <p className="text-gray-500">للفصل الدراسي، مع لوحة نتائج.</p>
                </button>
            </div>
        </div>
    );
  }

  // Pre-Start Screens
  if (!hasStarted) {
    if (quizMode === 'individual') {
        return (
          <div className="max-w-lg mx-auto p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-kid-purple text-center p-8">
               <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6"><User className="w-10 h-10 text-kid-purple" /></div>
               <h2 className="text-3xl font-black text-gray-800 mb-2">أهلاً بك يا بطل!</h2>
               <p className="text-gray-500 mb-8 text-lg">أدخل اسمك لنبدأ المسابقة</p>
               <form onSubmit={handleStartIndividual} className="space-y-6">
                 <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="اكتب اسمك هنا..." className="w-full p-4 border-2 border-gray-200 rounded-xl text-center text-xl font-bold focus:border-kid-purple outline-none" required />
                 <button type="submit" disabled={!studentName.trim()} className="w-full py-4 bg-kid-purple text-white rounded-xl font-bold text-xl hover:bg-purple-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:scale-100">
                   <span>بدء الاختبار</span><Play className="w-6 h-6" />
                 </button>
               </form>
            </div>
          </div>
        );
    }
    if (quizMode === 'team') {
        return (
            <div className="max-w-2xl mx-auto p-4 animate-fade-in">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-kid-pink p-8">
                    <h2 className="text-3xl font-black text-center mb-6">إعداد الفرق</h2>
                    <div className="space-y-4 mb-6">
                        {teams.map((team, index) => (
                            <div key={team.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                                <span className="text-3xl">{team.emoji}</span>
                                <input type="text" value={team.name} onChange={(e) => updateTeamName(team.id, e.target.value)} className="flex-1 p-2 border-2 border-gray-200 rounded-lg text-lg font-bold outline-none focus:border-kid-pink"/>
                                {teams.length > 2 && <button onClick={() => removeTeam(team.id)} className="text-red-500 hover:bg-red-100 p-2 rounded-full"><MinusCircle size={20}/></button>}
                            </div>
                        ))}
                    </div>
                    {teams.length < 4 && <button onClick={addTeam} className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 mb-6"><PlusCircle size={20}/> إضافة فريق</button>}
                    <button onClick={handleStartTeam} disabled={teams.some(t => !t.name.trim())} className="w-full py-4 bg-kid-pink text-white rounded-xl font-bold text-xl hover:bg-pink-600 transition-all flex items-center justify-center gap-2 disabled:bg-gray-300">
                        بدء المسابقة التنافسية <Play className="w-6 h-6"/>
                    </button>
                </div>
            </div>
        );
    }
  }

  // Result Screen
  if (showResult) {
    if (quizMode === 'individual') {
        return (
          <div className="max-w-[1100px] mx-auto text-center space-y-8 animate-fade-in p-4">
            <div id="certificate-area" className="certificate-container bg-white rounded-xl shadow-2xl relative print:shadow-none print:w-full print:h-full print:fixed print:top-0 print:left-0 print:m-0 print:rounded-none overflow-hidden mx-auto" style={{ aspectRatio: '297/210' }}>
              <div className="h-full w-full border-[16px] border-double border-kid-yellow p-6 md:p-10 flex flex-col justify-between items-center relative pattern-paper">
                <div className="absolute top-0 left-0 w-32 h-32 border-t-[16px] border-l-[16px] border-kid-purple rounded-tl-[3rem]"></div><div className="absolute top-0 right-0 w-32 h-32 border-t-[16px] border-r-[16px] border-kid-purple rounded-tr-[3rem]"></div><div className="absolute bottom-0 left-0 w-32 h-32 border-b-[16px] border-l-[16px] border-kid-purple rounded-bl-[3rem]"></div><div className="absolute bottom-0 right-0 w-32 h-32 border-b-[16px] border-r-[16px] border-kid-purple rounded-br-[3rem]"></div>
                <div className="mt-4"><Trophy className="w-20 h-20 text-yellow-500 mx-auto drop-shadow-md mb-2" /><h1 className="text-5xl md:text-6xl font-black text-kid-purple font-sans mb-4">شهادة شكر وتقدير</h1></div>
                <div className="flex-1 flex flex-col justify-center items-center w-full"><p className="text-2xl text-gray-600 font-medium">تتقدم منصة ديم التعليمية بمنح الطالب/ة المتميز/ة</p><div className="text-5xl md:text-7xl font-black text-kid-blue my-6 border-b-4 border-kid-blue/20 pb-2 px-16 inline-block">{studentName}</div><p className="text-xl text-gray-600 mb-2">وذلك لإتمامه/ا قراءة قصة ودرس: <span className="text-kid-pink font-bold text-2xl mx-2">"{lessonTitle}"</span> بنجاح وتفوق</p><p className="text-lg text-gray-500 mt-2">والإجابة على الأسئلة بنتيجة رائعة ({score} من {questions.length})</p><div className="flex justify-center gap-2 mt-4">{[...Array(5)].map((_, i) => <Star key={i} className="w-8 h-8 text-yellow-400 fill-current drop-shadow-sm" />)}</div></div>
                <div className="flex justify-between items-end w-full px-12 pb-4"><div className="text-center"><p className="text-gray-400 text-sm mb-1">التاريخ</p><p className="font-bold text-gray-700 text-xl">{new Date().toLocaleDateString('ar-EG')}</p></div><div className="text-center absolute bottom-10 left-1/2 transform -translate-x-1/2"><p className="text-yellow-700 font-bold text-lg italic">"أنت بطل حقيقي! نتمنى لك مستقبلاً مشرقاً."</p></div><div className="text-center"><div className="mb-1 mx-auto w-24 relative"><div className="w-20 h-20 rounded-full border-4 border-kid-purple/30 flex items-center justify-center text-kid-purple font-black text-xs rotate-[-12deg] mx-auto absolute -top-12 left-2 bg-white/50 backdrop-blur-sm">ديم التعليمية</div></div><p className="font-bold text-kid-purple text-xl mt-8">منصة ديم التعليمية</p></div></div>
              </div>
            </div>
            <div className="flex flex-col gap-6 no-print max-w-4xl mx-auto"><div className="flex flex-wrap justify-center gap-4"><button onClick={handleDownloadCertificate} disabled={isDownloading} className="px-6 py-3 bg-kid-pink text-white rounded-xl font-bold text-xl hover:bg-pink-600 hover:scale-105 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">{isDownloading ? (<div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>) : (<Download className="w-6 h-6" />)}<span>تحميل الشهادة (PDF)</span></button><button onClick={handlePrintCertificate} className="px-6 py-3 bg-kid-blue text-white rounded-xl font-bold text-xl hover:bg-blue-600 hover:scale-105 transition-all flex items-center gap-2 shadow-lg"><Printer className="w-6 h-6" /><span>طباعة</span></button></div><div className="flex flex-wrap justify-center gap-4 border-t pt-6 border-gray-100"><p className="w-full text-gray-400 text-sm">إرسال النتيجة للمعلم:</p><button onClick={handleShareWhatsApp} className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600 hover:scale-105 transition-all flex items-center gap-2 shadow-sm"><MessageCircle className="w-6 h-6" /><span>إرسال واتساب</span></button><button onClick={handleShareMail} className="px-6 py-3 bg-gray-500 text-white rounded-xl font-bold text-lg hover:bg-gray-600 hover:scale-105 transition-all flex items-center gap-2 shadow-sm"><Mail className="w-6 h-6" /><span>إرسال إيميل</span></button></div><div className="flex justify-center pt-4"><button onClick={onReset} className="px-6 py-3 bg-white text-gray-600 border-2 border-gray-200 rounded-xl font-bold text-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 shadow-sm"><RefreshCw className="w-6 h-6" /><span>درس جديد</span></button></div></div>
          </div>
        );
    }
    if (quizMode === 'team') {
        const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
        const winner = sortedTeams[0];
        return (
            <div className="max-w-2xl mx-auto p-4 animate-fade-in text-center">
                <div className="bg-white rounded-3xl shadow-xl border-4 border-kid-yellow p-8">
                    <h2 className="text-4xl font-black mb-6">النتائج النهائية!</h2>
                    <div className="space-y-4 mb-8">
                        {sortedTeams.map((team, index) => (
                            <div key={team.id} className={`p-4 rounded-xl flex justify-between items-center transition-all ${index === 0 ? 'bg-yellow-100 border-2 border-yellow-300 scale-105' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{team.emoji}</span>
                                    <span className="text-2xl font-bold">{team.name}</span>
                                    {index === 0 && <Crown className="w-8 h-8 text-yellow-500"/>}
                                </div>
                                <span className="text-3xl font-black text-kid-purple">{team.score}</span>
                            </div>
                        ))}
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl">
                        <h3 className="text-2xl font-bold text-green-700">تهانينا للفريق الفائز: {winner.name}!</h3>
                    </div>
                    <button onClick={onReset} className="mt-8 px-8 py-3 bg-kid-purple text-white rounded-xl font-bold text-xl hover:bg-purple-700 transition-all flex items-center justify-center gap-2 mx-auto"><RefreshCw className="w-6 h-6" /><span>مسابقة جديدة</span></button>
                </div>
            </div>
        )
    }
  }

  // Main Quiz Screen
  return (
    <div className="max-w-5xl mx-auto p-4 flex flex-col md:flex-row gap-8">
      {/* Quiz Area */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <div className="text-gray-500 font-bold">السؤال {currentQuestionIndex + 1} من {questions.length}</div>
        </div>
        <div className="mb-8 h-4 bg-gray-200 rounded-full overflow-hidden relative">
          <div className="h-full bg-kid-green transition-all duration-500 ease-out" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
        </div>
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden border-2 border-gray-100 min-h-[400px] flex flex-col">
          <div className="p-8 bg-blue-50 border-b border-blue-100"><h2 className="text-2xl md:text-3xl font-bold text-blue-900 leading-normal text-center">{currentQuestion.question}</h2></div>
          <div className="p-6 md:p-8 flex-1 flex flex-col justify-center space-y-4">
            {currentQuestion.options.map((option, idx) => {
              let buttonStyle = "border-gray-200 hover:border-kid-blue hover:bg-blue-50"; let icon = null;
              if (isAnswered) {
                if (idx === currentQuestion.correctAnswerIndex) { buttonStyle = "border-kid-green bg-green-50 text-green-700 ring-2 ring-green-200"; icon = <CheckCircle className="w-6 h-6 text-kid-green" />; } 
                else if (idx === selectedOption) { buttonStyle = "border-kid-pink bg-pink-50 text-pink-700"; icon = <XCircle className="w-6 h-6 text-kid-pink" />; } 
                else { buttonStyle = "border-gray-100 text-gray-400 opacity-50"; }
              }
              return (<button key={idx} onClick={() => handleOptionClick(idx)} disabled={isAnswered} className={`w-full p-4 rounded-xl border-2 text-lg font-bold text-right transition-all duration-200 flex items-center justify-between group ${buttonStyle}`}><span className="flex-1">{option}</span>{icon}</button>);
            })}
          </div>
          {isAnswered && (
            <div className="p-6 bg-gray-50 border-t border-gray-100 animate-fade-in"><div className="mb-4"><p className="text-gray-700 font-medium"><span className="font-bold ml-2">السبب:</span>{currentQuestion.explanation}</p></div><button onClick={handleNext} className="w-full py-3 bg-kid-purple text-white rounded-xl font-bold text-xl hover:bg-purple-700 transition-colors shadow-md">{currentQuestionIndex < questions.length - 1 ? "السؤال التالي" : "النتائج"}</button></div>
          )}
        </div>
      </div>
      {/* Scoreboard Area (for Team Mode) */}
      {quizMode === 'team' && (
        <div className="w-full md:w-80">
          <div className="bg-white rounded-3xl shadow-lg p-6 sticky top-28">
            <h3 className="text-2xl font-black text-center mb-4">لوحة النتائج</h3>
            <div className="space-y-3">
              {teams.map((team, index) => (
                <div key={team.id} className={`p-3 rounded-xl transition-all duration-300 ${index === currentTeamIndex ? 'bg-blue-100 ring-2 ring-kid-blue' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold flex items-center gap-2">{team.emoji} {team.name}</span>
                    <span className="text-3xl font-black text-kid-purple">{team.score}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center bg-yellow-100 p-3 rounded-xl">
                <p className="text-yellow-800 font-bold">الدور على: {teams[currentTeamIndex]?.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};