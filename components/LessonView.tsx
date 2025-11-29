import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LessonData, SavedLesson } from '../types';
import { PlayCircle, Lightbulb, Printer, Presentation, FileText, Edit3, Save, X, Bookmark, Pen, Check, Play, ChevronLeft, ChevronRight, Eraser, Palette, Trash2, XCircle, LayoutGrid } from 'lucide-react';
// @ts-ignore
import PptxGenJS from 'pptxgenjs';
// @ts-ignore
import { get, set } from 'idb-keyval';
import { getStroke } from 'perfect-freehand';


// --- Helper function for perfect-freehand ---
const getSvgPathFromStroke = (stroke: number[][]) => {
  if (!stroke.length) return ''
  const d = stroke.reduce((acc, [x0, y0], i, arr) => {
    const [x1, y1] = arr[(i + 1) % arr.length]
    acc.push(`L${x0},${y0}`, `Q${(x0 + x1) / 2},${(y0 + y1) / 2}`, `${x1},${y1}`)
    return acc
  }, ['M', ...stroke[0], 'Q'])
  d.push('Z')
  return d.join(' ')
}

const drawLine = (ctx: CanvasRenderingContext2D, line: { points: {x: number, y: number, pressure: number}[], color: string, tool: 'pen' | 'eraser' }) => {
    const stroke = getStroke(line.points, {
        size: line.tool === 'eraser' ? 32 : 12,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
    });
    const pathData = getSvgPathFromStroke(stroke);
    ctx.fillStyle = line.color;
    ctx.globalCompositeOperation = line.tool === 'eraser' ? 'destination-out' : 'source-over';
    const path = new Path2D(pathData);
    ctx.fill(path);
};

