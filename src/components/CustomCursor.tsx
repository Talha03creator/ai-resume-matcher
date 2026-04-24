import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export function CustomCursor() {
  const [isDesktop, setIsDesktop] = useState(false);

  // Use motion values for better performance (bypasses React renders)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Add smooth spring physics
  const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Only enable on non-touch devices
    if (window.matchMedia("(pointer: fine)").matches) {
      setIsDesktop(true);
    }

    const updateMouseObj = (e: MouseEvent) => {
      mouseX.set(e.clientX - 16); // Center the 32x32 cursor
      mouseY.set(e.clientY - 16);
    };

    if (isDesktop) {
      window.addEventListener('mousemove', updateMouseObj);
    }

    return () => {
      window.removeEventListener('mousemove', updateMouseObj);
    };
  }, [isDesktop, mouseX, mouseY]);

  if (!isDesktop) return null;

  return (
    <motion.div
      style={{
        translateX: cursorX,
        translateY: cursorY,
        position: 'fixed',
        left: 0,
        top: 0,
        width: '32px',
        height: '32px',
        pointerEvents: 'none',
        zIndex: 9999,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56,189,248,0.8) 0%, rgba(139,92,246,0.3) 50%, rgba(0,0,0,0) 80%)',
        boxShadow: '0 0 20px 5px rgba(56,189,248,0.2)',
        mixBlendMode: 'screen'
      }}
    />
  );
}
