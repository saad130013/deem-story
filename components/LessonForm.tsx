
import React, { useState, useRef } from 'react';
import { Upload, BookOpen, Smile, Zap, Sparkles, User, School, Calculator, Languages, GraduationCap } from 'lucide-react';
import { LessonRequest } from '../types';

interface LessonFormProps {
  onSubmit: (data: LessonRequest) => void;
  isLoading: boolean;
}

export const LessonForm: React.FC<LessonFormProps> = ({ onSubmit, isLoading }) => {
  const [subject, setSubject] = useState<'general' | 'math' | 'reading'>('general');
  const [topic, setTopic] = useState('');
  const [ageGroup, setAgeGroup] = useState('6-8');
  const [tone, setTone] = useState('fun');
  const [teacherName, setTeacherName] = useState('');
  const [className, setClassName] = useState('');
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    onSubmit({
      subject,
      topic,
      ageGroup,
      tone,
      image: imagePreview || undefined,
      teacherName,
      className,
      language
    });
  };

  const getTopicPlaceholder = () => {
    if (subject === 'math') return language === 'ar' ? 'مثال: جدول الضرب 5، الأشكال الهندسية، الجمع البسيط...' : 'Ex: Multiplication table, Shapes, Addition...';
    if (subject === 'reading') return language === 'ar' ? 'مثال: حرف الألف، اللام الشمسية، قراءة كلمات ثلاثية...' : 'Ex: Letter A, Phonics, Sight words...';
    return language === 'ar' ? 'مثال: المجموعة الشمسية، حياة النحل، الألوان...' : 'Ex: Solar System, Bees, Colors...';
  };

  const getTopicLabel = () => {
    if (subject === 'math') return language === 'ar' ? 'المفهوم الرياضي' : 'Math Concept';
    if (subject === 'reading') return language === 'ar' ? 'مهارة القراءة أو الحرف' : 'Reading Skill / Letter';
    return language === 'ar' ? 'عنوان الدرس أو الموضوع' : 'Lesson Topic';
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-kid-blue">
      <div className="bg-kid-blue p-6 text-center text-white relative overflow-hidden">
        <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-yellow-300" />
            <span>{language === 'ar' ? 'اصنع درسك الجديد' : 'Create New Lesson'}</span>
            </h2>
            <p className="text-blue-100">{language === 'ar' ? 'اختر نوع الدرس وسيقوم الذكاء الاصطناعي بالباقي!' : 'Choose lesson type and let AI do the magic!'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
        
        {/* Language Toggle */}
        <div className="flex justify-center">
            <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
                <button
                    type="button"
                    onClick={() => setLanguage('ar')}
                    className={`px-6 py-2 rounded-lg font-bold text-lg transition-all ${language === 'ar' ? 'bg-white shadow-md text-kid-blue' : 'text-gray-400'}`}
                >
                    عربي 🇸🇦
                </button>
                <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`px-6 py-2 rounded-lg font-bold text-lg transition-all ${language === 'en' ? 'bg-white shadow-md text-kid-purple' : 'text-gray-400'}`}
                >
                    English 🇺🇸
                </button>
            </div>
        </div>

        {/* Subject Selection Tabs */}
        <div className="grid grid-cols-3 gap-3 md:gap-6">
            <button
                type="button"
                onClick={() => setSubject('general')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                    subject === 'general' 
                    ? 'border-kid-blue bg-blue-50 text-kid-blue shadow-lg scale-105' 
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
            >
                <BookOpen size={32} />
                <span className="font-bold text-lg">{language === 'ar' ? 'عام / قصص' : 'General'}</span>
            </button>

            <button
                type="button"
                onClick={() => setSubject('math')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                    subject === 'math' 
                    ? 'border-kid-yellow bg-yellow-50 text-orange-500 shadow-lg scale-105' 
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
            >
                <Calculator size={32} />
                <span className="font-bold text-lg">{language === 'ar' ? 'رياضيات' : 'Math'}</span>
            </button>

            <button
                type="button"
                onClick={() => setSubject('reading')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                    subject === 'reading' 
                    ? 'border-kid-green bg-green-50 text-kid-green shadow-lg scale-105' 
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
            >
                <Languages size={32} />
                <span className="font-bold text-lg">{language === 'ar' ? 'تعلم القراءة' : 'Reading'}</span>
            </button>
        </div>

        {/* Teacher & Class Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <div className="space-y-2">
            <label className="block text-gray-700 font-bold">{language === 'ar' ? 'اسم المعلم/ة' : 'Teacher Name'}</label>
            <div className="relative">
              <User className="absolute right-3 top-3 w-5 h-5 text-gray-400 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto" />
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder={language === 'ar' ? 'أ. محمد / أ. سارة' : 'Mr. Smith / Ms. Sarah'}
                className={`w-full p-3 border-2 border-gray-200 rounded-xl focus:border-kid-purple outline-none ${language === 'ar' ? 'pr-10' : 'pl-10'}`}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-gray-700 font-bold">{language === 'ar' ? 'الصف الدراسي' : 'Class Grade'}</label>
            <div className="relative">
              <School className="absolute right-3 top-3 w-5 h-5 text-gray-400 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto" />
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder={language === 'ar' ? 'الأول الابتدائي...' : '1st Grade...'}
                className={`w-full p-3 border-2 border-gray-200 rounded-xl focus:border-kid-purple outline-none ${language === 'ar' ? 'pr-10' : 'pl-10'}`}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
          </div>
        </div>

        {/* Topic Input */}
        <div className="space-y-2">
          <label className="block text-gray-700 font-bold text-xl">{getTopicLabel()}</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={getTopicPlaceholder()}
            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-kid-purple focus:ring-4 focus:ring-purple-100 transition-all text-lg outline-none"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            required
          />
        </div>

        {/* Age Group Selection */}
        <div className="space-y-2">
          <label className="block text-gray-700 font-bold text-lg">{language === 'ar' ? 'الفئة العمرية' : 'Age Group'}</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setAgeGroup('6-8')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                ageGroup === '6-8' 
                  ? 'border-kid-green bg-green-50 text-kid-green font-bold shadow-md transform scale-105' 
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <Smile className="w-8 h-8" />
              <span>6 - 8 {language === 'ar' ? 'سنوات' : 'Years'}</span>
            </button>
            <button
              type="button"
              onClick={() => setAgeGroup('9-11')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                ageGroup === '9-11' 
                  ? 'border-kid-yellow bg-yellow-50 text-yellow-600 font-bold shadow-md transform scale-105' 
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <Zap className="w-8 h-8" />
              <span>9 - 11 {language === 'ar' ? 'سنة' : 'Years'}</span>
            </button>
          </div>
        </div>

        {/* Tone Selection - Hidden for Math/Reading to simplify, using default 'educational' internally */}
        {subject === 'general' && (
            <div className="space-y-2">
            <label className="block text-gray-700 font-bold text-lg">{language === 'ar' ? 'أسلوب الشرح' : 'Tone'}</label>
            <select 
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-gray-700 focus:border-kid-pink outline-none"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
                <option value="fun">{language === 'ar' ? 'مرح ومضحك' : 'Fun & Playful'}</option>
                <option value="story">{language === 'ar' ? 'قصصي وحكائي' : 'Storytelling'}</option>
                <option value="scientific">{language === 'ar' ? 'علمي ومبسط' : 'Scientific & Simple'}</option>
                <option value="adventure">{language === 'ar' ? 'مغامرة وتشويق' : 'Adventure'}</option>
            </select>
            </div>
        )}

        {/* Image Upload */}
        <div className="space-y-2">
          <label className="block text-gray-700 font-bold text-lg">{language === 'ar' ? 'صورة توضيحية (اختياري)' : 'Upload Image (Optional)'}</label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-3 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-kid-blue transition-colors min-h-[120px]"
          >
            {imagePreview ? (
              <div className="relative w-full h-48">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  X
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">{language === 'ar' ? 'اضغط لرفع صورة تساعد في الشرح' : 'Click to upload a helper image'}</p>
              </>
            )}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageUpload}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 rounded-xl text-white font-bold text-xl shadow-lg transition-all transform duration-200 flex items-center justify-center gap-2 ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-kid-pink hover:bg-pink-600 hover:scale-[1.02] hover:shadow-xl active:scale-95 active:shadow-inner'
          }`}
        >
          {isLoading ? (
            language === 'ar' ? 'جاري تحضير الدرس...' : 'Creating Lesson...'
          ) : (
            <>
              <GraduationCap className="w-8 h-8" />
              <span>{language === 'ar' ? 'ابدأ الدرس السحري' : 'Start Magic Lesson'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
