'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Terminal, ArrowRight, Send, Zap } from 'lucide-react'

export default function HeroSection() {
  const [command, setCommand] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0)

  const commandExamples = [
    "Fire unprofitable customers in Texas",
    "Show me why margins are dropping", 
    "Prepare for Series B fundraise",
    "Optimize supply chain by 20%",
    "Why did Customer X churn?",
    "Schedule follow-ups for all deals closing this month"
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % commandExamples.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleExecute = () => {
    if (command.trim()) {
      setIsProcessing(true)
      setTimeout(() => setIsProcessing(false), 1500)
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-evergreen-light/20 to-white">
      {/* Container with proper max-width and padding */}
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Launch Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-2 mb-8 bg-evergreen-light border border-evergreen/20 rounded-full"
          >
            <Sparkles className="w-4 h-4 text-evergreen" />
            <span className="text-sm font-semibold text-evergreen">
              Launching September 19, 2025
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-charcoal leading-tight mb-8"
          >
            Run Your Entire<br />
            <span className="text-evergreen">Business</span><br />
            <span className="text-evergreen">By Typing Commands</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-medium max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            The AI OS that replaces <span className="text-charcoal font-semibold">130+ business tools</span> with one unified platform.<br />
            <span className="text-evergreen font-semibold">Natural language commands control everything.</span>
          </motion.p>

          {/* Command Demo Box */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full max-w-4xl mb-10"
          >
            <div className="bg-white rounded-xl shadow-card border border-gray-light/50 p-8">
              {/* Terminal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-evergreen" />
                  <span className="text-sm font-semibold text-charcoal uppercase tracking-wide">
                    Live Command Center
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-evergreen rounded-full animate-pulse" />
                  <span className="text-sm text-gray-medium">Ready</span>
                </div>
              </div>

              {/* Command Input */}
              <div className="relative">
                <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-gray-50/80 to-evergreen-light/20 rounded-xl border border-gray-light/40 shadow-subtle transition-all duration-120 hover:shadow-card hover:border-evergreen/30 group">
                  <Zap className="w-6 h-6 text-evergreen flex-shrink-0 group-hover:text-gold transition-colors duration-120" />
                  <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleExecute()}
                    placeholder={commandExamples[currentPlaceholder]}
                    className="flex-1 bg-transparent text-charcoal placeholder:text-gray-medium outline-none text-lg font-medium"
                  />
                  <button
                    onClick={handleExecute}
                    className="px-6 py-3 bg-evergreen text-white rounded-xl hover:bg-evergreen/90 hover:shadow-lg hover:scale-105 transition-all duration-120 flex items-center gap-2 font-semibold relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-120"></div>
                    <span className="relative z-10 flex items-center gap-2">
                      Execute
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-120" />
                    </span>
                  </button>
                </div>
              </div>

              {/* Processing State */}
              <AnimatePresence>
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 p-4 bg-evergreen-light/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-evergreen rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-evergreen rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-evergreen rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-evergreen">AI Processing</p>
                        <p className="text-xs text-gray-medium">• Response time: 0.3s</p>
                      </div>
                    </div>
                    <p className="text-sm text-charcoal mt-2">
                      Analyzing data across 20 integrated modules...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-light">
                <div className="text-center">
                  <div className="text-2xl font-bold text-charcoal">0.3s</div>
                  <div className="text-xs text-gray-medium">Response</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-charcoal">130+</div>
                  <div className="text-xs text-gray-medium">Tools Replaced</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-charcoal">100%</div>
                  <div className="text-xs text-gray-medium">Natural</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-charcoal">48hr</div>
                  <div className="text-xs text-gray-medium">Migration</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Watch Demo Button - Centered */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex justify-center mb-8"
          >
            <button className="px-8 py-4 bg-white text-charcoal border border-gray-light rounded-xl font-semibold hover:bg-gray-50 transition-all duration-120 flex items-center justify-center">
              Watch Demo
            </button>
          </motion.div>

          {/* Join Waitlist Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex justify-center"
          >
            <button className="px-8 py-4 bg-evergreen text-white rounded-xl font-semibold hover:bg-evergreen/90 transition-all duration-120 shadow-subtle flex items-center justify-center gap-2">
              Join Waitlist
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>

          {/* Social Proof */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-sm text-gray-medium mt-6"
          >
            <strong className="text-charcoal">10,847</strong> companies waiting • 
            <strong className="text-charcoal"> $73M</strong> costs eliminated
          </motion.p>
        </div>
      </div>
    </section>
  )
}