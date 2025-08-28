'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Sparkles, TrendingUp, Package, Users, DollarSign, AlertTriangle, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface CommandResult {
  type: 'success' | 'analysis' | 'action'
  title: string
  details: string[]
  metrics?: { label: string; value: string; change?: string }[]
  actions?: string[]
}

const SAMPLE_COMMANDS = [
  { text: "Show me deals closing this week", icon: DollarSign },
  { text: "Why are margins dropping?", icon: TrendingUp },
  { text: "Optimize for profitability", icon: Sparkles },
  { text: "Prepare for acquisition", icon: Package },
  { text: "Which customers should we fire?", icon: AlertTriangle },
  { text: "Reduce costs by 20%", icon: TrendingUp },
]

const COMMAND_RESPONSES: Record<string, CommandResult> = {
  "show me deals closing this week": {
    type: 'analysis',
    title: 'Analyzing Pipeline',
    details: [
      '14 deals worth $2.3M closing this week',
      '3 enterprise deals need executive approval',
      '2 at-risk deals requiring immediate action'
    ],
    metrics: [
      { label: 'Total Value', value: '$2.3M', change: '+15%' },
      { label: 'Win Probability', value: '78%', change: '+5%' },
      { label: 'Days to Close', value: '3.2', change: '-2' }
    ],
    actions: [
      'Email sent to executives for approval',
      'Risk alerts dispatched to account managers',
      'Commission calculations updated'
    ]
  },
  "why are margins dropping?": {
    type: 'analysis',
    title: 'Margin Analysis Complete',
    details: [
      'Identified 15% margin leak from rush shipping',
      'Supplier costs increased 8% without price adjustments',
      'Sales discounting averaging 23% vs 15% target'
    ],
    metrics: [
      { label: 'Margin Impact', value: '-$437K', change: '-15%' },
      { label: 'Rush Orders', value: '34%', change: '+12%' },
      { label: 'Avg Discount', value: '23%', change: '+8%' }
    ],
    actions: [
      'Shipping optimization initiated',
      'Price adjustment proposals generated',
      'Discount approval workflows tightened'
    ]
  },
  "optimize for profitability": {
    type: 'action',
    title: 'Optimization Executing',
    details: [
      'Analyzing 10,847 transactions across all departments',
      'Identifying top 20% profitable customers',
      'Reallocating resources to high-margin activities'
    ],
    metrics: [
      { label: 'Projected Savings', value: '$1.2M', change: '+18%' },
      { label: 'Actions Taken', value: '47', change: 'Auto' },
      { label: 'ROI Impact', value: '3.4x', change: '+0.8x' }
    ],
    actions: [
      'Unprofitable SKUs flagged for removal',
      'Customer tiers automatically adjusted',
      'Team focus shifted to enterprise accounts',
      'Automated workflows replacing manual tasks'
    ]
  },
  "prepare for acquisition": {
    type: 'action',
    title: 'Acquisition Preparation Initiated',
    details: [
      'Data room created with 1,847 documents',
      'Financial statements consolidated and verified',
      'Due diligence checklist generated (247 items)'
    ],
    metrics: [
      { label: 'Readiness Score', value: '94%', change: '+12%' },
      { label: 'Documents', value: '1,847', change: 'Ready' },
      { label: 'Compliance', value: '100%', change: 'Verified' }
    ],
    actions: [
      'Virtual data room configured',
      'Legal team notified and briefed',
      'Financial audits scheduled',
      'Employee retention plans activated'
    ]
  },
  "which customers should we fire?": {
    type: 'analysis',
    title: 'Unprofitable Customer Analysis',
    details: [
      '37 customers generating negative margin',
      'Combined support cost exceeds revenue by 43%',
      'Resource reallocation could save $2.1M annually'
    ],
    metrics: [
      { label: 'Loss Leaders', value: '37', change: '-$2.1M' },
      { label: 'Support Hours', value: '3,400', change: 'Excessive' },
      { label: 'Payment Delays', value: '67 days', change: '+42' }
    ],
    actions: [
      'Termination templates prepared',
      'Alternative service providers identified',
      'Resource reallocation plan created',
      'Revenue impact model calculated'
    ]
  },
  "reduce costs by 20%": {
    type: 'action',
    title: 'Cost Reduction Plan Executing',
    details: [
      'Analyzed $12.4M in operational expenses',
      'Identified $2.5M in immediate savings',
      'Automation replacing 18 manual processes'
    ],
    metrics: [
      { label: 'Target Savings', value: '$2.5M', change: '20.1%' },
      { label: 'Quick Wins', value: '$890K', change: 'Immediate' },
      { label: 'Process Automated', value: '18', change: '+18' }
    ],
    actions: [
      'Vendor contracts renegotiated',
      'Duplicate tools eliminated',
      'Travel policy adjusted',
      'Office consolidation initiated',
      'Automated workflows deployed'
    ]
  }
}

