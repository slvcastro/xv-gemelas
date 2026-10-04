"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export const DecorativeElements = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Gold Dust / Splatters */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'radial-gradient(#D8C477 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse at center, transparent 30%, black 70%)'
      }}></div>

      {/* Top Right Florals / Glow */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-steel/20 rounded-full blur-[100px]"></div>
      
      {/* Bottom Left Glow */}
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-dark/50 rounded-full blur-[100px]"></div>

      {/* Floating Sparkles (Destellos dorados) */}
      <motion.div 
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-10 text-gold"
      >
        <Sparkles size={24} strokeWidth={1} />
      </motion.div>
      <motion.div 
        animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1, ease: "easeInOut" }}
        className="absolute bottom-1/3 right-12 text-gold-warm"
      >
        <Sparkles size={16} strokeWidth={1} />
      </motion.div>
      <motion.div 
        animate={{ opacity: [0.4, 1, 0.4], scale: [0.7, 1.3, 0.7] }}
        transition={{ duration: 3, repeat: Infinity, delay: 2, ease: "easeInOut" }}
        className="absolute top-10 right-1/4 text-gold"
      >
        <Sparkles size={20} strokeWidth={1} />
      </motion.div>
      <motion.div 
        animate={{ opacity: [0.3, 0.9, 0.3], scale: [1, 1.5, 1] }}
        transition={{ duration: 6, repeat: Infinity, delay: 0.5, ease: "easeInOut" }}
        className="absolute bottom-20 left-1/4 text-gold-warm"
      >
        <Sparkles size={12} strokeWidth={1} />
      </motion.div>

      {/* SVG Butterfly 1 */}
      <motion.svg 
        animate={{ y: [0, -15, 0], rotate: [15, 20, 15] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-32 right-10 text-gold-muted opacity-60 w-12 h-12"
        viewBox="0 0 24 24" fill="currentColor"
      >
        <path d="M12 2c0 0-1.5 2.5-1.5 5.5 0 2 1.5 3.5 1.5 3.5s1.5-1.5 1.5-3.5C13.5 4.5 12 2 12 2zM12 11c0 0-4 1-6 4-1.5 2.2-2 6-2 6s3-1 6-2.5c2-1 2-7.5 2-7.5zM12 11c0 0 4 1 6 4 1.5 2.2 2 6 2 6s-3-1-6-2.5c-2-1-2-7.5-2-7.5z"/>
      </motion.svg>

      {/* SVG Butterfly 2 */}
      <motion.svg 
        animate={{ y: [0, 10, 0], rotate: [-20, -10, -20] }}
        transition={{ duration: 7, repeat: Infinity, delay: 1, ease: "easeInOut" }}
        className="absolute bottom-40 left-10 text-gold opacity-50 w-16 h-16"
        viewBox="0 0 24 24" fill="currentColor"
      >
        <path d="M12 2c0 0-1.5 2.5-1.5 5.5 0 2 1.5 3.5 1.5 3.5s1.5-1.5 1.5-3.5C13.5 4.5 12 2 12 2zM12 11c0 0-4 1-6 4-1.5 2.2-2 6-2 6s3-1 6-2.5c2-1 2-7.5 2-7.5zM12 11c0 0 4 1 6 4 1.5 2.2 2 6 2 6s-3-1-6-2.5c-2-1-2-7.5-2-7.5z"/>
      </motion.svg>
    </div>
  );
};
