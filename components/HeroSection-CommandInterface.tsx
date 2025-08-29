'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Terminal, ArrowRight, Send, Zap, Clock, Users, CheckCircle, ChevronRight, DollarSign, TrendingUp, Package, AlertTriangle, Building2, CreditCard, FileText, ShoppingCart, Bot, Sparkle, Loader2, Activity, Shield, Database, Cpu, Network, Check, HelpCircle, BarChart3, FileSearch, AlertCircle, PlayCircle, XCircle } from 'lucide-react'

interface CommandResult {
  type: 'success' | 'analysis' | 'action' | 'question'
  title: string
  details: string[]
  metrics?: { label: string; value: string; change?: string }[]
  actions?: string[]
  requiresConfirmation?: boolean
  proposedActions?: string[]
}

const COMMAND_RESPONSES: Record<string, CommandResult> = {
  "what's our monthly burn rate?": {
    type: 'question',
    title: '📊 Financial Analysis',
    details: [
      'Current monthly burn rate: $247,000',
      'Runway at current rate: 18 months',
      'Main expense categories: Payroll (65%), Software (15%), Office (12%), Other (8%)'
    ],
    metrics: [
      { label: 'Monthly Burn', value: '$247K', change: '-8%' },
      { label: 'Runway', value: '18 months', change: '+2 months' },
      { label: 'Cash on Hand', value: '$4.4M', change: 'Stable' }
    ]
  },
  "show revenue by customer segment": {
    type: 'analysis',
    title: '💰 Revenue Segmentation Analysis',
    details: [
      'Enterprise (>1000 employees): $2.3M (58%)',
      'Mid-Market (100-1000): $1.2M (30%)',
      'SMB (<100): $480K (12%)'
    ],
    metrics: [
      { label: 'Total Revenue', value: '$3.98M', change: '+22%' },
      { label: 'Enterprise Growth', value: '+45%', change: 'YoY' },
      { label: 'Avg Deal Size', value: '$47K', change: '+12%' }
    ]
  },
  "which customers are at risk of churning?": {
    type: 'question',
    title: '⚠️ Customer Health Analysis',
    details: [
      'Identified 8 at-risk accounts based on usage patterns',
      'Combined ARR at risk: $340,000',
      'Primary risk factors: Low feature adoption (5), Support ticket volume (2), Payment delays (1)'
    ],
    metrics: [
      { label: 'At Risk ARR', value: '$340K', change: '8.5% of total' },
      { label: 'Risk Score', value: '7.2/10', change: 'Critical' },
      { label: 'Days Since Login', value: '14 avg', change: '+7 days' }
    ],
    proposedActions: [
      'Schedule executive check-ins with top 3 at-risk accounts',
      'Create personalized re-engagement campaigns',
      'Offer training sessions for low-adoption customers',
      'Review and potentially adjust pricing for delayed payment account'
    ],
    requiresConfirmation: true
  },
  "generate weekly sales report": {
    type: 'action',
    title: '📈 Sales Report Generation',
    details: [
      'Report will include: Pipeline summary, closed deals, and forecast',
      'Data range: Last 7 days (Dec 16-22, 2024)',
      'Recipients: Sales team, executive team'
    ],
    proposedActions: [
      'Compile data from CRM and financial systems',
      'Generate PDF report with charts and metrics',
      'Send via email to 12 recipients',
      'Archive copy in shared drive'
    ],
    requiresConfirmation: true
  },
  "automate invoice reminders": {
    type: 'action',
    title: '📧 Invoice Reminder Automation',
    details: [
      'Currently 23 invoices overdue (total: $127,000)',
      'Average days overdue: 12',
      'Proposed automation: Email reminders at 7, 14, and 30 days'
    ],
    proposedActions: [
      'Set up automated email sequences',
      'Personalize templates based on customer tier',
      'Include payment links and support contact',
      'Escalate to account manager after 30 days'
    ],
    requiresConfirmation: true
  },
  "optimize team meeting schedule": {
    type: 'action',
    title: '📅 Meeting Optimization Analysis',
    details: [
      'Current weekly meeting load: 47 hours across team',
      'Identified 12 redundant or low-value meetings',
      'Potential time savings: 8 hours/week'
    ],
    proposedActions: [
      'Consolidate 3 status meetings into one weekly sync',
      'Convert 4 meetings to async updates',
      'Reduce 5 meetings from 60 to 30 minutes',
      'Cancel 2 meetings with low attendance'
    ],
    requiresConfirmation: true
  },
  "what's our customer acquisition cost?": {
    type: 'question',
    title: '📊 Customer Acquisition Analysis',
    details: [
      'Current CAC: $4,200 per customer',
      'Payback period: 11 months',
      'CAC by channel: Paid ads ($5,800), Organic ($2,100), Referral ($1,400)'
    ],
    metrics: [
      { label: 'CAC', value: '$4,200', change: '-15%' },
      { label: 'LTV:CAC Ratio', value: '3.2:1', change: 'Healthy' },
      { label: 'Payback', value: '11 months', change: '-2 months' }
    ]
  },
  "analyze support ticket trends": {
    type: 'analysis',
    title: '🎫 Support Ticket Analysis',
    details: [
      'Weekly ticket volume: 142 (down 18% from last week)',
      'Average resolution time: 4.2 hours',
      'Top issues: Login problems (23%), Feature requests (19%), Billing (15%)'
    ],
    metrics: [
      { label: 'Weekly Volume', value: '142', change: '-18%' },
      { label: 'Avg Resolution', value: '4.2hrs', change: '-1.3hrs' },
      { label: 'CSAT Score', value: '4.6/5', change: '+0.2' }
    ]
  }
}

