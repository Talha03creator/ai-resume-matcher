import React, { useState, useCallback } from 'react';
import { FileText, Briefcase, CheckCircle2, XCircle, AlertCircle, Lightbulb, ChevronRight, Loader2, Sparkles, UploadCloud, File as FileIcon, Trash2, ArrowRight, Github, Twitter, Linkedin, ListChecks, LayoutTemplate, Download, Copy, Check, RefreshCw, Undo2, Redo2, Paperclip, Search, History, MessageSquare, User, Mail, Send, Star, Zap, ShieldCheck, Target, Pencil, HelpCircle, Phone, Globe, Type } from 'lucide-react';
import { analyzeResume, type MatchResult, AnalysisError } from './services/ai';
import { cn } from './lib/utils';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { useUndoRedo } from './hooks/useUndoRedo';
import { improveResume, sendContact, rewriteResume, rewriteResumePro, type ImprovementResult, type RewriteResult, type RewriteResultPro } from './services/ai';
import { I18nProvider, useI18n } from './context/I18nContext';
import { OnboardingProvider, useOnboarding } from './context/OnboardingContext';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { Tooltip } from './components/Tooltip';
import { Spotlight } from './components/Spotlight';
import { CustomCursor } from './components/CustomCursor';
import { BackgroundMesh } from './components/BackgroundMesh';
import { Typewriter } from './components/Typewriter';
import { ShimmerButton } from './components/ShimmerButton';

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim()) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-white/20 text-white rounded px-0.5 border-b border-white/50">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function CircularProgress({ value, label, icon: Icon, delay = 0 }: { value: number; label: string; icon: any; delay?: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle 
            cx="48" cy="48" r={radius} 
            stroke="currentColor" 
            strokeWidth="6" 
            fill="transparent" 
            className="text-gray-800" 
          />
          <motion.circle 
            cx="48" cy="48" r={radius} 
            stroke="currentColor" 
            strokeWidth="6" 
            fill="transparent" 
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: offset }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay, ease: "easeOut" }}
            className={cn(
              value >= 80 ? "text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" : 
              value >= 60 ? "text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]" : 
              "text-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]"
            )}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
          <Icon className={cn("w-6 h-6", value >= 80 ? "text-cyan-400/50" : value >= 60 ? "text-blue-400/50" : "text-purple-500/50")} />
        </div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold text-white">{value}%</div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</div>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button 
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-800 rounded-lg transition-all text-gray-400 hover:text-white shrink-0"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function FeatureCard({ title, desc, delay }: { title: string; desc: string; delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="p-8 rounded-3xl glass glass-hover group hover:-translate-y-3 transition-all duration-500 hover:shadow-[0_0_40px_rgba(34,211,238,0.15)] hover:border-cyan-400/30 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-400/20 transition-all duration-500" />
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-cyan-400/20 group-hover:scale-110 transition-all duration-500 border border-white/5 group-hover:border-cyan-400/30">
        <Sparkles className="w-6 h-6 text-gray-400 group-hover:text-cyan-400 group-hover:drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all duration-500" />
      </div>
      <h3 className="text-xl font-bold mb-3 group-hover:text-white transition-colors tracking-tight relative z-10">{title}</h3>
      <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors font-medium relative z-10">{desc}</p>
    </motion.div>
  );
}

function ProcessStep({ number, title, desc, delay }: { number: string; title: string; desc: string; delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="flex gap-6 items-start group p-4 -ml-4 rounded-2xl hover:bg-white/5 transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] cursor-default"
    >
      <div className="shrink-0 w-14 h-14 rounded-full glass flex items-center justify-center font-black text-xl text-gray-500 group-hover:bg-cyan-400/20 group-hover:text-cyan-300 group-hover:border-cyan-400/40 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all duration-500 border border-white/10 relative">
        <div className="absolute inset-0 rounded-full bg-cyan-400/0 group-hover:animate-ping opacity-20 transition-all duration-700"></div>
        {number}
      </div>
      <div className="pt-1">
        <h4 className="text-xl font-bold mb-3 group-hover:text-cyan-300 transition-colors">{title}</h4>
        <p className="text-gray-400 text-base leading-relaxed group-hover:text-gray-300 transition-colors font-medium">{desc}</p>
      </div>
    </motion.div>
  );
}

