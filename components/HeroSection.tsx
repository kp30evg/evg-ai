'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Users } from 'lucide-react'
import CommandInterface from './HeroSection-CommandInterface'

export default function HeroSection() {
  return (
    <section className="relative h-screen flex flex-col bg-gradient-to-br from-white via-evergreen-light/5 to-white overflow-hidden">
      {/* Main Content Container */}
      <div className="flex-1 flex items-center px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto w-full">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
            
            {/* Left Column - Text Content (40% width) */}
            <div className="w-full lg:w-[40%] px-4 lg:pl-[60px] lg:pr-8">
              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-bold text-charcoal leading-[1.15]"
              >
                Still Using <span className="text-evergreen">50+ Tools</span><br />
                to Run Your Business?
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-base md:text-lg text-charcoal/80 mt-4 leading-[1.5]"
              >
                It's time for the world's first <span className="font-bold text-charcoal">Unified Business Operating System</span>. 
                One platform, run by natural language, to replace your entire stack.
              </motion.p>

              {/* CTA Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-10"
              >
                {/* CTA Button */}
                <div>
                  <a href="#waitlist" className="inline-block">
                    <button 
                      className="px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 shadow-xl flex items-center justify-center gap-3"
                      style={{ 
                        backgroundColor: '#2b6b4a',
                        color: 'white',
                        minWidth: '320px'
                      }}
                    >
                      <span>Apply for Exclusive Beta Access</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </a>
                  
                  {/* Spots remaining and waitlist - single line */}
                  <div className="mt-3 flex items-center gap-3 text-sm">
                    <span className="font-semibold text-red-600">🔥 47 spots left</span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-700">👥 10,847 on waitlist</span>
                  </div>
                </div>

                {/* Checkmarks - single line */}
                <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-gray-700">
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-evergreen" />
                    48hr migration
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-evergreen" />
                    No card required
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-evergreen" />
                    Founder pricing
                  </span>
                </div>

                {/* Trust bar */}
                <div className="mt-8">
                  <p className="text-xs text-gray-600">
                    Replacing: Salesforce • HubSpot • NetSuite • Monday • 45+ others
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Command Interface (55% width) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-full lg:w-[55%]"
            >
              <div className="relative">
                {/* Enhanced shadow and border for the chat interface */}
                <div className="absolute inset-0 bg-gradient-to-r from-evergreen/20 to-gold/20 rounded-2xl blur-xl opacity-50" />
                <div className="relative">
                  <CommandInterface />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Trust Bar - Fixed at Bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white/95 backdrop-blur border-t border-gray-200 py-3 px-6"
      >
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs md:text-sm text-gray-600">
            <span className="font-medium">Currently replacing:</span>
            <span className="text-charcoal font-semibold">Salesforce</span>
            <span className="text-gray-400">•</span>
            <span className="text-charcoal font-semibold">HubSpot</span>
            <span className="text-gray-400">•</span>
            <span className="text-charcoal font-semibold">NetSuite</span>
            <span className="text-gray-400">•</span>
            <span className="text-charcoal font-semibold">Monday</span>
            <span className="text-gray-400">•</span>
            <span className="text-charcoal font-semibold">Slack</span>
            <span className="text-gray-400">•</span>
            <span className="text-evergreen font-semibold">45+ others</span>
          </div>
        </div>
      </motion.div>
    </section>
  )
}