const PROCESSING_STEPS = [
  { icon: Database, text: 'Accessing business data', color: 'text-evergreen' },
  { icon: Cpu, text: 'Processing your request', color: 'text-blue-600' },
  { icon: Network, text: 'Analyzing patterns', color: 'text-purple-600' },
  { icon: Shield, text: 'Applying security filters', color: 'text-orange-600' },
  { icon: Activity, text: 'Generating insights', color: 'text-red-600' }
]

export default function CommandInterface() {
  const [command, setCommand] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0)
  const [result, setResult] = useState<CommandResult | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const [showWelcome, setShowWelcome] = useState(true)
  const [processingStep, setProcessingStep] = useState(0)
  const [typedResponse, setTypedResponse] = useState('')
  const [isTypingResponse, setIsTypingResponse] = useState(false)
  const [currentDetailIndex, setCurrentDetailIndex] = useState(0)
  const [executingAction, setExecutingAction] = useState(false)

  const SAMPLE_COMMANDS = [
    // Questions
    { text: "What's our monthly burn rate?", icon: HelpCircle, type: 'question' },
    { text: "Show revenue by customer segment", icon: BarChart3, type: 'analysis' },
    { text: "Which customers are at risk of churning?", icon: AlertCircle, type: 'question' },
    { text: "What's our customer acquisition cost?", icon: DollarSign, type: 'question' },
    { text: "Analyze support ticket trends", icon: FileSearch, type: 'analysis' },
    // Actions
    { text: "Generate weekly sales report", icon: FileText, type: 'action' },
    { text: "Automate invoice reminders", icon: CreditCard, type: 'action' },
    { text: "Optimize team meeting schedule", icon: Users, type: 'action' },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % SAMPLE_COMMANDS.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  // Type out response details one by one
  useEffect(() => {
    if (result && !isProcessing && currentDetailIndex < result.details.length) {
      const timer = setTimeout(() => {
        setCurrentDetailIndex(prev => prev + 1)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [result, isProcessing, currentDetailIndex])

  const handleCommand = (cmd: string) => {
    const normalizedCmd = cmd.toLowerCase().trim()
    setIsProcessing(true)
    setCommand(cmd)
    setShowWelcome(false)
    setProcessingStep(0)
    setCurrentDetailIndex(0)
    setTypedResponse('')
    setIsTypingResponse(false)
    
    // Add to history
    if (cmd && !history.includes(cmd)) {
      setHistory(prev => [cmd, ...prev.slice(0, 4)])
    }

    // Animate through processing steps
    const stepInterval = setInterval(() => {
      setProcessingStep(prev => {
        if (prev < PROCESSING_STEPS.length - 1) {
          return prev + 1
        } else {
          clearInterval(stepInterval)
          return prev
        }
      })
    }, 400)

    // Simulate processing with real response
    setTimeout(() => {
      const response = COMMAND_RESPONSES[normalizedCmd] || {
        type: 'question',
        title: '🤖 Analysis Complete',
        details: [
          'I\'ve processed your request across all business modules',
          'Here\'s what I found based on your current data',
          'Please review the insights below'
        ],
        metrics: [
          { label: 'Data Points', value: '1.2M', change: 'Analyzed' },
          { label: 'Confidence', value: '95%', change: 'High' },
          { label: 'Response Time', value: '0.8s', change: 'Fast' }
        ]
      }
      console.log('Command response:', normalizedCmd, response) // Debug log
      setResult(response)
      setIsProcessing(false)
      setProcessingStep(0)
      setIsTypingResponse(true)
    }, 2500)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (command.trim()) {
      handleCommand(command)
      setCommand('')
    }
  }

  const handleExecuteAction = () => {
    setExecutingAction(true)
    setTimeout(() => {
      setExecutingAction(false)
      // In a real app, this would trigger the actual actions
      // For demo, we'll show a success message
      setResult({
        type: 'success',
        title: '✅ Actions Executed Successfully',
        details: [
          'All proposed actions have been initiated',
          'You will receive email confirmations as each action completes',
          'Check the dashboard for real-time progress updates'
        ]
      })
    }, 2000)
  }

  const handleCancelAction = () => {
    setResult(null)
  }

  // Group commands by type for better organization
  const questionCommands = SAMPLE_COMMANDS.filter(cmd => cmd.type === 'question' || cmd.type === 'analysis')
  const actionCommands = SAMPLE_COMMANDS.filter(cmd => cmd.type === 'action')

  return (
    <div className="relative bg-gradient-to-br from-white via-evergreen-light/20 to-white rounded-2xl shadow-2xl border border-evergreen/15 p-6 overflow-hidden"
      style={{
        boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.15), 0 10px 40px -10px rgba(45, 107, 74, 0.1)'
      }}>
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-gold/20 rounded-full"
            animate={{
              x: ['0%', '100%', '0%'],
              y: ['0%', '100%', '0%'],
            }}
            transition={{
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 2,
            }}
            style={{
              left: `${i * 20}%`,
              top: `${i * 25}%`,
            }}
          />
        ))}
      </div>
      
      {/* Terminal Header */}
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div 
            className="p-2 bg-gradient-to-br from-evergreen/20 to-evergreen/10 rounded-lg"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Terminal className="w-5 h-5 text-evergreen" />
          </motion.div>
          <div>
            <span className="text-lg font-bold text-evergreen">evergreenOS™</span>
            <span className="text-xs text-gray-medium ml-2">Business Intelligence</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <motion.div 
              className="w-2 h-2 bg-green-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div 
              className="w-2 h-2 bg-green-500/60 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            />
            <motion.div 
              className="w-2 h-2 bg-green-500/30 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
            />
          </div>
          <span className="text-xs text-evergreen font-medium">Connected</span>
        </div>
      </div>

      {/* Welcome Message */}
      <AnimatePresence>
        {showWelcome && !isProcessing && !result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-gradient-to-r from-evergreen-light/50 to-gold/10 rounded-xl border border-evergreen/10"
          >
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Bot className="w-5 h-5 text-evergreen mt-0.5" />
              </motion.div>
              <div>
                <p className="text-sm font-semibold text-evergreen mb-1">Welcome to evergreenOS</p>
                <p className="text-xs text-gray-medium">
                  Ask questions about your business or request actions. I'll analyze your data and help you make informed decisions.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command Input */}
      <form onSubmit={handleSubmit} className="relative">
        <motion.div 
          className="relative group"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-evergreen/30 via-gold/30 to-evergreen/30 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:duration-200" />
          
          <div className="relative flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-evergreen/20 hover:border-evergreen/40 transition-all duration-200 shadow-sm hover:shadow-xl">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5 text-gold flex-shrink-0" />
            </motion.div>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder={`Try: "${SAMPLE_COMMANDS[currentPlaceholder].text}"`}
              className="flex-1 bg-transparent text-charcoal placeholder:text-gray-medium/60 outline-none text-base font-medium"
              disabled={isProcessing}
              autoFocus
            />
            <motion.button
              type="submit"
              disabled={isProcessing || !command.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-evergreen to-evergreen-dark text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm relative z-10">Ask</span>
              <Send className="w-4 h-4 relative z-10" />
            </motion.button>
          </div>
        </motion.div>
      </form>

      {/* Sample Commands - Vertical Layout */}
      <div className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Questions Section */}
          <div>
            <p className="text-xs text-gray-medium uppercase tracking-wider font-semibold mb-3">Ask Questions:</p>
            <div className="space-y-2">
              {questionCommands.slice(0, 4).map((cmd, idx) => {
                const Icon = cmd.icon
                return (
                  <motion.button
                    key={idx}
                    onClick={() => handleCommand(cmd.text)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-gradient-to-r hover:from-evergreen-light/50 hover:to-gold/10 border border-evergreen/10 hover:border-evergreen/30 rounded-lg transition-all text-left group hover:shadow-md"
                    disabled={isProcessing}
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Icon className="w-4 h-4 text-evergreen group-hover:text-gold transition-colors flex-shrink-0" />
                    <span className="text-sm text-charcoal">{cmd.text}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Actions Section */}
          <div>
            <p className="text-xs text-gray-medium uppercase tracking-wider font-semibold mb-3">Request Actions:</p>
            <div className="space-y-2">
              {actionCommands.map((cmd, idx) => {
                const Icon = cmd.icon
                return (
                  <motion.button
                    key={idx}
                    onClick={() => handleCommand(cmd.text)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-evergreen-light/30 border border-blue-200/50 hover:border-blue-300 rounded-lg transition-all text-left group hover:shadow-md"
                    disabled={isProcessing}
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Icon className="w-4 h-4 text-blue-600 group-hover:text-evergreen transition-colors flex-shrink-0" />
                    <span className="text-sm text-charcoal">{cmd.text}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Processing Animation */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <div className="p-4 bg-gradient-to-r from-evergreen-light/40 to-gold/10 rounded-xl border border-evergreen/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <motion.div
                    className="w-10 h-10 border-2 border-evergreen/20 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute inset-0 w-10 h-10 border-2 border-t-evergreen border-r-transparent border-b-transparent border-l-transparent rounded-full"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                  <Sparkle className="w-4 h-4 text-gold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-evergreen">Analyzing your request...</p>
                  <motion.div
                    key={processingStep}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm text-gray-medium mt-1"
                  >
                    {PROCESSING_STEPS[processingStep]?.text}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Display with typing effect */}
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
            <motion.div 
              className="p-6 bg-gradient-to-br from-white to-evergreen-light/20 rounded-xl border border-evergreen/20 shadow-xl"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <motion.div 
                      className={`w-2 h-2 rounded-full ${
                        result.type === 'action' ? 'bg-blue-500' :
                        result.type === 'question' ? 'bg-green-500' : 'bg-amber-500'
                      }`}
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span className="text-xs font-medium text-gray-medium uppercase tracking-wide">
                      {result.type === 'action' ? 'ACTION PROPOSAL' : 
                       result.type === 'question' ? 'ANSWER' : 'ANALYSIS COMPLETE'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-charcoal">{result.title}</h3>
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5 text-gold" />
                </motion.div>
              </div>

              {/* Details with typing effect */}
              <div className="space-y-2 mb-4">
                {result.details.slice(0, currentDetailIndex).map((detail, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-2"
                  >
                    <ChevronRight className="w-4 h-4 text-evergreen mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-charcoal/80">{detail}</p>
                  </motion.div>
                ))}
                {currentDetailIndex < result.details.length && (
                  <div className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-evergreen mt-0.5 flex-shrink-0" />
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" />
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Metrics Grid */}
              {result.metrics && currentDetailIndex >= result.details.length && (
                <motion.div 
                  className="grid grid-cols-3 gap-3 mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {result.metrics.map((metric, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ 
                        delay: 0.6 + idx * 0.1,
                        type: "spring",
                        stiffness: 500
                      }}
                      className="bg-white/80 rounded-lg p-3 border border-evergreen/10 relative overflow-hidden group hover:shadow-lg transition-shadow"
                      whileHover={{ y: -2 }}
                    >
                      <p className="text-xs text-gray-medium mb-1">{metric.label}</p>
                      <p className="text-lg font-bold text-evergreen">{metric.value}</p>
                      {metric.change && (
                        <p className={`text-xs mt-1 font-medium ${
                          metric.change.startsWith('+') ? 'text-green-600' :
                          metric.change.startsWith('-') ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                          {metric.change}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Proposed Actions for confirmation */}
              {result.proposedActions && !executingAction && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-evergreen/10 pt-4"
                >
                  <p className="text-sm font-semibold text-evergreen mb-3">Proposed Actions:</p>
                  <div className="space-y-2 mb-4">
                    {result.proposedActions.map((action, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-2 text-sm text-charcoal/70"
                      >
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-semibold text-blue-600">{idx + 1}</span>
                        </div>
                        <span>{action}</span>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Action buttons - Always show for action commands */}
                  <div className="flex gap-3">
                    <motion.button
                      onClick={handleExecuteAction}
                      className="px-6 py-2 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
                      style={{ backgroundColor: '#1D5238' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Execute Actions</span>
                    </motion.button>
                    <motion.button
                      onClick={handleCancelAction}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Cancel</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Executing state */}
              {executingAction && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-evergreen/10 pt-4"
                >
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-evergreen animate-spin" />
                    <p className="text-sm font-medium text-evergreen">Executing actions...</p>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Footer */}
            <motion.div 
              className="flex items-center justify-between p-3 bg-evergreen-light/30 rounded-lg border border-evergreen/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <span className="text-xs text-gray-medium">Response time: 0.8s</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-medium">Powered by</span>
                <span className="text-xs font-bold text-evergreen">evergreenOS AI</span>
                <motion.div
                  className="w-2 h-2 bg-green-500 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}