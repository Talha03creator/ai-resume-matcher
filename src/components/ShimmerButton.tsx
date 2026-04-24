import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      children,
      className,
      shimmerColor = "#ffffff",
      shimmerSize = "0.05em",
      borderRadius = "100px",
      shimmerDuration = "3s",
      ...props
    },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        whileHover={!props.disabled ? { scale: 1.05 } : {}}
        whileTap={!props.disabled ? { scale: 0.95 } : {}}
        className={cn(
          "group relative flex items-center justify-center overflow-hidden border border-white/10 bg-white px-8 py-4 font-bold text-black transition-all duration-500 hover:shadow-[0_0_40px_rgba(34,211,238,0.4)]",
          props.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          className,
        )}
        style={{
          borderRadius: borderRadius,
        }}
        {...props}
      >
        {/* Shimmer Effect */}
        <div
          className="absolute inset-0 -z-10 animate-shimmer"
          style={{
            background: `linear-gradient(90deg, transparent, ${shimmerColor}20, transparent)`,
            backgroundSize: "200% 100%",
          }}
        />
        
        {/* Hover Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-blue-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <span className="relative z-10 flex items-center gap-2 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] transition-all">
          {children}
        </span>
      </motion.button>
    );
  },
);

ShimmerButton.displayName = "ShimmerButton";
