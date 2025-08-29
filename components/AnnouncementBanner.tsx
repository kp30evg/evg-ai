'use client'

import { useState } from 'react'
import { X, Sparkles, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        exit={{ y: -100 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-evergreen via-evergreen-dark to-evergreen text-white shadow-lg"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold animate-pulse" />
                <span className="font-bold text-sm md:text-base">
                  🚀 EXCLUSIVE BETA ACCESS
                </span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-sm">
                <span className="text-gold font-semibold">Only 47 spots remaining</span>
                <span className="text-white/70">•</span>
                <span>Get exclusive early access to the AI OS that replaces 130+ tools</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <a
                href="#waitlist"
                className="px-4 py-2 bg-gold text-evergreen-dark font-bold rounded-lg hover:bg-gold/90 transition-all duration-120 flex items-center gap-2 text-sm animate-pulse hover:animate-none"
              >
                Apply for Beta
                <ArrowRight className="w-4 h-4" />
              </a>
              <button
                onClick={() => setIsVisible(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                aria-label="Close banner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}