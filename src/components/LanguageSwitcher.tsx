import React from 'react';
import { useI18n } from '../context/I18nContext';
import { Languages } from 'lucide-react';
import { cn } from '../lib/utils';

export function LanguageSwitcher() {
  const { lang, setLang, isRTL } = useI18n();

  return (
    <div className="flex items-center gap-3 p-1.5 bg-white/5 rounded-full border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:border-white/20 transition-all">
      <button
        onClick={() => setLang('en')}
        className={cn(
          "px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300",
          lang === 'en' ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.6)]" : "text-gray-400 hover:text-white hover:bg-white/5"
        )}
      >
        EN
      </button>
      <button
        onClick={() => setLang('ur')}
        className={cn(
          "px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300",
          lang === 'ur' ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.6)]" : "text-gray-400 hover:text-white hover:bg-white/5"
        )}
      >
        اردو
      </button>
    </div>
  );
}