// --- Presentation Mode Component ---
const PresentationMode = ({ lessonData, onExit }: { lessonData: LessonData, onExit: () => void }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [drawingTool, setDrawingTool] = useState<'pen' | 'eraser'>('pen');
  const [drawingColor, setDrawingColor] = useState('#F72585');
  const [lines, setLines] = useState<any[]>([]);
  const [showSlideSorter, setShowSlideSorter] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<any>(null);

  const slides = [
    { type: 'title', data: lessonData },
    { type: 'intro', data: { text: lessonData.introduction, lang: lessonData.language } },
    ...lessonData.sections.map((s, i) => ({ type: 'section', data: { ...s, index: i, lang: lessonData.language } })),
    ...(lessonData.funFact ? [{ type: 'funFact', data: { text: lessonData.funFact, lang: lessonData.language } }] : []),
    ...(lessonData.objectives ? [{ type: 'objectives', data: { text: lessonData.objectives, lang: lessonData.language } }] : []),
  ];
  const totalSlides = slides.length;

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.forEach(line => drawLine(ctx, line));
  }, [lines]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = canvasContainerRef.current;
    if (canvas && container) {
        const { width, height } = container.getBoundingClientRect();
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            redrawCanvas();
        }
    }
  }, [redrawCanvas]);
  
  useEffect(() => {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  const clearAnnotations = () => {
    setLines([]);
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
  
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    currentLineRef.current = {
      points: [{ x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: 0.5 }],
      color: drawingTool === 'eraser' ? '#000000' : drawingColor, tool: drawingTool
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.buttons !== 1 || !currentLineRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    currentLineRef.current.points.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: 0.5 });
    if (canvasRef.current?.getContext('2d')) drawLine(canvasRef.current.getContext('2d')!, currentLineRef.current);
  };

  const handlePointerUp = () => {
    if (currentLineRef.current) setLines(prevLines => [...prevLines, currentLineRef.current]);
    currentLineRef.current = null;
  };
  
  const handleNav = (direction: 'next' | 'prev' | number) => {
    clearAnnotations();
    if (typeof direction === 'number') {
        setCurrentSlide(direction);
    } else {
        if (direction === 'next' && currentSlide < totalSlides - 1) setCurrentSlide(s => s + 1);
        if (direction === 'prev' && currentSlide > 0) setCurrentSlide(s => s - 1);
    }
  };
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
      if(e.key === 'ArrowRight' || e.key === ' ') handleNav('next');
      if(e.key === 'ArrowLeft') handleNav('prev');
      if(e.key === 'Escape') onExit();
  }, [currentSlide, totalSlides, onExit]);
  
  useEffect(() => {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const colors = ['#F72585', '#7209B7', '#4CC9F0', '#06D6A0', '#FFD60A', '#333333'];
  const currentSlideData = slides[currentSlide];

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center text-white" dir={lessonData.language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-700">
        <div className="h-full bg-kid-green transition-all duration-300" style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}></div>
      </div>
      
      <div ref={canvasContainerRef} className="w-full h-full relative">
        <SlideComponent slide={currentSlideData} />
        {isAnnotating && <canvas ref={canvasRef} className="annotation-canvas" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} />}
      </div>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/30 backdrop-blur-md p-2 rounded-2xl shadow-lg">
        <button onClick={() => handleNav('prev')} disabled={currentSlide === 0} className="p-3 rounded-full hover:bg-white/20 disabled:opacity-30"><ChevronLeft size={32}/></button>
        <span className="font-bold">{currentSlide + 1} / {totalSlides}</span>
        <button onClick={() => handleNav('next')} disabled={currentSlide === totalSlides - 1} className="p-3 rounded-full hover:bg-white/20 disabled:opacity-30"><ChevronRight size={32}/></button>
      </div>

      <button onClick={onExit} className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-3 rounded-full bg-red-500 hover:bg-red-600 shadow-lg"><XCircle size={32}/></button>
      
      <div className="absolute top-1/2 -translate-y-1/2 left-4 rtl:left-auto rtl:right-4 flex flex-col gap-2 bg-black/30 backdrop-blur-md p-2 rounded-2xl shadow-lg">
          <button onClick={() => setShowSlideSorter(true)} className="p-3 rounded-lg text-white hover:bg-white/20"><LayoutGrid /></button>
          <button onClick={() => setIsAnnotating(s => !s)} className={`p-3 rounded-lg ${isAnnotating ? 'bg-kid-blue text-white' : 'text-white'}`}><Pen/></button>
          {isAnnotating && <>
              <button onClick={() => setDrawingTool('eraser')} className={`p-3 rounded-lg ${drawingTool === 'eraser' ? 'bg-gray-500 text-white' : 'text-white'}`}><Eraser/></button>
              <div className="flex flex-col gap-1 my-2">{colors.map(color => <button key={color} onClick={() => {setDrawingTool('pen'); setDrawingColor(color)}} style={{backgroundColor: color}} className={`w-8 h-8 rounded-full border-2 ${drawingColor === color && drawingTool === 'pen' ? 'border-white' : 'border-transparent'}`}></button>)}</div>
              <button onClick={clearAnnotations} className="p-3 text-white"><Trash2/></button>
          </>}
      </div>
      
      {showSlideSorter && <SlideSorter slides={slides} onSelect={(index) => { handleNav(index); setShowSlideSorter(false); }} onClose={() => setShowSlideSorter(false)} />}
    </div>
  );
};

