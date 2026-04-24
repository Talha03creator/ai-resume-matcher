import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ur';

interface Translations {
  [key: string]: {
    [K in Language]: string;
  };
}

const translations: Translations = {
  // Navbar
  'nav.features': { en: 'Features', ur: 'خصوصیات' },
  'nav.howItWorks': { en: 'How it Works', ur: 'یہ کیسے کام کرتا ہے' },
  'nav.analyzer': { en: 'Analyzer', ur: 'تجزیہ کار' },
  'nav.history': { en: 'History', ur: 'تاریخ' },
  'nav.help': { en: 'Help', ur: 'مدد' },
  'nav.search': { en: 'Deep Search...', ur: 'گہری تلاش...' },

  // Hero
  'hero.title.part1': { en: 'Analyze Your Resume with', ur: 'اپنے ریزیومے کا تجزیہ کریں' },
  'hero.title.part2': { en: 'MatchAI', ur: 'MatchAI کے ساتھ' },
  'hero.subtitle': { en: 'Empowering professionals to reach their potential through precision AI analysis.', ur: 'اعلیٰ اے آئی تجزیہ کے ذریعے پیشہ ور افراد کو ان کی صلاحیتوں تک پہنچنے کے قابل بنانا۔' },
  'hero.cta': { en: 'Get Started', ur: 'شروع کریں' },

  // Analyzer
  'analyzer.jobLabel': { en: 'Job Description', ur: 'ملازمت کی تفصیل' },
  'analyzer.resumeLabel': { en: 'Resume/CV', ur: 'ریزیومے / سی وی' },
  'analyzer.pasteJob': { en: 'Paste the job description here...', ur: 'ملازمت کی تفصیل یہاں پیسٹ کریں...' },
  'analyzer.pasteResume': { en: 'Paste the resume here...', ur: 'ریزیومے یہاں پیسٹ کریں...' },
  'analyzer.uploadFile': { en: 'Upload File', ur: 'فائل اپ لوڈ کریں' },
  'analyzer.button': { en: 'Analyze Match', ur: 'میچ کا تجزیہ کریں' },
  'analyzer.loading': { en: 'Analyzing...', ur: 'تجزیہ ہو رہا ہے...' },
  'analyzer.progress.label': { en: 'Analysis Progress', ur: 'تجزیہ کی پیشرفت' },
  'analyzer.progress.desc': { en: 'Our AI is meticulously scanning every section to provide the best matching insights.', ur: 'ہمارا اے آئی ہر حصے کو باریکی سے اسکین کر رہا ہے تاکہ بہترین میچنگ بصیرت فراہم کی جا سکے۔' },

  // Results
  'results.title': { en: 'Analysis Results', ur: 'تجزیہ کے نتائج' },
  'results.overview': { en: 'Overview', ur: 'جائزہ' },
  'results.skills': { en: 'Skills & Gaps', ur: 'مہارتیں اور فرق' },
  'results.tips': { en: 'Action Plan', ur: 'عملی منصوبہ' },
  'results.optimize': { en: 'Optimization', ur: 'اصلاح' },
  'results.summary': { en: 'Analysis Summary', ur: 'تجزیہ کا خلاصہ' },
  'results.strengths': { en: 'Key Strengths', ur: 'اہم خوبیاں' },
  'results.gaps': { en: 'Areas of Concern', ur: 'توجہ طلب علاقے' },
  'results.improveBtn': { en: 'Improve My Resume', ur: 'اپنا ریزیومے بہتر کریں' },
  'results.rewriteBtn': { en: 'Rewrite Resume', ur: 'ریزیومے دوبارہ لکھیں' },
  'results.download': { en: 'Download Action Plan', ur: 'ایکشن پلان ڈاؤن لوڈ کریں' },

  // FAQ
  'faq.title': { en: 'Common Questions', ur: 'عام سوالات' },
  'faq.subtitle': { en: 'Everything you need to know about MatchAI.', ur: 'MatchAI کے بارے میں وہ سب کچھ جو آپ کو جاننے کی ضرورت ہے۔' },
  'faq.dataSafe.q': { en: 'Is my data safe?', ur: 'کیا میرا ڈیٹا محفوظ ہے؟' },
  'faq.dataSafe.a': { en: 'Yes, all resumes and job descriptions are processed securely in memory and never stored permanently without your consent.', ur: 'جی ہاں، تمام ریزیومے اور ملازمت کی تفصیلات محفوظ طریقے سے میموری میں پروسیس کی جاتی ہیں اور آپ کی رضامندی کے بغیر کبھی مستقل طور پر محفوظ نہیں کی جاتیں۔' },
  'faq.accuracy.q': { en: 'How accurate is the AI scoring?', ur: 'اے آئی اسکورنگ کتنی درست ہے؟' },
  'faq.accuracy.a': { en: 'Our models are fine-tuned on millions of successful job matches, providing highly accurate, contextual relevance scoring similar to modern ATS systems.', ur: 'ہمارے ماڈل لاکھوں کامیاب جاب میچوں پر فائن ٹیون کیے گئے ہیں، جو جدید ATS سسٹمز کی طرح انتہائی درستگی فراہم کرتے ہیں۔' },
  'faq.formats.q': { en: 'What document formats are supported?', ur: 'کس قسم کے دستاویز کی شکلوں کی حمایت کی جاتی ہے؟' },
  'faq.formats.a': { en: 'Currently, we support PDF files (.pdf) as well as direct text copy-pasting for maximum flexibility.', ur: 'فی الحال ہم پی ڈی ایف فائلوں کے ساتھ ساتھ براہ راست ٹیکسٹ کاپی پیسٹ کرنے کی حمایت کرتے ہیں۔' },
  'faq.improve.q': { en: 'Will this actually help me get interviews?', ur: 'کیا یہ واقعی مجھے انٹرویو حاصل کرنے میں مدد دے گا؟' },
  'faq.improve.a': { en: 'Yes, on average, users who follow our actionable optimization tips see a 3.5x increase in callback rates.', ur: 'جی ہاں، اوسطاً، جو صارفین ہماری آپٹیمائزیشن ٹپس پر عمل کرتے ہیں ان کی کال بیک کی شرح میں 3.5 گنا اضافہ ہوتا ہے۔' },
  'faq.industries.q': { en: 'Does it work for any industry?', ur: 'کیا یہ کسی بھی صنعت کے لیے کام کرتا ہے؟' },
  'faq.industries.a': { en: 'MatchAI is industry-agnostic. It analyzes the specific semantic terminology of the job description provided, making it effective for tech, finance, creative, and more.', ur: 'میچ اے آئی انڈسٹری ایگناسٹک ہے۔ یہ آپ کے فراہم کردہ جاب ڈسکرپشن کی مخصوص تکنیکی اصطلاحات کا تجزیہ کرتا ہے۔' },

  // Onboarding
  'tour.skip': { en: 'Skip Tour', ur: 'ٹور چھوڑیں' },
  'tour.next': { en: 'Next Step', ur: 'اگلا مرحلہ' },
  'tour.finish': { en: 'Finish', ur: 'ختم کریں' },
  'tour.welcome.title': { en: 'Welcome to MatchAI!', ur: 'MatchAI میں خوش آمدید!' },
  'tour.welcome.desc': { en: 'Let\'s take a quick tour to show you how to get the best analysis results.', ur: 'آئیے ایک فوری ٹور کرتے ہیں تاکہ آپ کو بہترین تجزیہ کے نتائج حاصل کرنے کا طریقہ دکھایا جا سکے۔' },
  'tour.step1.title': { en: 'Step 1: Job Description', ur: 'مرحلہ 1: ملازمت کی تفصیل' },
  'tour.step1.desc': { en: 'Paste the job requirements or upload a file here.', ur: 'ملازمت کی ضروریات یہاں پیسٹ کریں یا فائل اپ لوڈ کریں۔' },
  'tour.step2.title': { en: 'Step 2: Your Resume', ur: 'مرحلہ 2: آپ کا ریزیومے' },
  'tour.step2.desc': { en: 'Provide your resume so the AI can compare it with the job.', ur: 'اپنا ریزیومے فراہم کریں تاکہ اے آئی اس کا ملازمت سے موازنہ کر سکے۔' },
  'tour.step3.title': { en: 'Step 3: Analyze', ur: 'مرحلہ 3: تجزیہ کریں' },
  'tour.step3.desc': { en: 'Click here to start the deep analysis process.', ur: 'گہرے تجزیہ کے عمل کو شروع کرنے کے لیے یہاں کلک کریں۔' },

  // Contact
  'contact.title': { en: 'Let\'s build your future together.', ur: 'آئیے مل کر آپ کا مستقبل بنائیں۔' },
  'contact.subtitle': { en: 'Have a question or want to work together? Leave a message below.', ur: 'کیا آپ کا کوئی سوال ہے یا مل کر کام کرنا چاہتے ہیں؟ نیچے ایک پیغام چھوڑیں۔' },
  'contact.emailLabel': { en: 'Email', ur: 'ای میل' },
  'contact.phoneLabel': { en: 'Phone Number', ur: 'فون نمبر' },
  'contact.linkedinLabel': { en: 'LinkedIn', ur: 'لنکڈ ان' },
  'contact.name': { en: 'Full Name', ur: 'پورا نام' },
  'contact.email': { en: 'Email Address', ur: 'ای میل پتہ' },
  'contact.message': { en: 'Message', ur: 'پیغام' },
  'contact.send': { en: 'Send Message', ur: 'پیغام بھیجیں' },
  'contact.success': { en: 'Message Sent!', ur: 'پیغام بھیج دیا گیا!' },

  // Stats
  'stats.resumes': { en: 'Resumes Analyzed', ur: 'تجزیہ شدہ ریزیومے' },
  'stats.scoreGain': { en: 'Average Score Gain', ur: 'اوسط اسکور میں اضافہ' },
  'stats.interviewRate': { en: 'Interview Rate', ur: 'انٹرویو کی شرح' },
  'stats.timeSaved': { en: 'Time Saved/Entry', ur: 'بچت شدہ وقت' },

  // Features Detail
  'features.title': { en: 'Precision-engineered for career growth.', ur: 'کیریئر کی ترقی کے لیے خاص طور پر تیار کیا گیا ہے۔' },
  'features.subtitle': { en: 'Our platform combines enterprise-grade AI with recruiter psychology to give you an unfair advantage.', ur: 'ہمارا پلیٹ فارم آپ کو غیر منصفانہ فائدہ دینے کے لیے انٹرپرائز گریڈ اے آئی کو بھرتی کرنے والے کی نفسیات کے ساتھ جوڑتا ہے۔' },
  'features.card1.title': { en: 'Deep Context Analysis', ur: 'گہرا سیاق و سباق کا تجزیہ' },
  'features.card1.desc': { en: 'We don\'t just match keywords. Our AI understands synonyms, context, and the actual impact of your experience.', ur: 'ہم صرف مطلوبہ الفاظ کا موازنہ نہیں کرتے۔ ہمارا اے آئی مترادفات، سیاق و سباق اور آپ کے تجربے کے اصل اثر کو سمجھتا ہے۔' },
  'features.card2.title': { en: 'Actionable Insights', ur: 'قابل عمل بصیرت' },
  'features.card2.desc': { en: 'Get specific recommendations on how to rephrase bullet points and which skills to highlight more prominently.', ur: 'بلٹ پوائنٹس کو دوبارہ ترتیب دینے اور کن مہارتوں کو زیادہ نمایاں طور پر اجاگر کرنے کے بارے میں مخصوص سفارشات حاصل کریں۔' },
  'features.card3.title': { en: 'Visual Scoring', ur: 'بصری اسکورنگ' },
  'features.card3.desc': { en: 'See exactly where you stand with detailed breakdowns of your skills, experience, and education match.', ur: 'اپنی مہارتوں، تجربے اور تعلیمی میچ کی تفصیلی خرابیوں کے ساتھ بالکل دیکھیں کہ آپ کہاں کھڑے ہیں۔' },

  // Process
  'process.title': { en: 'The 3-step path to your dream role.', ur: 'آپ کے خوابوں کے کردار کا 3 مرحلہ وار راستہ۔' },
  'process.step1.title': { en: 'Upload Your Documents', ur: 'اپنی دستاویزات اپ لوڈ کریں' },
  'process.step1.desc': { en: 'Paste or upload your resume and the target job description. We accept PDF, DOCX, and plain text.', ur: 'اپنا ریزیومے اور ٹارگٹ جاب کی تفصیل پیسٹ یا اپ لوڈ کریں۔ ہم PDF، DOCX، اور سادہ متن قبول کرتے ہیں۔' },
  'process.step2.title': { en: 'AI Analysis', ur: 'اے آئی تجزیہ' },
  'process.step2.desc': { en: 'Our engine processes the data, identifying semantic matches and critical gaps in real-time.', ur: 'ہمارا انجن ڈیٹا پر کارروائی کرتا ہے، حقیقی وقت میں معنوی میچوں اور اہم فرقوں کی نشاندہی کرتا ہے۔' },
  'process.step3.title': { en: 'Optimize & Excel', ur: 'بہتر بنائیں اور آگے بڑھیں' },
  'process.step3.desc': { en: 'Follow the AI-generated checklist to perfect your resume and land the interview.', ur: 'اپنے ریزیومے کو مکمل کرنے اور انٹرویو حاصل کرنے کے لیے اے آئی کی تیار کردہ چیک لسٹ پر عمل کریں۔' },

  // Footer
  'footer.tagline': { en: 'Empowering professionals to reach their potential through precision AI analysis.', ur: 'اعلیٰ اے آئی تجزیہ کے ذریعے پیشہ ور افراد کو ان کی صلاحیتوں تک پہنچنے کے قابل بنانا۔' },
  'footer.copy': { en: '© 2026 MatchAI. All rights reserved.', ur: '© 2026 MatchAI۔ جملہ حقوق محفوظ ہیں۔' },
};

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('matchai_lang') as Language;
    return saved === 'ur' || saved === 'en' ? saved : 'en';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('matchai_lang', newLang);
  };

  const isRTL = lang === 'ur';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, isRTL]);

  const t = (key: string) => {
    return translations[key]?.[lang] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t, isRTL }}>
      <div className={isRTL ? 'font-urdu' : 'font-sans'}>
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within an I18nProvider');
  return context;
}