function FAQItem({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-white/5 last:border-0 group/faq">
      <button 
        onClick={onClick}
        className="w-full py-6 flex items-center justify-between text-left group transition-all duration-300 hover:px-4 hover:bg-white/5 rounded-2xl my-2 border border-transparent hover:border-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
      >
        <span className="text-lg font-bold text-gray-400 group-hover:text-cyan-400 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all tracking-tight">{question}</span>
        <div className="bg-white/5 p-2 rounded-full group-hover:bg-cyan-400/20 group-hover:scale-110 transition-all border border-transparent group-hover:border-cyan-400/30">
          <ChevronRight className={cn("w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-transform duration-300", isOpen && "rotate-90 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]")} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden px-6"
          >
            <p className="pb-8 pt-2 text-gray-400 leading-relaxed max-w-3xl font-medium border-l-2 border-cyan-400/50 pl-6 ml-2 -mt-2">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FileUpload({ onFileSelect, file, label, icon: Icon, accept, isAnalyzing, tooltip }: any) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      setError(fileRejections[0].errors[0]?.message || 'Invalid file selected.');
      return;
    }
    setError(null);
    if (acceptedFiles.length > 0 && !isAnalyzing) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect, isAnalyzing]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    disabled: isAnalyzing
  } as any);

  return (
    <div className="flex flex-col gap-2 h-full">
      {error ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-center transition-all"
        >
          <AlertCircle className="w-8 h-8 mb-2 text-red-500 animate-bounce" />
          <p className="text-xs font-bold text-red-200 mb-3">{error}</p>
          <button 
            onClick={(e) => { e.stopPropagation(); setError(null); }}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-xl text-xs font-black transition-all flex items-center gap-2 border border-red-500/20"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </motion.div>
      ) : file ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group/file" 
          title={tooltip}
        >
          <div className="flex items-center gap-4 overflow-hidden z-10">
            <div className="w-12 h-12 rounded-xl bg-cyan-400/10 flex items-center justify-center border border-cyan-400/20 group-hover/file:bg-cyan-400/20 transition-all">
              <FileIcon className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
            </div>
            <div className="truncate">
              <p className="text-sm font-bold text-white truncate">{file.name}</p>
              <p className="text-[10px] text-gray-500 font-bold">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <div className="z-10 flex items-center">
            {isAnalyzing ? (
              <div className="bg-white/5 px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Processing</span>
              </div>
            ) : (
              <button 
                onClick={() => onFileSelect(null)}
                className="p-2.5 hover:bg-red-500/10 rounded-xl text-gray-500 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20"
                title="Remove file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          {isAnalyzing && (
            <motion.div 
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </motion.div>
      ) : (
        <motion.div 
          {...getRootProps()} 
          whileHover={!isAnalyzing ? { scale: 1.02 } : {}}
          whileTap={!isAnalyzing ? { scale: 0.98 } : {}}
          className={cn(
            "flex-1 flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all text-center group relative overflow-hidden",
            isAnalyzing ? "opacity-50 cursor-not-allowed border-white/5 bg-white/5" : "cursor-pointer",
            isDragActive && !isAnalyzing ? "border-cyan-400 bg-cyan-400/5 shadow-[0_0_30px_rgba(34,211,238,0.1)] scale-[1.02]" : "border-white/10 hover:border-cyan-400/30 hover:bg-white/5 shadow-none"
          )}
          title={tooltip}
        >
          <input {...getInputProps()} />
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          {isAnalyzing ? (
            <div className="relative">
              <Loader2 className="w-10 h-10 mb-3 text-cyan-400 animate-spin" />
              <div className="absolute inset-0 blur-xl bg-cyan-400/30 animate-pulse"></div>
            </div>
          ) : (
            <div className="relative group-hover:scale-110 transition-transform duration-500">
              <UploadCloud className={cn("w-12 h-12 mb-3 transition-all", isDragActive ? "text-cyan-400 scale-125 rotate-12" : "text-gray-600 group-hover:text-cyan-400")} />
              <div className={cn("absolute inset-0 blur-2xl opacity-0 group-hover:opacity-30 bg-cyan-400 transition-opacity", isDragActive && "opacity-60")} />
            </div>
          )}
          <p className="text-sm font-black text-gray-400 mb-1 group-hover:text-white transition-colors relative z-10 text-[11px] uppercase tracking-[0.1em]">
            {isAnalyzing ? "AI is processing..." : isDragActive ? "Drop to parse" : "Drop Resume/CV Here"}
          </p>
          {!isAnalyzing && (
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.15em] relative z-10 group-hover:text-gray-400 transition-colors">
              PDF, DOCX, or TXT
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

function InputArea({ label, icon: Icon, file, onFileSelect, text, onTextChange, isAnalyzing, accept, tooltip, undo, redo, canUndo, canRedo }: any) {
  const [inputType, setInputType] = useState<'text' | 'file'>('text');
  
  return (
    <div className="h-[320px] flex flex-col gap-4 group/input">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 group-hover/input:text-gray-300 transition-colors">
          <Icon className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
          {label}
        </label>
        
        {/* Glass Tab Switcher */}
        <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden backdrop-blur-md">
           <button 
             onClick={() => setInputType('text')}
             className={cn(
               "relative px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 z-10",
               inputType === 'text' ? "text-black" : "text-gray-400 hover:text-white"
             )}
           >
             {inputType === 'text' && (
               <motion.div 
                 layoutId={`${label}-tab`}
                 className="absolute inset-0 bg-white rounded-xl -z-10 shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                 transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
               />
             )}
             <Type className="w-3 h-3" />
             Text
           </button>
           <button 
             onClick={() => setInputType('file')}
             className={cn(
               "relative px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 z-10",
               inputType === 'file' ? "text-black" : "text-gray-400 hover:text-white"
             )}
           >
             {inputType === 'file' && (
               <motion.div 
                 layoutId={`${label}-tab`}
                 className="absolute inset-0 bg-white rounded-xl -z-10 shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                 transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
               />
             )}
             <Paperclip className="w-3 h-3" />
             File
           </button>
        </div>
      </div>
      
      <div className="flex-1 relative">
        {inputType === 'file' ? (
          <FileUpload 
            label={label} 
            icon={Icon} 
            file={file} 
            onFileSelect={onFileSelect}
            isAnalyzing={isAnalyzing}
            accept={accept}
            tooltip={tooltip}
          />
        ) : (
          <div className="flex flex-col gap-2 h-full">
            <div className="absolute right-4 top-4 z-20 flex items-center gap-1 opacity-0 group-hover/input:opacity-100 transition-opacity">
               {undo && (
                 <button
                   onClick={undo}
                   disabled={!canUndo || isAnalyzing}
                   className="p-2 bg-black/40 backdrop-blur-md text-gray-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed border border-white/10 rounded-xl transition-all hover:scale-110"
                   title="Undo"
                 >
                   <Undo2 className="w-4 h-4" />
                 </button>
               )}
               {redo && (
                 <button
                   onClick={redo}
                   disabled={!canRedo || isAnalyzing}
                   className="p-2 bg-black/40 backdrop-blur-md text-gray-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed border border-white/10 rounded-xl transition-all hover:scale-110"
                   title="Redo"
                 >
                   <Redo2 className="w-4 h-4" />
                 </button>
               )}
            </div>
            <textarea
              className="flex-1 w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-6 text-sm text-white placeholder-gray-600 focus:bg-white/10 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/10 outline-none resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed font-medium"
              placeholder={`Paste your ${label.toLowerCase()} content here...`}
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setStatus('loading');
    try {
      await sendContact(
        fd.get('name') as string,
        fd.get('email') as string,
        fd.get('message') as string
      );
      setStatus('success');
      (e.target as HTMLFormElement).reset();
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 group">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1 group-focus-within:text-cyan-400 transition-colors">Full Name</label>
          <div className="relative">
             <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-cyan-400 transition-colors" />
             <input required name="name" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white hover:border-white/20 hover:bg-white/10 focus:bg-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:shadow-[0_0_20px_rgba(34,211,238,0.2)] outline-none transition-all duration-300" />
          </div>
        </div>
        <div className="space-y-2 group">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1 group-focus-within:text-cyan-400 transition-colors">Email Address</label>
          <div className="relative">
             <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-cyan-400 transition-colors" />
             <input required name="email" type="email" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white hover:border-white/20 hover:bg-white/10 focus:bg-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:shadow-[0_0_20px_rgba(34,211,238,0.2)] outline-none transition-all duration-300" />
          </div>
        </div>
      </div>
      <div className="space-y-2 group">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1 group-focus-within:text-cyan-400 transition-colors">Message</label>
        <textarea required name="message" rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-white hover:border-white/20 hover:bg-white/10 focus:bg-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:shadow-[0_0_20px_rgba(34,211,238,0.2)] outline-none transition-all duration-300 resize-none" placeholder="Tell us about your needs..." />
      </div>
      <button 
        disabled={status === 'loading'}
        className="w-full relative px-8 py-4 bg-white text-black font-extrabold rounded-xl overflow-hidden hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] flex items-center justify-center gap-3 group border border-transparent"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
        <span className="relative z-10 flex items-center justify-center gap-2 group-hover:drop-shadow-[0_0_5px_rgba(34,211,238,0.8)] transition-all">
        {status === 'loading' ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : status === 'success' ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
            <span className="text-green-500">Message Sent!</span>
          </>
        ) : (
          <>
            <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            Send Message
          </>
        )}
        </span>
      </button>
    </form>
  );
}

function App() {
  const { lang, t, isRTL } = useI18n();
  const { startTour } = useOnboarding();
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const {
    state: jobText,
    set: setJobText,
    undo: undoJobText,
    redo: redoJobText,
    canUndo: canUndoJobText,
    canRedo: canRedoJobText
  } = useUndoRedo('');
  
  const {
    state: resumeText,
    set: setResumeText,
    undo: undoResumeText,
    redo: redoResumeText,
    canUndo: canUndoResumeText,
    canRedo: canRedoResumeText
  } = useUndoRedo('');

  const [jobFile, setJobFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loaderStatus, setLoaderStatus] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<{ message: string; details?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'tips' | 'history' | 'optimize' | 'rewrite'>('overview');
  const [searchQuery, setSearchQuery] = useState("");
  
  // History State
  const [history, setHistory] = useState<Array<{ id: number; date: string; result: MatchResult; jobTitle: string }>>(() => {
    const saved = localStorage.getItem('matchai_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Improvement State
  const [isImproving, setIsImproving] = useState(false);
  const [improvementResult, setImprovementResult] = useState<ImprovementResult | null>(null);

  // Rewrite State
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteResult, setRewriteResult] = useState<RewriteResultPro | null>(null);
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  const [showRewriteSuccess, setShowRewriteSuccess] = useState(false);

  const saveToHistory = (newResult: MatchResult) => {
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      result: newResult,
      jobTitle: jobText.split('\n')[0].substring(0, 30) || "Recent Analysis"
    };
    const updatedHistory = [entry, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('matchai_history', JSON.stringify(updatedHistory));
  };

  const handleAnalyze = async () => {
    const hasJob = jobText.trim() || jobFile;
    const hasResume = resumeText.trim() || resumeFile;

    if (!hasJob || !hasResume) {
      setError({ message: 'Please provide both a job description and a resume.' });
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setImprovementResult(null);

    // Loader Status Simulation
    const statuses = [
      "Analyzing core skills...",
      "Comparing work experience...",
      "Extracting educational background...",
      "Evaluating impact and achievements...",
      "Generating personalized insights..."
    ];
    
    let statusIndex = 0;
    const statusInterval = setInterval(() => {
      setLoaderStatus(statuses[statusIndex]);
      statusIndex = (statusIndex + 1) % statuses.length;
    }, 3000);
    setLoaderStatus(statuses[0]);

    try {
      console.log("[App] Starting analysis...");
      const matchResult = await analyzeResume(resumeText, jobText, resumeFile, jobFile);
      console.log("[App] Analysis success:", matchResult);
      setResult(matchResult);
      saveToHistory(matchResult);
      setActiveTab('overview');
      // Delay slightly to ensure result is rendered before scrolling
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error("[App] Analysis error:", err);
      // Show backend's friendly message (e.g. "Today's AI usage limit has been reached")
      setError({ 
        message: err.message || 'Analysis failed. Please try again.',
        details: err.details 
      });
    } finally {
      clearInterval(statusInterval);
      setIsAnalyzing(false);
    }
  };

  const handleImprove = async () => {
    if (!result) return;
    setIsImproving(true);
    setActiveTab('optimize');
    try {
      const improvement = await improveResume(resumeText, jobText);
      setImprovementResult(improvement);
    } catch (err: any) {
      console.error("[App] Improvement error:", err);
      // Show backend's friendly message (e.g. "Today's AI usage limit has been reached")
      setError({ 
        message: err.message || "Failed to optimize resume. Please try again.",
        details: err.details 
      });
    } finally {
      setIsImproving(false);
    }
  };

  const handleRewrite = async () => {
    if (!result) return;
    setIsRewriting(true);
    setRewriteResult(null);
    setRewriteError(null);
    setShowRewriteSuccess(false);
    setActiveTab('rewrite');
    try {
      const rewrite = await rewriteResumePro(resumeText, jobText, resumeFile, jobFile);
      setRewriteResult(rewrite);
      setShowRewriteSuccess(true);
      setTimeout(() => setShowRewriteSuccess(false), 8000);
    } catch (err: any) {
      console.error("[App] Rewrite error:", err);
      setRewriteError(err.message || "Failed to rewrite resume. Please try again.");
    } finally {
      setIsRewriting(false);
    }
  };

  const handleDownloadRewrite = () => {
    if (!rewriteResult) return;
    const content = rewriteResult.fullResumeText ||
      `PROFESSIONAL SUMMARY\n${rewriteResult.professionalSummary}\n\n` +
      `SKILLS\n${rewriteResult.skills.join(' • ')}\n\n` +
      `EXPERIENCE\n${rewriteResult.experience.map(e => `${e.role} @ ${e.company}${e.duration ? ` (${e.duration})` : ''}\n${e.bullets.map(b => `• ${b}`).join('\n')}`).join('\n\n')}\n\n` +
      (rewriteResult.projects?.length ? `PROJECTS\n${rewriteResult.projects.map(p => `${p.name}\n${p.description}\n${p.highlights?.length ? p.highlights.map(h => `✓ ${h}`).join('\n') + '\n' : ''}Tech: ${p.technologies.join(', ')}`).join('\n\n')}\n\n` : '') +
      `EDUCATION\n${rewriteResult.education.join('\n')}\n\n` +
      `ATS KEYWORDS\n${rewriteResult.atsKeywords.join(', ')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Rewritten_Resume_MatchAI.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownload = () => {
    if (!result) return;
    
    let content = "Resume Analysis Results\n";
    content += "=======================\n\n";
    content += `Overall Match Score: ${result.overallScore}%\n\n`;
    
    content += "--- Role-Specific Action Plan ---\n";
    result.improvementTips.forEach((tip, i) => {
      content += `${i + 1}. ${tip}\n`;
    });
    content += "\n";
    
    content += "--- General Resume Polish ---\n";
    result.resumeSuggestions.forEach((suggestion, i) => {
      content += `${i + 1}. ${suggestion}\n`;
    });
    content += "\n";

    if (result.templateRecommendations && result.templateRecommendations.length > 0) {
      content += "--- Template Recommendations ---\n";
      result.templateRecommendations.forEach((rec, i) => {
        content += `${i + 1}. ${rec.name}: ${rec.reason}\n`;
      });
      content += "\n";
    }

    if (result.checklist && result.checklist.length > 0) {
      content += "--- Interactive Improvement Checklist ---\n";
      result.checklist.forEach((item, i) => {
        content += `[ ] ${item}\n`;
      });
      content += "\n";
    }
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Resume_Improvement_Plan.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTips = () => {
    if (!result) return;
    
    let content = "Improvement Tips and Resume Suggestions\n";
    content += "=======================================\n\n";
    
    content += "--- Role-Specific Action Plan ---\n";
    result.improvementTips.forEach((tip, i) => {
      content += `${i + 1}. ${tip}\n`;
    });
    content += "\n";
    
    content += "--- General Resume Polish ---\n";
    result.resumeSuggestions.forEach((suggestion, i) => {
      content += `${i + 1}. ${suggestion}\n`;
    });
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Improvement_Tips_and_Suggestions.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const chartData = result ? [
    { subject: 'Skills', A: result.sectionScores.skills, fullMark: 100 },
    { subject: 'Experience', A: result.sectionScores.experience, fullMark: 100 },
    { subject: 'Education', A: result.sectionScores.education, fullMark: 100 },
    { subject: 'Impact', A: result.sectionScores.impact, fullMark: 100 },
  ] : [];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 backdrop-blur-2xl bg-black/40 border-b border-white/5 shadow-[0_4px_40px_rgba(0,0,0,0.2)] px-6 py-4 flex items-center justify-between z-50 transition-all duration-500">
        <div className="flex items-center gap-3 group cursor-pointer hover:drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all duration-300">
          <div className="bg-white/10 border border-white/20 p-2.5 rounded-xl group-hover:bg-cyan-400 group-hover:border-cyan-300 group-hover:-rotate-12 group-hover:scale-110 transition-all duration-300">
            <Sparkles className="w-5 h-5 text-white group-hover:text-black drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] group-hover:drop-shadow-none" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors">MatchAI</h1>
        </div>
        <nav className="hidden md:flex items-center gap-10 text-base font-bold text-gray-300 relative">
          <div className="relative group/search ml-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-hover/search:text-white transition-colors" />
            <input 
              type="text" 
              placeholder={t('nav.search')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full py-2.5 pl-12 pr-6 text-sm font-medium focus:ring-2 focus:ring-cyan-400 outline-none w-56 focus:w-80 transition-all duration-300 focus:bg-white/10 focus:shadow-[0_0_20px_rgba(34,211,238,0.2)] placeholder-gray-500"
            />
          </div>
          <a href="#about" className="relative hover:text-white transition-colors group/nav drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
             {t('nav.features')}
             <span className="absolute -bottom-1.5 left-0 w-0 h-[3px] bg-cyan-400 group-hover/nav:w-full transition-all duration-300 shadow-[0_0_12px_rgba(34,211,238,0.9)] rounded-full"></span>
          </a>
          <a href="#process" className="relative hover:text-white transition-colors group/nav drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
             {t('nav.howItWorks')}
             <span className="absolute -bottom-1.5 left-0 w-0 h-[3px] bg-cyan-400 group-hover/nav:w-full transition-all duration-300 shadow-[0_0_12px_rgba(34,211,238,0.9)] rounded-full"></span>
          </a>
          <a href="#analyzer" className="relative hover:text-white transition-colors group/nav text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
             {t('nav.analyzer')}
             <span className="absolute -bottom-1.5 left-0 w-0 h-[3px] bg-cyan-400 group-hover/nav:w-full transition-all duration-300 shadow-[0_0_12px_rgba(34,211,238,0.9)] rounded-full"></span>
          </a>
          
          <div className="h-6 w-px bg-white/10 mx-2" />

          <div className="relative">
             <button 
               onClick={() => setShowHelp(!showHelp)}
               className={cn("flex items-center gap-2.5 hover:text-white transition-colors group/help drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]", showHelp && "text-white")}
             >
               <HelpCircle className="w-5 h-5 group-hover/help:rotate-12 transition-transform" />
               <span className="relative">
                 {t('nav.help')}
                 <span className={cn("absolute -bottom-1.5 left-0 w-0 h-[3px] bg-cyan-400 transition-all duration-300 shadow-[0_0_12px_rgba(34,211,238,0.9)] rounded-full", showHelp && "w-full")}></span>
               </span>
             </button>
             <AnimatePresence>
                {showHelp && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-6 w-72 backdrop-blur-3xl bg-gray-900/80 rounded-2xl p-5 border border-white/10 z-50 shadow-[0_20px_60px_rgba(0,0,0,0.8)] ring-1 ring-white/5"
                  >
                     <div className="space-y-3">
                        <button 
                          onClick={() => { startTour(); setShowHelp(false); }}
                          className="w-full text-left p-4 rounded-xl hover:bg-white/10 transition-all text-base font-bold flex items-center gap-4 group"
                        >
                           <div className="bg-yellow-500/10 p-2 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
                             <Zap className="w-5 h-5 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
                           </div>
                           <span className="group-hover:text-white transition-colors">{t('hero.cta')}</span>
                        </button>
                        <a 
                          href="#faq" 
                          onClick={() => setShowHelp(false)}
                          className="w-full text-left p-4 rounded-xl hover:bg-white/10 transition-all text-base font-bold flex items-center gap-4 group"
                        >
                           <div className="bg-white/5 p-2 rounded-lg group-hover:bg-white/10 transition-colors">
                             <MessageSquare className="w-5 h-5 text-gray-300" />
                           </div>
                           <span className="group-hover:text-white transition-colors">{t('faq.title')}</span>
                        </a>
                     </div>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>

          <LanguageSwitcher />

          <button 
            onClick={() => {
              setResult(null);
              setActiveTab('history');
            }}
            className="flex items-center gap-2.5 hover:text-white transition-colors group/history relative ml-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] px-5 py-2.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10"
          >
            <History className="w-5 h-5 group-hover/history:-rotate-45 transition-transform duration-300" />
            {t('nav.history')}
          </button>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-48 pb-40 px-6 overflow-hidden min-h-[90vh] flex flex-col justify-center border-b border-white/5">
          <div className="absolute inset-0 opacity-50 z-0">
            <BackgroundMesh />
          </div>
          <div className="hero-glow opacity-60" />
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-semibold text-gray-300 mb-10 animate-float hover:border-cyan-400/50 hover:bg-cyan-400/10 cursor-default transition-all duration-500 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                </span>
                Trusted by 50,000+ Verified Professionals
              </div>
              <h2 className="text-6xl md:text-[5.5rem] font-black tracking-tighter mb-8 leading-[1.05] drop-shadow-[0_0_30px_rgba(255,255,255,0.15)] max-w-4xl mx-auto">
                Align your resume <br className="hidden md:block" />
                <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
                   <Typewriter words={['with precision.', 'for ATS systems.', 'to land interviews.', 'to stand out.']} delay={100} pause={2500} />
                </span>
              </h2>
              <p className="text-lg md:text-2xl text-gray-400 max-w-3xl mx-auto mb-14 font-medium leading-relaxed group">
                Stop guessing what recruiters want. Our industry-leading AI analyzes your resume against any job description to reveal exactly how to <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all">secure the offer.</span>
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <a 
                  href="#analyzer" 
                  className="group relative px-8 py-4 bg-white text-black font-extrabold rounded-full overflow-hidden hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] hover:border-transparent flex items-center gap-3"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <span className="relative z-10 flex items-center gap-2">
                     Start Analyzing Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </a>
                <a 
                  href="#about" 
                  className="px-8 py-4 rounded-full border border-white/10 text-gray-300 hover:text-white font-semibold transition-all duration-300 hover:bg-white/5 flex items-center gap-2 hover:border-white/30 backdrop-blur-sm group hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                >
                  Explore Premium Features <ChevronRight className="w-4 h-4 group-hover:translate-x-1 group-hover:text-cyan-400 transition-all" />
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Dashboard / Analytics Section */}
        <section className="py-20 border-y border-white/5 bg-gray-900/10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: t('stats.resumes'), value: "50,000+" },
                { label: t('stats.scoreGain'), value: "42%" },
                { label: t('stats.interviewRate'), value: "3.5x" },
                { label: t('stats.timeSaved'), value: "15min" }
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  className="text-center group relative p-8 glass rounded-3xl border-white/5 hover:-translate-y-2 hover:border-cyan-400/20 hover:shadow-[0_0_40px_rgba(34,211,238,0.1)] transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10 text-4xl md:text-5xl font-black text-white mb-3 tracking-tighter group-hover:text-cyan-300 group-hover:drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] transition-all">{stat.value}</div>
                  <div className="relative z-10 text-xs text-gray-400 font-bold uppercase tracking-[0.2em] group-hover:text-white transition-all">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
              <div className="max-w-2xl">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{t('features.title')}</h2>
                <p className="text-gray-400 text-lg">{t('features.subtitle')}</p>
              </div>
              <div className="hidden md:block">
                <Sparkles className="w-12 h-12 text-white/20" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                title={t('features.card1.title')} 
                desc={t('features.card1.desc')}
                delay={0.1}
              />
              <FeatureCard 
                title={t('features.card2.title')} 
                desc={t('features.card2.desc')}
                delay={0.2}
              />
              <FeatureCard 
                title={t('features.card3.title')} 
                desc={t('features.card3.desc')}
                delay={0.3}
              />
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section id="process" className="py-32 px-6 border-y border-white/5 bg-gray-900/5">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-4xl font-bold tracking-tight mb-12" dangerouslySetInnerHTML={{ __html: t('process.title') }} />
                <div className="space-y-12">
                  <ProcessStep 
                    number="01" 
                    title={t('process.step1.title')} 
                    desc={t('process.step1.desc')} 
                    delay={0.1}
                  />
                  <ProcessStep 
                    number="02" 
                    title={t('process.step2.title')} 
                    desc={t('process.step2.desc')} 
                    delay={0.2}
                  />
                  <ProcessStep 
                    number="03" 
                    title={t('process.step3.title')} 
                    desc={t('process.step3.desc')} 
                    delay={0.3}
                  />
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square glass rounded-3xl p-8 flex items-center justify-center animate-float">
                  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center">
                    <Sparkles className="w-24 h-24 text-white opacity-20" />
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 glass rounded-2xl animate-pulse delay-700" />
                <div className="absolute -top-6 -left-6 w-24 h-24 glass rounded-full animate-pulse capitalize" />
              </div>
            </div>
          </div>
        </section>

        {/* Analyzer Section */}
        <section id="analyzer" className="py-20 px-6 max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-[40px] p-8 md:p-16 border-white/5 relative overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
              {/* Job Description Input */}
              <div id="analyzer-job">
                <Tooltip content={t('analyzer.jobLabel')}>
                  <InputArea
                    label={t('analyzer.jobLabel')}
                    icon={Briefcase}
                    text={jobText}
                    onTextChange={setJobText}
                    file={jobFile}
                    onFileSelect={setJobFile}
                    isAnalyzing={isAnalyzing}
                    accept={{ 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'] }}
                    tooltip={t('analyzer.pasteJob')}
                    undo={undoJobText}
                    redo={redoJobText}
                    canUndo={canUndoJobText}
                    canRedo={canRedoJobText}
                  />
                </Tooltip>
              </div>

              {/* Resume Input */}
              <div id="analyzer-resume">
                <Tooltip content={t('analyzer.resumeLabel')}>
                  <InputArea
                    label={t('analyzer.resumeLabel')}
                    icon={FileText}
                    text={resumeText}
                    onTextChange={setResumeText}
                    file={resumeFile}
                    onFileSelect={setResumeFile}
                    isAnalyzing={isAnalyzing}
                    accept={{ 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'] }}
                    tooltip={t('analyzer.pasteResume')}
                    undo={undoResumeText}
                    redo={redoResumeText}
                    canUndo={canUndoResumeText}
                    canRedo={canRedoResumeText}
                  />
                </Tooltip>
              </div>
            </div>

            <div className="mt-12 flex flex-col items-center gap-6 relative z-10">
              {/* Error Message */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 backdrop-blur-md"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error.message || 'Analysis failed. Please try again.'}</p>
                </motion.div>
              )}

              <ShimmerButton
                id="analyze-button"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className={cn(
                  "min-w-[280px] text-lg py-5 rounded-[24px]",
                  isAnalyzing && "opacity-50 cursor-not-allowed"
                )}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>{loaderStatus || t('analyzer.loading')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    <span>{t('analyzer.button')}</span>
                  </>
                )}
              </ShimmerButton>
            </div>
          </motion.div>
        </section>

          {/* Results Section */}
          <section id="results" className="py-20 px-6 max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
            {isAnalyzing && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                className="bg-gray-900/30 rounded-3xl border border-gray-800 p-12 flex flex-col items-center justify-center min-h-[400px]"
              >
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-gray-800 rounded-full"></div>
                  <div className="w-24 h-24 border-4 border-white border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                  <Sparkles className="w-8 h-8 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                  <h3 className="text-2xl font-bold text-white mt-8 mb-4 tracking-tight">
                    {loaderStatus || t('analyzer.loading')}
                  </h3>
                  <p className="text-gray-400 text-center max-w-sm">
                    {t('analyzer.progress.desc')}
                  </p>
                  
                  <div className="w-full max-w-md mt-10 space-y-2">
                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-gray-500">
                      <span>{t('analyzer.progress.label')}</span>
                      <span>{Math.round((loaderStatus.length * 5) % 100)}%</span>
                    </div>
                    <div className="bg-gray-800 rounded-full h-1 overflow-hidden">
                      <motion.div 
                        className="bg-white h-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 15, ease: "linear" }}
                      />
                    </div>
                  </div>
                </motion.div>
            )}

            {result && !isAnalyzing && (
              <motion.div 
                key="results"
                id="results-section"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-3xl overflow-hidden"
              >
                {/* Result Header */}
                <div className="p-8 md:p-12 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 bg-white/2">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-white mb-4">{t('results.title')}</h2>
                    <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
                       <HighlightText text={result.summary} query={searchQuery} />
                    </p>
                  </div>
                  <div className="shrink-0 text-center glass p-8 rounded-full shadow-[0_0_50px_rgba(255,255,255,0.05)]">
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-800" />
                        <motion.circle 
                          cx="64" cy="64" r="56" 
                          stroke="currentColor" 
                          strokeWidth="8" 
                          fill="transparent" 
                          strokeDasharray={351.8} 
                          initial={{ strokeDashoffset: 351.8 }}
                          animate={{ strokeDashoffset: 351.8 - (351.8 * result.overallScore) / 100 }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className={cn(
                            result.overallScore >= 80 ? "text-white" : result.overallScore >= 60 ? "text-gray-400" : "text-gray-600"
                          )} 
                        />
                      </svg>
                      <span className="absolute text-4xl font-bold text-white">{result.overallScore}%</span>
                    </div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-widest mt-4">
                       {t('results.score.overall')}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5 px-4 md:px-8 overflow-x-auto hide-scrollbar bg-white/2 relative">
                  <button 
                    onClick={() => setActiveTab('overview')}
                    className={cn("relative px-6 py-5 text-sm font-semibold transition-all whitespace-nowrap overflow-hidden group/tab", activeTab === 'overview' ? "text-cyan-300" : "text-gray-500 hover:text-gray-300")}
                  >
                    {activeTab === 'overview' && <motion.div layoutId="activetab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)]" />}
                    Overview
                  </button>
                  <button 
                    onClick={() => setActiveTab('skills')}
                    className={cn("relative px-6 py-5 text-sm font-semibold transition-all whitespace-nowrap overflow-hidden group/tab", activeTab === 'skills' ? "text-cyan-300" : "text-gray-500 hover:text-gray-300")}
                  >
                    {activeTab === 'skills' && <motion.div layoutId="activetab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)]" />}
                    Skills & Gaps
                  </button>
                  <button 
                    onClick={() => setActiveTab('tips')}
                    className={cn("relative px-6 py-5 text-sm font-semibold transition-all whitespace-nowrap overflow-hidden group/tab", activeTab === 'tips' ? "text-cyan-300" : "text-gray-500 hover:text-gray-300")}
                  >
                    {activeTab === 'tips' && <motion.div layoutId="activetab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)]" />}
                    Action Plan
                  </button>
                  <button 
                    onClick={() => setActiveTab('optimize')}
                    className={cn("relative px-6 py-5 text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 group/tab", activeTab === 'optimize' ? "text-yellow-400" : "text-gray-500 hover:text-gray-300")}
                  >
                    {activeTab === 'optimize' && <motion.div layoutId="activetab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,1)]" />}
                    <Zap className={cn("w-3.5 h-3.5", activeTab === 'optimize' || improvementResult ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" : "text-gray-500")} />
                    Optimization
                  </button>
                  <button 
                    onClick={() => setActiveTab('rewrite')}
                    className={cn("relative px-6 py-5 text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 group/tab", activeTab === 'rewrite' ? "text-emerald-400" : "text-gray-500 hover:text-gray-300")}
                  >
                    {activeTab === 'rewrite' && <motion.div layoutId="activetab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)]" />}
                    <Pencil className={cn("w-3.5 h-3.5", activeTab === 'rewrite' || rewriteResult ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "text-gray-500")} />
                    <span>{t('results.rewriteBtn')}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-400/30 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">NEW</span>
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-8 md:p-12">
                  <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                    <motion.div 
                      key="overview"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-12"
                    >
                          <div className="flex flex-col lg:flex-row gap-12 items-center">
                            <motion.div 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.2 }}
                              className="shrink-0 w-full lg:w-1/3 flex flex-col items-center gap-8"
                            >
                               <div className="relative">
                                  <CircularProgress 
                                    value={result.overallScore} 
                                    label="Match Score" 
                                    icon={Sparkles} 
                                  />
                               </div>
                               <div className="flex justify-center gap-6">
                                  <CircularProgress value={result.sectionScores.skills} label="Skills" icon={Zap} delay={0.2} />
                                  <CircularProgress value={result.sectionScores.experience} label="Exp" icon={Briefcase} delay={0.4} />
                                  <CircularProgress value={result.sectionScores.education} label="Edu" icon={FileText} delay={0.6} />
                               </div>
                            </motion.div>
                            <div className="flex-1 space-y-6">
                          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between">
                            Analysis Summary
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={handleImprove}
                                disabled={isAnalyzing || isImproving || isRewriting}
                                className={cn(
                                  "text-[10px] bg-yellow-500/10 hover:bg-yellow-500/20 px-3 py-1.5 rounded-full border border-yellow-500/20 text-yellow-300 flex items-center gap-2 hover:shadow-[0_0_15px_rgba(250,204,21,0.3)] hover:-translate-y-0.5 transition-all duration-300 font-medium",
                                  (isAnalyzing || isImproving || isRewriting) && "opacity-50 cursor-not-allowed pointer-events-none"
                                )}
                              >
                                <Zap className={cn("w-3 h-3 text-yellow-400", isImproving && "animate-spin")} />
                                {isImproving ? "Optimizing..." : "Improve My Resume"}
                              </button>
                              <button 
                                onClick={handleRewrite}
                                disabled={isAnalyzing || isImproving || isRewriting}
                                className={cn(
                                  "text-[10px] bg-cyan-400 hover:bg-cyan-300 text-black px-3 py-1.5 rounded-full font-bold flex items-center gap-2 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:-translate-y-0.5 transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]",
                                  (isAnalyzing || isImproving || isRewriting) && "opacity-50 cursor-not-allowed pointer-events-none"
                                )}
                              >
                                <Pencil className={cn("w-3 h-3", isRewriting && "animate-bounce")} />
                                {isRewriting ? "Rewriting..." : t('results.rewriteBtn')}
                              </button>
                            </div>
                          </h3>
                          <p className="text-gray-300 text-lg leading-relaxed italic">
                            <HighlightText text={result.summary} query={searchQuery} />
                          </p>
                        </div>
                      </div>

                      <motion.div 
                        variants={{
                          hidden: { opacity: 0 },
                          show: {
                            opacity: 1,
                            transition: {
                              staggerChildren: 0.1
                            }
                          }
                        }}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                      >
                        <motion.div 
                          variants={{
                            hidden: { opacity: 0, y: 20 },
                            show: { opacity: 1, y: 0 }
                          }}
                          className="glass rounded-2xl p-8 bg-white/2 border border-white/5 hover:border-white/20 transition-all duration-300 hover:shadow-[0_0_40px_rgba(56,189,248,0.15)] group hover:-translate-y-1"
                        >
                          <h3 className="text-lg font-semibold text-white flex items-center gap-3 mb-6 group-hover:text-cyan-300 transition-colors">
                            <CheckCircle2 className="w-5 h-5 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.6)] group-hover:drop-shadow-[0_0_12px_rgba(74,222,128,1)] transition-all" />
                            Key Strengths
                          </h3>
                          <ul className="space-y-4">
                            {result.strengths.map((strength, i) => (
                              <li key={i} className="text-gray-300 flex items-start gap-4 group/item">
                                <span className="text-green-400 mt-2 w-2 h-2 rounded-full bg-green-400 shrink-0 group-hover/item:scale-150 transition-transform shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                                <span className="leading-relaxed group-hover/item:text-white transition-colors">
                                  <HighlightText text={strength} query={searchQuery} />
                                </span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                        <motion.div 
                          variants={{
                            hidden: { opacity: 0, y: 20 },
                            show: { opacity: 1, y: 0 }
                          }}
                          className="glass rounded-2xl p-8 bg-white/2 border border-white/5 hover:border-white/20 transition-all duration-300 hover:shadow-[0_0_40px_rgba(248,113,113,0.15)] group hover:-translate-y-1"
                        >
                          <h3 className="text-lg font-semibold text-white flex items-center gap-3 mb-6 group-hover:text-red-300 transition-colors">
                            <AlertCircle className="w-5 h-5 text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.6)] group-hover:drop-shadow-[0_0_12px_rgba(248,113,113,1)] transition-all" />
                            Areas of Concern
                          </h3>
                          <ul className="space-y-4">
                            {result.gaps.map((gap, i) => (
                              <li key={i} className="text-gray-300 flex items-start gap-4 group/item">
                                <span className="text-red-500 mt-2 w-2 h-2 rounded-full bg-red-500 shrink-0 group-hover/item:scale-150 transition-transform shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                <span className="leading-relaxed group-hover/item:text-white transition-colors">
                                  <HighlightText text={gap} query={searchQuery} />
                                </span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  )}

                  {activeTab === 'skills' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                      <div className="glass p-8 rounded-3xl border border-white/5 bg-white/2 hover:border-white/20 transition-all duration-500 hover:shadow-[0_0_40px_rgba(74,222,128,0.1)] group">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-8 group-hover:text-green-300 transition-colors">
                          <CheckCircle2 className="w-6 h-6 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.6)] group-hover:drop-shadow-[0_0_12px_rgba(74,222,128,1)] transition-all" />
                          Acquired Skills
                        </h3>
                        <div className="flex flex-wrap gap-4">
                          {result.matchingSkills.length > 0 ? result.matchingSkills.map((skill, i) => (
                            <div key={i}>
                              <Tooltip content={`Great job! "${skill}" perfectly matches the job description.`}>
                                <motion.span 
                                  whileHover={{ scale: 1.05, y: -2 }}
                                  className="px-5 py-2.5 bg-green-500/10 border border-green-500/20 text-green-300 text-sm rounded-full font-medium hover:bg-green-500/20 hover:border-green-400 hover:shadow-[0_0_15px_rgba(74,222,128,0.4)] transition-all cursor-default inline-block backdrop-blur-sm"
                                >
                                  {skill}
                                </motion.span>
                              </Tooltip>
                            </div>
                          )) : (
                            <p className="text-gray-500 italic">No matching skills found.</p>
                          )}
                        </div>
                      </div>

                      <div className="glass p-8 rounded-3xl border border-white/5 bg-white/2 hover:border-white/20 transition-all duration-500 hover:shadow-[0_0_40px_rgba(248,113,113,0.1)] group">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-8 group-hover:text-red-300 transition-colors">
                          <XCircle className="w-6 h-6 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] group-hover:drop-shadow-[0_0_12px_rgba(239,68,68,1)] transition-all" />
                          Critical Missing Skills
                        </h3>
                        <div className="flex flex-wrap gap-4">
                          {result.missingSkills.length > 0 ? result.missingSkills.map((skill, i) => (
                            <div key={i}>
                              <Tooltip content={`Add "${skill}" to your resume to instantly boost your match score.`}>
                                <motion.span 
                                  whileHover={{ scale: 1.05, y: -2 }}
                                  className="px-5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-full font-medium hover:bg-red-500/20 hover:border-red-400 hover:shadow-[0_0_15px_rgba(248,113,113,0.4)] transition-all cursor-default inline-block backdrop-blur-sm"
                                >
                                  {skill}
                                </motion.span>
                              </Tooltip>
                            </div>
                          )) : (
                            <p className="text-gray-500 italic">No missing skills identified.</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'tips' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-8 group">
                          <Lightbulb className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] group-hover:scale-110 transition-transform" />
                          Role-Specific Action Plan
                        </h3>
                        <div className="space-y-4">
                          {result.improvementTips.map((tip, i) => (
                            <div key={i} className="glass rounded-2xl p-6 flex gap-5 glass-hover bg-white/2 group border-white/5 hover:border-yellow-500/30 hover:shadow-[0_0_30px_rgba(250,204,21,0.15)] transition-all duration-300">
                              <ChevronRight className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5 group-hover:translate-x-1 group-hover:text-yellow-400 transition-all drop-shadow-[0_0_8px_rgba(250,204,21,0)] group-hover:drop-shadow-[0_0_8px_rgba(250,204,21,1)]" />
                              <p className="text-gray-300 leading-relaxed flex-1 group-hover:text-white transition-colors">{tip}</p>
                              <CopyButton text={tip} />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-8 group">
                          <Briefcase className="w-6 h-6 text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)] group-hover:scale-110 transition-transform" />
                          General Resume Polish
                        </h3>
                        <div className="space-y-4">
                          {result.resumeSuggestions.map((suggestion, i) => (
                            <div key={i} className="glass rounded-2xl p-6 flex gap-5 glass-hover bg-white/2 group border-white/5 hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(96,165,250,0.15)] transition-all duration-300">
                              <ChevronRight className="w-6 h-6 text-blue-500 shrink-0 mt-0.5 group-hover:translate-x-1 group-hover:text-blue-400 transition-all drop-shadow-[0_0_8px_rgba(96,165,250,0)] group-hover:drop-shadow-[0_0_8px_rgba(96,165,250,1)]" />
                              <p className="text-gray-300 leading-relaxed flex-1 group-hover:text-white transition-colors">{suggestion}</p>
                              <CopyButton text={suggestion} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {result.templateRecommendations && result.templateRecommendations.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-white flex items-center gap-3 mb-6">
                            <LayoutTemplate className="w-5 h-5 text-gray-400" />
                            Template Recommendations
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {result.templateRecommendations.map((rec, i) => (
                              <div key={i} className="glass rounded-2xl p-6 glass-hover bg-white/2 border-white/5 flex flex-col gap-2 group">
                                <h4 className="text-white font-medium flex items-center justify-between">
                                  {rec.name}
                                  <CopyButton text={`${rec.name}: ${rec.reason}`} />
                                </h4>
                                <p className="text-gray-400 text-sm leading-relaxed">{rec.reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.checklist && result.checklist.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-white flex items-center gap-3 mb-6">
                            <ListChecks className="w-5 h-5 text-gray-400" />
                            Interactive Improvement Checklist
                          </h3>
<div className="space-y-3">
                            {result.checklist.map((item, i) => (
                              <label key={i} className="flex items-start gap-4 p-4 rounded-xl glass bg-white/2 border-white/5 hover:border-white/20 hover:bg-white/5 cursor-pointer transition-all group">
                                <div className="relative flex items-center mt-1">
                                  <input type="checkbox" className="peer sr-only" />
                                  <div className="w-5 h-5 rounded border-2 border-gray-600 peer-checked:bg-white peer-checked:border-white transition-all flex items-center justify-center">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                                <span className="text-gray-300 group-hover:text-white transition-colors leading-relaxed peer-checked:text-gray-500 peer-checked:line-through">{item}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'rewrite' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                      {/* Rewrite Error Display */}
                      {rewriteError && !isRewriting && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-4 p-6 rounded-2xl bg-red-500/10 border border-red-500/20"
                        >
                          <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-red-300 font-bold mb-1">Rewrite Failed</h4>
                            <p className="text-red-200/70 text-sm">{rewriteError}</p>
                          </div>
                          <button
                            onClick={() => { setRewriteError(null); handleRewrite(); }}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-red-500/20 shrink-0"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Retry
                          </button>
                        </motion.div>
                      )}

                      {isRewriting ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-6">
                          <div className="relative">
                            <div className="w-20 h-20 border-4 border-gray-800 rounded-full" />
                            <div className="w-20 h-20 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
                            <Pencil className="w-7 h-7 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                          </div>
                          <h3 className="text-2xl font-bold text-white tracking-tight">Rewriting Your Resume...</h3>
                          <p className="text-gray-500 text-center max-w-sm">Our AI is rewriting, optimizing for ATS, and tailoring every section to the job.</p>
                          <div className="w-full max-w-xs mt-4">
                            <div className="bg-gray-800 rounded-full h-1 overflow-hidden">
                              <motion.div
                                className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 25, ease: "linear" }}
                              />
                            </div>
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-2 text-center">This may take 15-30 seconds</p>
                          </div>
                        </div>
                      ) : rewriteResult ? (
                        <>
                          {/* Header + ATS Score + Download */}
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-white/10">
                            <div>
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <Pencil className="w-6 h-6 text-emerald-400" />
                                <h3 className="text-2xl font-bold text-white">AI-Rewritten Resume</h3>
                                <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-black px-2 py-0.5 rounded-full">ATS Optimized</span>
                                {rewriteResult.atsScore && (
                                  <span className="text-[9px] font-black uppercase tracking-widest bg-cyan-400/20 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-400/30">
                                    ATS Score: {rewriteResult.atsScore}%
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-500 text-sm">Completely rewritten and optimized for this specific job description.</p>
                            </div>
                            <div className="flex gap-3 items-center">
                              <CopyButton text={rewriteResult.fullResumeText} />
                              <button onClick={handleDownloadRewrite} className="btn-premium text-sm px-6 py-3">
                                <Download className="w-4 h-4" />
                                Download .txt
                              </button>
                            </div>
                          </div>

                          {/* Improvements Summary */}
                          {rewriteResult.improvements && rewriteResult.improvements.length > 0 && (
                            <div className="glass rounded-2xl p-6 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 border border-emerald-500/20">
                              <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> What We Improved
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {rewriteResult.improvements.map((imp, i) => (
                                  <div key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                    <span>{imp}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Professional Summary */}
                          <div className="glass rounded-3xl p-8 border-white/10 bg-gradient-to-br from-white/5 to-transparent">
                            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                              <User className="w-4 h-4" /> Professional Summary
                            </h4>
                            <p className="text-white text-lg leading-relaxed border-l-4 border-emerald-500/50 pl-6 italic">
                              {rewriteResult.professionalSummary}
                            </p>
                          </div>

                          {/* Skills with Categories */}
                          <div className="glass rounded-2xl p-8 bg-white/2">
                            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                              <Zap className="w-4 h-4" /> Skills
                            </h4>
                            {rewriteResult.skillCategories && Object.keys(rewriteResult.skillCategories).length > 0 ? (
                              <div className="space-y-5">
                                {Object.entries(rewriteResult.skillCategories).map(([category, skills], i) => (
                                  <div key={i}>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">{category}</p>
                                    <div className="flex flex-wrap gap-2">
                                      {skills.map((skill, j) => (
                                        <span key={j} className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-full">{skill}</span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {rewriteResult.skills.map((skill, i) => (
                                  <span key={i} className="px-4 py-2 bg-white text-black text-xs font-bold rounded-full">{skill}</span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Experience */}
                          {rewriteResult.experience?.length > 0 && (
                            <div className="space-y-6">
                              <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> Experience
                              </h4>
                              {rewriteResult.experience.map((exp, i) => (
                                <div key={i} className="glass rounded-2xl p-8 bg-white/2 border-white/5">
                                  <div className="flex items-start justify-between gap-4 mb-6">
                                    <div>
                                      <h5 className="text-lg font-bold text-white">{exp.role}</h5>
                                      <p className="text-gray-500 text-sm font-medium">{exp.company}</p>
                                    </div>
                                    {exp.duration && (
                                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full border border-white/10 whitespace-nowrap shrink-0">{exp.duration}</span>
                                    )}
                                  </div>
                                  <ul className="space-y-3">
                                    {exp.bullets.map((bullet, j) => (
                                      <li key={j} className="flex items-start gap-3 text-gray-300 text-sm leading-relaxed">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                                        {bullet}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Projects */}
                          {rewriteResult.projects?.length > 0 && (
                            <div className="space-y-6">
                              <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Projects
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {rewriteResult.projects.map((proj, i) => (
                                  <div key={i} className="glass rounded-2xl p-6 bg-white/2 border-white/5 hover:border-emerald-400/20 transition-all duration-300">
                                    <h5 className="font-bold text-white mb-2">{proj.name}</h5>
                                    <p className="text-gray-400 text-sm mb-3 leading-relaxed">{proj.description}</p>
                                    {proj.highlights?.length > 0 && (
                                      <ul className="space-y-1.5 mb-3">
                                        {proj.highlights.map((h, j) => (
                                          <li key={j} className="text-emerald-300/80 text-xs flex items-start gap-2">
                                            <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" /> {h}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                      {proj.technologies.map((tech, j) => (
                                        <span key={j} className="px-2 py-0.5 bg-white/10 text-gray-300 text-[10px] font-bold rounded uppercase tracking-wider">{tech}</span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Education */}
                          {rewriteResult.education?.length > 0 && (
                            <div className="glass rounded-2xl p-8 bg-white/2">
                              <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Education
                              </h4>
                              <ul className="space-y-2">
                                {rewriteResult.education.map((edu, i) => (
                                  <li key={i} className="text-gray-300 flex items-center gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                                    {edu}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* ATS Keywords */}
                          {rewriteResult.atsKeywords?.length > 0 && (
                            <div className="glass rounded-2xl p-8 bg-white/2 border border-emerald-500/20">
                              <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> ATS Keywords Included
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {rewriteResult.atsKeywords.map((kw, i) => (
                                  <span key={i} className="px-3 py-1 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">{kw}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-16 px-8 mx-auto max-w-3xl glass rounded-3xl border border-white/5 hover:border-white/20 transition-all duration-500 hover:bg-white/[0.03] group relative overflow-hidden mt-8 hover:shadow-[0_0_80px_-20px_rgba(56,189,248,0.3)]">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                          
                          <div className="relative inline-flex items-center justify-center w-28 h-28 mb-8 transform group-hover:scale-110 transition-transform duration-500">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50 group-hover:opacity-100" />
                            <div className="absolute inset-0 bg-white/5 rounded-full animate-pulse group-hover:animate-none group-hover:bg-white/10 transition-colors duration-500" />
                            <Pencil className="w-12 h-12 text-white/30 group-hover:text-cyan-300 drop-shadow-[0_0_15px_rgba(56,189,248,0)] group-hover:drop-shadow-[0_0_15px_rgba(56,189,248,0.8)] transition-all duration-500" />
                          </div>
                          
                          <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-cyan-300 transition-all duration-500">
                            Rewrite Entire Resume with AI
                          </h3>
                          
                          <p className="text-gray-500 max-w-md mx-auto mb-10 leading-relaxed group-hover:text-gray-300 transition-colors duration-500 relative z-10">
                            Our AI will completely rewrite your resume — tailored perfectly to this job, ATS-optimized, and ready to download.
                          </p>
                          
                          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                            <button 
                              onClick={handleRewrite}
                              disabled={isRewriting}
                              className="btn-premium px-12 py-5 text-lg hover:scale-105 transition-all duration-300 hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] group/btn flex items-center gap-3 justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                              {isRewriting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Pencil className="w-5 h-5 group-hover/btn:animate-bounce" />
                              )}
                              {isRewriting ? "Rewriting..." : "Rewrite My Resume"}
                            </button>
                          </div>
                          
                          <p className="relative z-10 text-[10px] text-gray-700 uppercase tracking-widest mt-10 group-hover:text-blue-400/80 transition-colors duration-500">
                            Powered by Gemini AI • 100% ATS Friendly
                          </p>
                        </div>                      )}
                    </motion.div>
                  )}

                  {/* Success Toast Popup */}
                  <AnimatePresence>
                    {showRewriteSuccess && rewriteResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-8 right-8 z-50 max-w-md"
                      >
                        <div className="glass-lg rounded-2xl p-6 border border-emerald-500/30 bg-gray-900/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(52,211,153,0.15)]">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-bold text-base mb-1">Resume Rewritten Successfully!</h4>
                              <p className="text-gray-400 text-sm mb-4">Your ATS-optimized resume is ready. Download it now.</p>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={handleDownloadRewrite}
                                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-sm transition-all hover:scale-105 flex items-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                                >
                                  <Download className="w-4 h-4" />
                                  Download Resume
                                </button>
                                <button
                                  onClick={() => setShowRewriteSuccess(false)}
                                  className="px-4 py-2.5 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                                >
                                  Dismiss
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={() => setShowRewriteSuccess(false)}
                              className="text-gray-600 hover:text-white transition-colors p-1 shrink-0"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {activeTab === 'optimize' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                       {isImproving ? (
                          <div className="flex flex-col items-center justify-center py-20 gap-6">
                             <Loader2 className="w-10 h-10 text-white animate-spin" />
                             <p className="text-gray-400 font-medium">Generating professional upgrades...</p>
                          </div>
                       ) : improvementResult ? (
                          <>
                             <div className="glass rounded-3xl p-10 border-white/10 bg-gradient-to-br from-white/5 to-transparent">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                   <Sparkles className="w-6 h-6 text-yellow-500" />
                                   Optimized Summary
                                </h3>
                                <p className="text-gray-300 text-xl leading-relaxed italic border-l-4 border-white/20 pl-8 py-2">
                                   {improvementResult.improvedSummary}
                                </p>
                                <div className="mt-8 flex justify-end">
                                   <CopyButton text={improvementResult.improvedSummary} />
                                </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="glass rounded-2xl p-8 bg-white/2">
                                   <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
                                      <Target className="w-5 h-5 text-white" />
                                      Key Skills to Acquire
                                   </h3>
                                   <div className="flex flex-wrap gap-3">
                                      {improvementResult.suggestedSkills.map((skill, i) => (
                                         <span key={i} className="px-4 py-2 glass border-white/10 text-white text-sm rounded-full font-medium">
                                            {skill}
                                         </span>
                                      ))}
                                   </div>
                                </div>
                                <div className="glass rounded-2xl p-8 bg-white/2">
                                   <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
                                      <Pencil className="w-5 h-5 text-white" />
                                      Impact-Focused Rephrasing
                                   </h3>
                                   <ul className="space-y-4">
                                      {improvementResult.wordingTips.map((tip, i) => (
                                         <li key={i} className="text-gray-400 flex items-start gap-4 p-4 rounded-xl bg-white/2 border border-white/5">
                                            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold shrink-0">{i+1}</div>
                                            <span className="leading-relaxed text-sm">{tip}</span>
                                         </li>
                                      ))}
                                   </ul>
                                </div>
                             </div>
                          </>
                       ) : (
                          <div className="text-center py-20">
                             <Zap className="w-12 h-12 text-gray-800 mx-auto mb-6" />
                             <h3 className="text-xl font-bold text-white mb-4">Unlock Professional Optimization</h3>
                             <p className="text-gray-500 max-w-md mx-auto mb-8">
                                Let our AI rewrite your summary and suggest role-specific enhancements based on the target job profile.
                             </p>
                             <button 
                                onClick={handleAnalyze}
                                className="btn-premium"
                             >
                                <Sparkles className="w-5 h-5" />
                                Optimize Now
                             </button>
                          </div>
                       )}
                    </motion.div>
                  )}
                  </AnimatePresence>
                </div>

                {/* Download Buttons */}
                <div className="p-8 border-t border-white/5 flex flex-wrap justify-center gap-4 bg-white/2">
                  <button
                    onClick={handleDownloadTips}
                    className="flex items-center gap-2 px-6 py-3 glass hover:bg-white/5 text-white font-semibold rounded-full transition-all border-white/10"
                    title="Download improvement tips and resume suggestions as a text file"
                  >
                    <Download className="w-5 h-5" />
                    Download Tips & Suggestions
                  </button>
                  <button
                    onClick={handleDownload}
                    className="btn-premium"
                    title="Download the complete analysis and action plan as a text file"
                  >
                    <Download className="w-5 h-5" />
                    Download Action Plan
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-32 px-6 border-t border-white/5">
           <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                 <h2 className="text-4xl font-bold tracking-tight mb-4">{t('faq.title')}</h2>
                 <p className="text-gray-500">{t('faq.subtitle')}</p>
              </div>
              <div className="glass rounded-3xl p-8 md:p-12">
                 {[
                    { q: t('faq.dataSafe.q'), a: t('faq.dataSafe.a') },
                    { q: t('faq.accuracy.q'), a: t('faq.accuracy.a') },
                    { q: t('faq.formats.q'), a: t('faq.formats.a') },
                    { q: t('faq.improve.q'), a: t('faq.improve.a') },
                    { q: t('faq.industries.q'), a: t('faq.industries.a') }
                 ].map((item, i) => (
                    <div key={i}>
                       <FAQItem 
                         question={item.q} 
                         answer={item.a} 
                         isOpen={activeFAQ === i} 
                         onClick={() => setActiveFAQ(activeFAQ === i ? null : i)}
                       />
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* History Tab (Conditional Overlay) */}
        <AnimatePresence>
           {activeTab === 'history' && (
              <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
              >
                 <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="w-full max-w-2xl glass rounded-3xl overflow-hidden shadow-2xl"
                 >
                    <div className="p-8 border-b border-white/10 flex justify-between items-center">
                       <h3 className="text-xl font-bold flex items-center gap-3">
                          <History className="w-5 h-5 text-gray-400" />
                          Recent Analyses
                       </h3>
                       <button onClick={() => setActiveTab('overview')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                          <XCircle className="w-6 h-6 text-gray-500" />
                       </button>
                    </div>
                    <div className="p-4 max-h-[60vh] overflow-y-auto">
                       {history.length > 0 ? history.map((item) => (
                          <button 
                             key={item.id}
                             onClick={() => {
                                setResult(item.result);
                                setActiveTab('overview');
                             }}
                             className="w-full text-left p-4 rounded-xl hover:bg-white/5 transition-all flex items-center justify-between group border border-transparent hover:border-white/10"
                          >
                             <div>
                                <p className="text-white font-medium group-hover:text-white transition-colors">{item.jobTitle}</p>
                                <p className="text-xs text-gray-600">{item.date}</p>
                             </div>
                             <div className="flex items-center gap-4">
                                <div className="text-sm font-bold text-white">{item.result.overallScore}%</div>
                                <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-white transition-transform group-hover:translate-x-1" />
                             </div>
                          </button>
                       )) : (
                          <div className="py-20 text-center text-gray-600">
                             <History className="w-12 h-12 mx-auto mb-4 opacity-10" />
                             <p>No analysis history yet.</p>
                          </div>
                       )}
                    </div>
                    <div className="p-6 bg-white/2 text-center">
                        <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">History is saved locally on your device</p>
                    </div>
                 </motion.div>
              </motion.div>
           )}
        </AnimatePresence>

        {/* Contact Section */}
        <section id="contact" className="py-32 px-6 bg-gradient-to-t from-gray-950 to-black">
           <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                 <div>
                    <h2 className="text-5xl font-bold tracking-tighter mb-8 italic" dangerouslySetInnerHTML={{ __html: t('contact.title') }} />
                    <p className="text-gray-400 text-lg mb-12 max-w-md">
                       {t('contact.subtitle')}
                    </p>
                    <div className="flex flex-col gap-5 w-full max-w-sm">
                       <a href="mailto:moyih50210@gmail.com" className="flex items-center gap-4 group cursor-pointer w-full bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all duration-300 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <div className="w-12 h-12 rounded-full bg-black/50 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:border-cyan-400/50 z-10 shrink-0">
                             <Mail className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                          </div>
                          <div className="z-10 flex-1 overflow-hidden">
                             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider group-hover:text-cyan-400 transition-colors mb-0.5">{t('contact.emailLabel')}</p>
                             <p className="text-white font-medium group-hover:text-cyan-300 transition-colors text-sm truncate">moyih50210@gmail.com</p>
                          </div>
                          <div className="z-10 bg-white/5 p-2 rounded-full group-hover:bg-cyan-400/20 transition-all opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0">
                              <ArrowRight className="w-4 h-4 text-cyan-400" />
                          </div>
                       </a>
                       <a href="tel:03365026229" className="flex items-center gap-4 group cursor-pointer w-full bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all duration-300 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <div className="w-12 h-12 rounded-full bg-black/50 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:border-cyan-400/50 z-10 shrink-0">
                             <Phone className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                          </div>
                          <div className="z-10 flex-1 overflow-hidden">
                             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider group-hover:text-cyan-400 transition-colors mb-0.5">{t('contact.phoneLabel')}</p>
                             <p className="text-white font-medium group-hover:text-cyan-300 transition-colors text-sm truncate">03365026229</p>
                          </div>
                          <div className="z-10 bg-white/5 p-2 rounded-full group-hover:bg-cyan-400/20 transition-all opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0">
                              <ArrowRight className="w-4 h-4 text-cyan-400" />
                          </div>
                       </a>
                       <a href="https://www.linkedin.com/in/muhammad-talha-6278463a1" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group cursor-pointer w-full bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all duration-300 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <div className="w-12 h-12 rounded-full bg-black/50 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:border-cyan-400/50 z-10 shrink-0">
                             <Globe className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                          </div>
                          <div className="z-10 flex-1 overflow-hidden">
                             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider group-hover:text-cyan-400 transition-colors mb-0.5">{t('contact.linkedinLabel')}</p>
                             <p className="text-white font-medium group-hover:text-cyan-300 transition-colors text-sm truncate">muhammad-talha-6278463a1</p>
                          </div>
                          <div className="z-10 bg-white/5 p-2 rounded-full group-hover:bg-cyan-400/20 transition-all opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0">
                              <ArrowRight className="w-4 h-4 text-cyan-400" />
                          </div>
                       </a>
                    </div>
                 </div>

                 <div className="glass rounded-3xl p-8 md:p-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                    <ContactForm />
                 </div>
              </div>
           </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black py-20 mt-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-white" />
                <span className="text-2xl font-bold tracking-tighter">MatchAI</span>
              </div>
              <p className="text-gray-500 text-sm max-w-xs text-center md:text-left">
                {t('footer.tagline')}
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-12 text-sm font-medium text-gray-500">
              <div className="flex flex-col gap-4">
                <span className="text-white font-bold uppercase tracking-widest text-xs">{t('results.overview')}</span>
                <a href="#analyzer" className="relative hover:text-cyan-300 transition-colors group/link w-fit">
                   {t('nav.analyzer')}
                   <span className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 group-hover/link:w-full transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span>
                </a>
                <a href="#about" className="relative hover:text-cyan-300 transition-colors group/link w-fit">
                   {t('nav.features')}
                   <span className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 group-hover/link:w-full transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span>
                </a>
                <a href="#process" className="relative hover:text-cyan-300 transition-colors group/link w-fit">
                   {t('nav.howItWorks')}
                   <span className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 group-hover/link:w-full transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span>
                </a>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-white font-bold uppercase tracking-widest text-xs">Community</span>
                <a href="#" className="relative hover:text-cyan-300 transition-colors group/link w-fit">
                   Twitter
                   <span className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 group-hover/link:w-full transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span>
                </a>
                <a href="#" className="relative hover:text-cyan-300 transition-colors group/link w-fit">
                   LinkedIn
                   <span className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 group-hover/link:w-full transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span>
                </a>
                <a href="#" className="relative hover:text-cyan-300 transition-colors group/link w-fit">
                   GitHub
                   <span className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 group-hover/link:w-full transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-gray-600 font-medium">
            <p>{t('footer.copy')}</p>
            <div className="flex items-center gap-8">
              <a href="#" className="hover:text-cyan-300 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-cyan-300 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-cyan-300 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <I18nProvider>
       <OnboardingProvider>
          <App />
          <Spotlight />
       </OnboardingProvider>
    </I18nProvider>
  );
}