const SlideComponent = ({ slide }: { slide: any }) => {
    switch (slide.type) {
        case 'title': return <div className="bg-kid-yellow w-full h-full flex flex-col justify-center items-center p-8 text-center text-yellow-900 pattern-dots"><span className="text-8xl mb-6 block">{slide.data.emoji}</span><h1 className="text-5xl md:text-7xl font-black leading-tight">{slide.data.title}</h1></div>;
        case 'intro': return <div className="bg-blue-50 w-full h-full flex flex-col justify-center items-center p-8 text-center"><h2 className="text-5xl font-bold text-kid-blue mb-8">{slide.data.lang === 'ar' ? 'المقدمة' : 'Introduction'}</h2><p className="text-3xl text-blue-900 leading-relaxed max-w-4xl">{slide.data.text}</p></div>;
        case 'funFact': return <div className="bg-yellow-50 w-full h-full flex flex-col justify-center items-center p-8 text-center"><h3 className="text-5xl font-bold text-yellow-800 mb-8">{slide.data.lang === 'ar' ? 'هل تعلم؟ 💡' : 'Fun Fact 💡'}</h3><p className="text-4xl text-yellow-900 font-medium max-w-4xl">{slide.data.text}</p></div>;
        case 'objectives': return <div className="bg-green-50 w-full h-full flex flex-col justify-center items-center p-8 text-center"><h3 className="text-5xl font-bold text-green-800 mb-8">{slide.data.lang === 'ar' ? 'أهداف الدرس 🎯' : 'Objectives 🎯'}</h3><ul className="text-3xl text-green-900 list-disc list-inside leading-relaxed text-left rtl:text-right">{slide.data.text.split('\n').map((o: string, i: number) => o.trim() && <li key={i}>{o.replace(/[-\*]\s*/, '')}</li>)}</ul></div>;
        case 'section':
            const { heading, content, imageUrl, index, lang } = slide.data;
            if (imageUrl) {
                return <div className="bg-white w-full h-full flex flex-col md:flex-row items-center justify-center p-8 text-center gap-8"><div className="w-full md:w-1/2 h-full flex items-center justify-center"><img src={imageUrl} alt={heading} className="max-h-[80%] max-w-full object-contain rounded-2xl shadow-lg" /></div><div className="w-full md:w-1/2 text-left rtl:text-right"><h3 className="text-4xl lg:text-5xl font-bold text-kid-purple mb-8">{`${index + 1}. ${heading}`}</h3><p className="text-2xl lg:text-3xl text-gray-700 leading-relaxed">{content}</p></div></div>;
            }
            return <div className="bg-white w-full h-full flex flex-col justify-center items-center p-8 text-center"><h3 className="text-5xl font-bold text-kid-purple mb-8">{`${index + 1}. ${heading}`}</h3><p className="text-3xl text-gray-700 leading-relaxed max-w-4xl">{content}</p></div>;
        default: return <div className="bg-gray-100 w-full h-full flex justify-center items-center"><p>End of Lesson</p></div>;
    }
}

const SlideSorter = ({ slides, onSelect, onClose }: { slides: any[], onSelect: (index: number) => void, onClose: () => void }) => (
    <div className="absolute inset-0 bg-black/90 z-20 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-6xl text-center">
            <h2 className="text-3xl font-bold text-white mb-8">اختر شريحة</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 max-h-[70vh] overflow-y-auto p-4 bg-black/20 rounded-lg">
                {slides.map((slide, index) => (
                    <div key={index} onClick={() => onSelect(index)} className="aspect-[16/9] bg-gray-700 rounded-lg cursor-pointer border-2 border-transparent hover:border-kid-blue transition-all flex items-center justify-center p-2 text-xs text-center overflow-hidden">
                        <span className="line-clamp-2">{slide.data.title || slide.data.heading || slide.data.text?.substring(0,30) || slide.type}</span>
                    </div>
                ))}
            </div>
            <button onClick={onClose} className="mt-8 bg-gray-600 px-6 py-2 rounded-lg hover:bg-gray-500">إغلاق</button>
        </div>
    </div>
);


interface LessonViewProps {
  data: LessonData;
  image?: string;
  onStartQuiz: () => void;
  isGeneratingQuiz: boolean;
  onUpdateLesson: (newData: LessonData) => void;
}