export default function LiveCommandPlayground() {
  const [command, setCommand] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<CommandResult | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleCommand = (cmd: string) => {
    const normalizedCmd = cmd.toLowerCase().trim()
    setIsProcessing(true)
    setCommand(cmd)
    
    // Add to history
    setHistory(prev => [cmd, ...prev.slice(0, 4)])

    // Simulate processing
    setTimeout(() => {
      const response = COMMAND_RESPONSES[normalizedCmd] || {
        type: 'analysis',
        title: 'Command Processing',
        details: [
          'Natural language query recognized',
          'Analyzing across all business modules',
          'Generating insights and recommendations'
        ],
        metrics: [
          { label: 'Modules Scanned', value: '20+', change: 'All' },
          { label: 'Data Points', value: '1.2M', change: 'Real-time' },
          { label: 'Confidence', value: '98%', change: 'High' }
        ]
      }
      setResult(response)
      setIsProcessing(false)
    }, 1500)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (command.trim()) {
      handleCommand(command)
      setCommand('')
    }
  }

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-evergreen-light/20 to-white" />
      
      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-evergreen-light text-evergreen rounded-full text-sm font-medium mb-4">
            <Terminal className="w-4 h-4" />
            LIVE COMMAND INTERFACE
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Try It Now. Type Anything.
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Experience the power of running your entire business through natural language. 
            No buttons. No menus. Just type what you want to happen.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          {/* Command Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="relative p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-slate-700/50 shadow-2xl overflow-hidden group">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-evergreen/10 via-gold/5 to-evergreen/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-evergreen/20 to-gold/20 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none"></div>
              <div className="relative z-10">
              <form onSubmit={handleSubmit} className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3 text-evergreen">
                    <Terminal className="w-6 h-6" />
                    <span className="text-sm font-mono font-semibold">Evergreen AI Terminal v1.0</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-evergreen to-gold rounded-full animate-pulse shadow-lg"></div>
                    <span className="text-sm text-slate-400 font-mono">Connected</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-600/30 backdrop-blur-sm hover:border-evergreen/30 transition-all duration-200 group">
                  <span className="text-evergreen font-mono text-lg font-bold group-hover:text-gold transition-colors duration-200">$</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Type a command... (e.g., 'Show me deals closing this week')"
                    className="flex-1 bg-transparent text-white placeholder:text-slate-400 outline-none font-mono text-lg focus:text-white transition-colors duration-200"
                    disabled={isProcessing}
                  />
                  <button
                    type="submit"
                    disabled={isProcessing || !command.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-evergreen to-evergreen/90 text-white rounded-lg hover:from-evergreen/90 hover:to-gold/80 hover:scale-105 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    <ChevronRight className="w-5 h-5 relative z-10" />
                  </button>
                </div>
              </form>
              </div>

              {/* Sample Commands */}
              <div className="mt-6 pt-6 border-t border-slate-800">
                <p className="text-xs text-slate-500 mb-3 font-mono">SAMPLE COMMANDS:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SAMPLE_COMMANDS.map((cmd, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCommand(cmd.text)}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-all text-sm text-left group"
                      disabled={isProcessing}
                    >
                      <cmd.icon className="w-4 h-4 text-evergreen group-hover:scale-110 transition-transform" />
                      <span className="truncate">{cmd.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Processing Animation */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6"
              >
                <Card className="p-6 bg-white border-evergreen/20">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 border-3 border-evergreen/20 rounded-full animate-spin border-t-evergreen" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Processing Command...</p>
                      <p className="text-sm text-slate-600">Analyzing across all business modules</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Display */}
          <AnimatePresence>
            {result && !isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="mt-6 space-y-4"
              >
                {/* Main Result Card */}
                <Card className="p-6 bg-white border-evergreen/20 shadow-xl">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${
                          result.type === 'success' ? 'bg-green-500' :
                          result.type === 'action' ? 'bg-blue-500' : 'bg-amber-500'
                        } animate-pulse`} />
                        <span className="text-sm font-medium text-slate-600 uppercase">
                          {result.type === 'action' ? 'EXECUTING' : 'ANALYSIS COMPLETE'}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">{result.title}</h3>
                    </div>
                    <Sparkles className="w-6 h-6 text-evergreen" />
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-6">
                    {result.details.map((detail, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-evergreen mt-0.5" />
                        <p className="text-slate-700">{detail}</p>
                      </div>
                    ))}
                  </div>

                  {/* Metrics Grid */}
                  {result.metrics && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {result.metrics.map((metric, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs text-slate-600 mb-1">{metric.label}</p>
                          <p className="text-xl font-bold text-slate-900">{metric.value}</p>
                          {metric.change && (
                            <p className={`text-xs mt-1 ${
                              metric.change.startsWith('+') ? 'text-green-600' :
                              metric.change.startsWith('-') ? 'text-red-600' :
                              'text-blue-600'
                            }`}>
                              {metric.change}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions Taken */}
                  {result.actions && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-semibold text-slate-900 mb-2">Actions Executed:</p>
                      <div className="space-y-1">
                        {result.actions.map((action, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center gap-2 text-sm text-gray-medium"
                          >
                            <div className="w-1.5 h-1.5 bg-evergreen rounded-full" />
                            {action}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                {/* Module Activity Indicator */}
                <Card className="p-4 bg-slate-50 border-slate-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">Modules Engaged:</p>
                    <div className="flex gap-1">
                      {['EverCore', 'EverBooks', 'EverTeam', 'EverStock', 'EverMail'].map((module, idx) => (
                        <motion.div
                          key={module}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="px-2 py-1 bg-evergreen-light text-evergreen rounded text-xs font-medium"
                        >
                          {module}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Command History */}
          {history.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              <p className="text-sm text-slate-500 mb-2">Recent Commands:</p>
              <div className="flex flex-wrap gap-2">
                {history.map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCommand(cmd)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-sm transition-colors"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}