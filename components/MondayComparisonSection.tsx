'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'

export default function MondayComparisonSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const todayTimeline = [
    { time: '6:47am', action: 'Log into Salesforce', delay: 0 },
    { time: '7:02am', action: 'Log into QuickBooks', delay: 0.1 },
    { time: '7:15am', action: 'Log into Slack', delay: 0.2 },
    { time: '7:23am', action: 'Log into Monday.com', delay: 0.3 },
    { time: '7:31am', action: 'Log into HubSpot', delay: 0.4 },
    { time: '', action: '', isBreak: true, delay: 0.5 },
    { time: '9:00am', action: 'Search for customer data', delay: 0.6 },
    { time: '9:45am', action: 'Still searching...', delay: 0.7 },
    { time: '10:30am', action: 'Found it (wrong system)', delay: 0.8 },
    { time: '11:15am', action: 'Data is 3 weeks old', delay: 0.9 },
    { time: '', action: '', isBreak: true, delay: 1.0 },
    { time: '2:00pm', action: 'Excel pivot tables', delay: 1.1 },
    { time: '3:30pm', action: 'Copy data to PowerPoint', delay: 1.2 },
    { time: '4:45pm', action: 'Email: "I\'ll get back to you"', delay: 1.3 },
    { time: '6:30pm', action: 'Still at office', delay: 1.4 },
    { time: '8:00pm', action: 'Drive home exhausted', delay: 1.5 }
  ]

  const evergreenTimeline = [
    { time: '7:00am', action: '"Show me what matters today"', response: 'Everything ready', delay: 0 },
    { time: '7:01am', action: '', response: '', isSpace: true, delay: 0.1 },
    { time: '', action: '', isBreak: true, delay: 0.2 },
    { time: '9:00am', action: '"Why did we lose that deal?"', response: 'Answer with action plan', delay: 0.3 },
    { time: '9:02am', action: '', response: '', isSpace: true, delay: 0.4 },
    { time: '', action: '', isBreak: true, delay: 0.5 },
    { time: '11:30am', action: '"Optimize Q4 spending"', response: '$47K saved', delay: 0.6 },
    { time: '11:31am', action: '', response: '', isSpace: true, delay: 0.7 },
    { time: '', action: '', isBreak: true, delay: 0.8 },
    { time: '2:00pm', action: '"What needs attention?"', response: 'Sorted by priority', delay: 0.9 },
    { time: '2:01pm', action: '', response: '', isSpace: true, delay: 1.0 },
    { time: '', action: '', isBreak: true, delay: 1.1 },
    { time: '5:00pm', action: 'Home', response: '(Actually home)', delay: 1.2, highlight: true }
  ]

  const getTimeColor = (index: number, total: number) => {
    const ratio = index / total
    const intensity = Math.min(ratio * 0.8, 0.8)
    return `rgba(220, 38, 38, ${intensity})`
  }

  return (
    <section ref={ref} className="relative bg-white overflow-hidden">
      {/* Main content */}
      <div className="relative">
        <div className="grid lg:grid-cols-2">
          {/* Left Side - Today */}
          <div 
            className="relative min-h-[800px]"
            style={{ backgroundColor: '#F8F9FA' }}
          >
            {/* Subtle texture overlay */}
            <div 
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, #000 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            />
            
            <div className="relative p-8 lg:p-12">
              <h3 
                className="mb-12"
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  color: '#6B7280',
                  fontWeight: 500
                }}
              >
                YOUR MONDAY TODAY
              </h3>

              <div className="space-y-4">
                {todayTimeline.map((item, index) => (
                  item.isBreak ? (
                    <div key={index} className="h-4" />
                  ) : (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: item.delay * 0.3, duration: 0.5 }}
                      className="group"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)'
                      }}
                      style={{ transition: 'transform 0.2s' }}
                    >
                      <div className="flex items-baseline gap-4">
                        <span 
                          className="font-semibold text-sm min-w-[80px]"
                          style={{ 
                            color: index > 10 ? getTimeColor(index, todayTimeline.length) : '#222B2E'
                          }}
                        >
                          {item.time}
                        </span>
                        <span className="text-base" style={{ color: '#6B7280' }}>
                          {item.action}
                        </span>
                      </div>
                    </motion.div>
                  )
                ))}
              </div>

              {/* Bottom Stats */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.8, duration: 0.5 }}
                className="mt-16 pt-8 border-t border-gray-300"
              >
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Time today</p>
                    <p className="text-lg font-bold" style={{ color: '#DC2626' }}>Wasted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Decisions</p>
                    <p className="text-lg font-bold text-gray-800">0</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Problems solved</p>
                    <p className="text-lg font-bold text-gray-800">0</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Border right */}
            <div 
              className="absolute right-0 top-0 bottom-0 w-[2px]"
              style={{ backgroundColor: '#E5E7EB' }}
            />
          </div>

          {/* Right Side - With evergreenOS */}
          <div 
            className="relative min-h-[800px] bg-white"
            style={{
              background: 'linear-gradient(to bottom, #E6F4EC 0%, #ffffff 100px)'
            }}
          >
            <div className="relative p-8 lg:p-12">
              <h3 
                className="mb-12"
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  color: '#1D5238',
                  fontWeight: 500
                }}
              >
                YOUR MONDAY WITH EVERGREENOS
              </h3>

              <div className="space-y-4">
                {evergreenTimeline.map((item, index) => (
                  item.isBreak ? (
                    <div key={index} className="h-4" />
                  ) : item.isSpace ? (
                    <div key={index} className="h-6" />
                  ) : (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: item.delay * 0.3 + 0.2, duration: 0.5 }}
                      className="group"
                      onMouseEnter={(e) => {
                        if (!item.highlight) {
                          e.currentTarget.style.backgroundColor = 'rgba(29, 82, 56, 0.03)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                      style={{ 
                        transition: 'all 0.2s',
                        padding: '4px 8px',
                        marginLeft: '-8px',
                        borderRadius: '4px'
                      }}
                    >
                      <div className="flex items-baseline gap-4">
                        <span 
                          className="font-semibold text-sm min-w-[80px]"
                          style={{ color: '#222B2E' }}
                        >
                          {item.time}
                        </span>
                        <div className="flex-1">
                          {item.action && (
                            <span 
                              className="text-base font-medium"
                              style={{ color: '#1D5238' }}
                            >
                              {item.action}
                            </span>
                          )}
                          {item.response && (
                            <div className="flex items-center gap-2 mt-1">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={isInView ? { scale: 1 } : {}}
                                transition={{ delay: item.delay * 0.3 + 0.4, duration: 0.3 }}
                              >
                                <Check className="w-4 h-4" style={{ color: '#10B981' }} />
                              </motion.div>
                              <span className="text-sm" style={{ color: '#6B7280' }}>
                                {item.response}
                              </span>
                            </div>
                          )}
                          {item.highlight && (
                            <span 
                              className="text-base font-bold"
                              style={{ color: '#1D5238' }}
                            >
                              {item.action}
                              {item.response && (
                                <span className="ml-2 font-normal" style={{ color: '#6B7280' }}>
                                  {item.response}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                ))}
              </div>

              {/* Bottom Stats */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 2, duration: 0.5 }}
                className="mt-16 pt-8 border-t"
                style={{ borderColor: '#E6F4EC' }}
              >
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Time today</p>
                    <p className="text-lg font-bold" style={{ color: '#1D5238' }}>Yours</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Decisions</p>
                    <p className="text-lg font-bold" style={{ color: '#1D5238' }}>14</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Problems solved</p>
                    <p className="text-lg font-bold" style={{ color: '#1D5238' }}>14</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 2.2, duration: 0.5 }}
          className="w-full"
          style={{ 
            backgroundColor: '#E6F4EC',
            padding: '32px'
          }}
        >
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-semibold mb-6" style={{ color: '#222B2E' }}>
              Which Monday do you want?
            </h3>
            <a href="#demo">
              <button 
                className="inline-flex items-center gap-3 px-8 py-4 font-semibold text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: '#1D5238' }}
              >
                Start Your 48-Hour Transformation
                <ArrowRight className="w-5 h-5" />
              </button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}