export const LessonView: React.FC<LessonViewProps> = ({ data, image, onStartQuiz, isGeneratingQuiz, onUpdateLesson }) => {
  const [isDownloadingPPT, setIsDownloadingPPT] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isInPresentationMode, setIsInPresentationMode] = useState(false);

  // Editing State
  const [editingField, setEditingField] = useState<'intro' | 'funFact' | number | null>(null);
  const [editContent, setEditContent] = useState('');

  const COPYRIGHT_TEXT = "حقوق البرنامج محفوظة --- ديم سعد البقمي -- مدارس الاندلس الاهلية بالحمدانية";
  
  const enterPresentationMode = () => {
    setIsInPresentationMode(true);
    document.documentElement.requestFullscreen().catch(err => {
      console.warn(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
    });
  };

  const exitPresentationMode = () => {
    setIsInPresentationMode(false);
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  const handleStartEdit = (field: 'intro' | 'funFact' | number, currentContent: string) => {
    setEditingField(field);
    setEditContent(currentContent);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditContent('');
  };

  const handleSaveEdit = () => {
    const newData = { ...data };
    if (editingField === 'intro') newData.introduction = editContent;
    else if (editingField === 'funFact') newData.funFact = editContent;
    else if (typeof editingField === 'number') newData.sections[editingField].content = editContent;
    onUpdateLesson(newData);
    setEditingField(null);
    setEditContent('');
  };

  const handleSaveToLibrary = async () => {
    if (isSaved) return;
    setIsSaving(true);
    try {
        const existingLessons = (await get('darsy_lessons')) || [];
        const newLesson: SavedLesson = { id: Date.now().toString(), date: Date.now(), data: data, imagePreview: image };
        await set('darsy_lessons', [newLesson, ...existingLessons]);
        setIsSaved(true);
    } catch (e) {
        console.error("Save error", e);
        alert('حدث خطأ أثناء حفظ الدرس');
    } finally {
        setIsSaving(false);
    }
  };


  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true);
    const element = document.getElementById('lesson-content-to-print');
    const opt = { margin: [20, 20, 30, 20], filename: `${data.title.replace(/\s+/g, '_')}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, scrollY: 0 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } };
    try {
      // @ts-ignore
      if (window.html2pdf) { await window.html2pdf().set(opt).from(element).save(); } 
      else { alert("خاصية تحميل PDF غير متوفرة حالياً. يرجى استخدام الطباعة كبديل."); window.print(); }
    } catch (e) { console.error("PDF Error", e); alert("حدث خطأ أثناء تحميل ملف PDF"); } 
    finally { setIsDownloadingPDF(false); }
  };

  const handleDownloadPPT = async () => {
    setIsDownloadingPPT(true);
    try {
      const pres = new PptxGenJS();
      pres.rtlMode = data.language === 'ar';
      pres.layout = 'LAYOUT_16x9';
      const KID_BLUE = '4CC9F0';
      const KID_PURPLE = '7209B7';
      const TEXT_DARK = '333333';
      const KID_GREEN = '06D6A0';

      const addCopyright = (slide: any) => slide.addText(COPYRIGHT_TEXT, { x: 0, y: '95%', w: '100%', fontSize: 10, align: 'center', color: '999999', fontFace: 'Arial' });
      
      let slide = pres.addSlide();
      slide.background = { color: 'F0F9FF' };
      slide.addText(data.emoji, { x: 0, y: '15%', w: '100%', align: 'center', fontSize: 60 });
      slide.addText(data.title, { x: 0, y: '35%', w: '100%', align: 'center', fontSize: 44, color: KID_PURPLE, bold: true });
      if (data.teacherName || data.className) {
        const infoText = [data.teacherName ? `${data.language === 'ar' ? 'المعلم/ة' : 'Teacher'}: ${data.teacherName}` : '', data.className ? `${data.language === 'ar' ? 'الصف' : 'Class'}: ${data.className}` : ''].filter(Boolean).join(' | ');
        slide.addText(infoText, { x: 0, y: '55%', w: '100%', align: 'center', fontSize: 20, color: '666666' });
      }
      addCopyright(slide);

      data.sections.forEach((section, index) => {
        slide = pres.addSlide();
        slide.background = { color: 'FFFFFF' };
        const contentAlign = data.language === 'ar' ? 'right' : 'left';
        
        if (section.imageUrl) {
            slide.addText(`${index + 1}. ${section.heading}`, { x: '52%', y: '10%', w: '43%', h: '10%', fontSize: 32, bold: true, color: KID_BLUE, align: contentAlign });
            slide.addImage({ path: section.imageUrl, x: '5%', y: '15%', w: '45%', h: '75%', sizing: { type: 'contain' } });
            slide.addText(section.content, { x: '52%', y: '25%', w: '43%', h: '65%', fontSize: 20, color: TEXT_DARK, align: contentAlign, valign: 'top' });
        } else {
            slide.addText(`${index + 1}. ${section.heading}`, { x: '5%', y: '10%', w: '90%', fontSize: 32, bold: true, color: KID_BLUE, align: contentAlign });
            slide.addText(section.content, { x: '5%', y: '25%', w: '90%', h: '65%', fontSize: 24, color: TEXT_DARK, align: contentAlign, valign: 'top' });
        }
        addCopyright(slide);
      });

      slide = pres.addSlide();
      slide.background = { color: 'FFFBEB' };
      slide.addText(data.language === 'ar' ? "هل تعلم؟ 💡" : "Fun Fact 💡", { x: 0, y: '20%', w: '100%', align: 'center', fontSize: 36, bold: true, color: 'D97706' });
      slide.addText(data.funFact, { x: 0, y: '40%', w: '100%', align: 'center', fontSize: 28, color: TEXT_DARK });
      addCopyright(slide);

      await pres.writeFile({ fileName: `${data.title}.pptx` });
    } catch (e) {
      console.error("PPT Generation Error", e);
      alert("حدث خطأ أثناء إنشاء ملف البوربوينت");
    } finally { setIsDownloadingPPT(false); }
  };

  if (isInPresentationMode) {
    return <PresentationMode lessonData={data} onExit={exitPresentationMode} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-100 flex flex-wrap justify-between items-center gap-4 no-print">
         <div className="flex items-center gap-2">
            <button onClick={enterPresentationMode} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all">
                <Play size={18} /><span>عرض تقديمي</span>
            </button>
         </div>
         <div className="flex gap-2 flex-wrap justify-center w-full md:w-auto" dir="ltr">
            <button onClick={handleSaveToLibrary} disabled={isSaving || isSaved} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${isSaved ? 'bg-green-100 text-green-700 cursor-default' : 'bg-kid-purple/10 text-kid-purple hover:bg-kid-purple hover:text-white'}`}>
              {isSaved ? <Check size={18} /> : <Bookmark size={18} />}<span>{isSaved ? 'تم الحفظ' : 'حفظ الدرس'}</span>
            </button>
            <div className="w-px h-8 bg-gray-200 hidden md:block"></div>
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all"><Printer size={18} /><span>طباعة</span></button>
            <button onClick={handleDownloadPDF} disabled={isDownloadingPDF} className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold transition-all disabled:opacity-50">{isDownloadingPDF ? <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div> : <FileText size={18} />}<span>PDF</span></button>
            <button onClick={handleDownloadPPT} disabled={isDownloadingPPT} className="flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl font-bold transition-all disabled:opacity-50">{isDownloadingPPT ? <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div> : <Presentation size={18} />}<span>PowerPoint</span></button>
         </div>
      </div>

      <div id="lesson-content-to-print" className="bg-white rounded-3xl shadow-xl overflow-hidden border-b-8 border-kid-yellow print-content relative">
        <div className="bg-kid-yellow py-20 px-6 text-center relative overflow-hidden break-after-page print:break-after-page">
           <div className="absolute top-0 left-0 w-full h-full pattern-dots"></div>
           <div className="relative z-10">
             <span className="text-8xl mb-6 block animate-bounce print:hidden">{data.emoji}</span>
             <h1 className="text-5xl md:text-6xl font-black text-yellow-900 mb-6 leading-tight">{data.title}</h1>
             {(data.teacherName || data.className) && (<div className="flex flex-wrap justify-center gap-4 mt-8 text-yellow-900 font-bold text-2xl bg-white/40 inline-block px-10 py-4 rounded-full backdrop-blur-sm print:bg-transparent print:text-black border-4 border-white/50"><span>المعلم/ة: {data.teacherName}</span><span className="opacity-50 mx-2">|</span><span>الصف: {data.className}</span></div>)}
           </div>
        </div>
        <div className="p-8 md:p-12">
            {image && (<div className="mb-12 rounded-3xl overflow-hidden shadow-lg border-8 border-gray-100 no-print mx-auto max-w-2xl"><img src={image} alt="Lesson Context" className="w-full h-auto object-cover" /></div>)}
            <div className="prose prose-lg max-w-none text-center">
                <div className="bg-blue-50 p-8 rounded-3xl border-4 border-kid-blue mb-12 print:border-none print:bg-transparent print:p-0 relative group break-inside-avoid shadow-sm intro-card">
                    {editingField === 'intro' ? (<div className="space-y-2 no-print"><textarea className="w-full p-3 border-2 border-kid-blue rounded-xl focus:outline-none h-32 text-center text-xl" value={editContent} onChange={(e) => setEditContent(e.target.value)} /><div className="flex gap-2 justify-center"><button onClick={handleSaveEdit} className="bg-green-500 text-white p-2 rounded-lg flex items-center gap-1 hover:bg-green-600"><Save size={16}/> حفظ</button><button onClick={handleCancelEdit} className="bg-gray-400 text-white p-2 rounded-lg flex items-center gap-1 hover:bg-gray-500"><X size={16}/> إلغاء</button></div></div>) : (<><button onClick={() => handleStartEdit('intro', data.introduction)} className="absolute top-2 left-2 text-gray-400 hover:text-kid-blue opacity-0 group-hover:opacity-100 transition-opacity no-print"><Edit3 size={18} /></button><h3 className="text-xl font-bold text-kid-blue mb-4">مقدمة</h3><p className="text-2xl text-blue-900 leading-relaxed font-medium print:text-black whitespace-pre-line">{data.introduction}</p></>)}
                </div>
                <div className="space-y-12">
                    {data.sections.map((section, idx) => (<div key={idx} className="section-card bg-white p-8 rounded-3xl shadow-sm border-2 border-gray-100 hover:shadow-md transition-shadow print:shadow-none print:border-none print:p-0 print:mb-12 relative group break-inside-avoid page-break-inside-avoid text-center"><h3 className="text-3xl font-bold text-kid-purple mb-6 flex justify-center items-center gap-3 print:text-black"><span className="w-10 h-10 rounded-full bg-purple-100 text-kid-purple flex items-center justify-center text-lg print:border print:border-black print:bg-white print:text-black">{idx + 1}</span>{section.heading}</h3>{section.imageUrl && (<div className="mb-8 rounded-2xl overflow-hidden shadow-sm border-4 border-gray-50 transform hover:scale-[1.01] transition-transform print:shadow-none print:border-none print:transform-none mx-auto max-w-xl"><img src={section.imageUrl} alt={section.heading} className="w-full h-auto object-cover" /></div>)}{editingField === idx ? (<div className="space-y-2 no-print"><textarea className="w-full p-3 border-2 border-kid-purple rounded-xl focus:outline-none h-40 text-center text-lg" value={editContent} onChange={(e) => setEditContent(e.target.value)} /><div className="flex gap-2 justify-center"><button onClick={handleSaveEdit} className="bg-green-500 text-white p-2 rounded-lg flex items-center gap-1 hover:bg-green-600"><Save size={16}/> حفظ</button><button onClick={handleCancelEdit} className="bg-gray-400 text-white p-2 rounded-lg flex items-center gap-1 hover:bg-gray-500"><X size={16}/> إلغاء</button></div></div>) : (<><button onClick={() => handleStartEdit(idx, section.content)} className="absolute top-2 left-2 text-gray-400 hover:text-kid-purple opacity-0 group-hover:opacity-100 transition-opacity no-print"><Edit3 size={18} /></button><p className="text-xl text-gray-700 leading-loose print:text-black whitespace-pre-line">{section.content}</p></>)}</div>))}
                </div>
            </div>
            <div className="mt-12 bg-yellow-50 p-8 rounded-3xl border-4 border-dashed border-kid-yellow print:border-none print:bg-transparent print:p-0 relative group break-inside-avoid fun-fact-card text-center" style={{pageBreakInside: 'avoid'}}>{editingField === 'funFact' ? (<div className="space-y-2 no-print"><textarea className="w-full p-3 border-2 border-kid-yellow rounded-xl focus:outline-none h-24 text-center text-lg" value={editContent} onChange={(e) => setEditContent(e.target.value)} /><div className="flex gap-2 justify-center"><button onClick={handleSaveEdit} className="bg-green-500 text-white p-2 rounded-lg flex items-center gap-1 hover:bg-green-600"><Save size={16}/> حفظ</button><button onClick={handleCancelEdit} className="bg-gray-400 text-white p-2 rounded-lg flex items-center gap-1 hover:bg-gray-500"><X size={16}/> إلغاء</button></div></div>) : (<><button onClick={() => handleStartEdit('funFact', data.funFact)} className="absolute top-2 left-2 text-gray-400 hover:text-kid-yellow opacity-0 group-hover:opacity-100 transition-opacity no-print"><Edit3 size={18} /></button><div className="flex items-center justify-center gap-3 mb-4"><Lightbulb className="w-8 h-8 text-kid-yellow animate-pulse" /><h3 className="text-2xl font-bold text-yellow-800">هل تعلم؟</h3></div><p className="text-xl text-yellow-900 font-medium print:text-black">{data.funFact}</p></>)}</div>
            <div className="mt-16 pt-8 border-t-4 border-gray-100 print:border-none break-before-page section-card text-center"><h3 className="text-3xl font-bold text-kid-green mb-6 flex items-center justify-center gap-2"><Pen className="w-8 h-8" />مساحة المبدع الصغير</h3><p className="text-xl text-gray-500 mb-8">ماذا تعرف أيضاً عن هذا الموضوع؟ أبدع بكتابتك أو رسمك هنا:</p><div className="space-y-8 bg-white p-8 rounded-3xl border-2 border-gray-100 print:border-none print:shadow-none print:p-0">{[...Array(6)].map((_, i) => (<div key={i} className="border-b-2 border-dashed border-gray-300 h-12 w-full relative"><span className="absolute right-0 -top-8 text-gray-200 text-4xl opacity-20">{i+1}</span></div>))}</div></div>
            <div className="mt-12 text-center text-gray-400 text-sm py-4 border-t border-gray-100 print:hidden">{COPYRIGHT_TEXT}</div>
        </div>
        <div className="copyright-footer hidden print:block">{COPYRIGHT_TEXT}</div>
        <div className="bg-gray-50 p-6 flex justify-center no-print"><button onClick={onStartQuiz} disabled={isGeneratingQuiz} className="bg-kid-purple text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-lg hover:bg-purple-700 hover:scale-105 transition-all flex items-center gap-3 disabled:bg-gray-400 disabled:scale-100">{isGeneratingQuiz ? (<>جاري تحضير المسابقة...</>) : (<><PlayCircle size={24} /><span>بدء المسابقة التفاعلية</span></>)}</button></div>
      </div>
      <div className="copyright-footer hidden print:block">{COPYRIGHT_TEXT}</div>
    </div>
  );
}