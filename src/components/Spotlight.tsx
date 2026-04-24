import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useOnboarding } from '../context/OnboardingContext';
import { useI18n } from '../context/I18nContext';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';

export function Spotlight() {
  const { isActive, currentStep, nextStep, skipTour, totalSteps } = useOnboarding();
  const { t, isRTL } = useI18n();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const stepIds = [
    'hero-section', 
    'analyzer-job', 
    'analyzer-resume', 
    'analyze-button'
  ];

  useEffect(() => {
    if (isActive) {
      const element = document.getElementById(stepIds[currentStep]);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTargetRect(element.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    }
  }, [isActive, currentStep]);

  if (!isActive || !targetRect) return null;

  return (
    <div className="fixed inset-0 z-[2000] pointer-events-none">
      {/* Mask and Highlight */}
      <motion.div 
        className="absolute inset-0 bg-black/80 shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.7)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div 
          className="absolute bg-transparent rounded-2xl ring-[4px] ring-white/50 ring-offset-4 ring-offset-black/50"
          initial={false}
          animate={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        />
      </motion.div>

      {/* Info Card */}
      <motion.div
        className="onboarding-card glass max-w-sm rounded-3xl p-8 border-white/20 shadow-2xl pointer-events-auto"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          top: targetRect.bottom + 24 > window.innerHeight - 300 ? 'auto' : targetRect.bottom + 24,
          bottom: targetRect.bottom + 24 > window.innerHeight - 300 ? 50 : 'auto',
          left: Math.max(20, Math.min(window.innerWidth - 380, targetRect.left)),
        }}
      >
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-bold text-white">
            {t(`tour.step${currentStep || 'welcome'}.title`)}
          </h3>
          <button onClick={skipTour} className="p-1 text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          {t(`tour.step${currentStep || 'welcome'}.desc`)}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {stepIds.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-2 h-1.5 rounded-full transition-all",
                  i === currentStep ? "w-6 bg-white" : "bg-white/20"
                )} 
              />
            ))}
          </div>
          
          <div className="flex gap-3">
             <button 
               onClick={skipTour}
               className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
             >
               {t('tour.skip')}
             </button>
             <button 
               onClick={nextStep}
               className="px-6 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-gray-200 transition-all flex items-center gap-2"
             >
               {currentStep === stepIds.length - 1 ? t('tour.finish') : t('tour.next')}
               <ChevronRight className={cn("w-4 h-4", isRTL && "rotate-180")} />
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
