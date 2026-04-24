import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface OnboardingContextType {
  isActive: boolean;
  currentStep: number;
  startTour: () => void;
  nextStep: () => void;
  skipTour: () => void;
  totalSteps: number;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 4; // Welcome -> Step 1 (JD) -> Step 2 (Resume) -> Step 3 (Analyze)

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('matchai_tour_seen');
    if (!hasSeenTour) {
      setIsActive(true);
    }
  }, []);

  const startTour = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishTour();
    }
  };

  const skipTour = () => {
    finishTour();
  };

  const finishTour = () => {
    setIsActive(false);
    localStorage.setItem('matchai_tour_seen', 'true');
  };

  return (
    <OnboardingContext.Provider value={{ isActive, currentStep, startTour, nextStep, skipTour, totalSteps }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used within an OnboardingProvider');
  return context;
}
