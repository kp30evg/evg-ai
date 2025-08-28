'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Rocket, 
  Calculator, 
  Share2, 
  CheckCircle, 
  ArrowRight,
  Users,
  TrendingUp,
  Lock,
  Zap,
  Trophy,
  Clock,
  Mail
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ConversionSection() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [position, setPosition] = useState(47833)
  
  // ROI Calculator States
  const [employees, setEmployees] = useState('')
  const [tools, setTools] = useState('')
  const [savings, setSavings] = useState<number | null>(null)

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true)
      setIsSubmitting(false)
      setPosition(prev => prev - Math.floor(Math.random() * 100))
    }, 1500)
  }

  const calculateROI = () => {
    const empCount = parseInt(employees) || 0
    const toolCount = parseInt(tools) || 0
    
    // Calculation: (tools * $500/month avg) + (employees * $2000 productivity gain) + integration savings
    const toolSavings = toolCount * 500 * 12
    const productivityGains = empCount * 2000 * 12
    const integrationSavings = toolCount > 10 ? 50000 : toolCount * 2000
    
    setSavings(toolSavings + productivityGains + integrationSavings)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(num)
  }

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-white via-emerald-50/30 to-slate-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="container relative mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
            <Rocket className="w-4 h-4" />
            LIMITED AVAILABILITY
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Join 10,847 Companies Already Waiting
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            First 10,000 companies get founder pricing. Position #{position.toLocaleString()} available now.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Waitlist Signup Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-8 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
              
              <div className="relative">
                <div className="flex items-center gap-2 mb-6">
                  <Trophy className="w-8 h-8" />
                  <div>
                    <h3 className="text-2xl font-bold">Reserve Your Position</h3>
                    <p className="text-emerald-100">Get founder pricing forever</p>
                  </div>
                </div>

                {!submitted ? (
                  <>
                    <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                      <div>
                        <Input
                          type="email"
                          placeholder="your@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-white/20 border-white/30 text-white placeholder:text-white/70 h-12"
                          required
                        />
                      </div>
                      <Button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-white text-emerald-600 hover:bg-emerald-50 h-12 font-semibold"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-emerald-600 rounded-full animate-spin border-t-transparent" />
                            Securing Position...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            Reserve Position #{position.toLocaleString()}
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        )}
                      </Button>
                    </form>

                    <div className="mt-6 space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>90% lower than enterprise pricing</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>48-hour white-glove migration</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>Lifetime price lock guarantee</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>Direct founder support channel</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                    <h4 className="text-2xl font-bold mb-2">You're In!</h4>
                    <p className="text-emerald-100 mb-4">
                      Position #{position.toLocaleString()} secured
                    </p>
                    <Button
                      onClick={() => {/* Share logic */}}
                      variant="outline"
                      className="bg-white/20 border-white text-white hover:bg-white/30"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share to Jump 1,000 Spots
                    </Button>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* ROI Calculator Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-8 bg-white shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <Calculator className="w-8 h-8 text-emerald-600" />
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Calculate Your Savings</h3>
                  <p className="text-slate-600">See your exact ROI with evergreenOS</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Number of Employees
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g., 50"
                    value={employees}
                    onChange={(e) => setEmployees(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Current Number of Software Tools
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g., 25"
                    value={tools}
                    onChange={(e) => setTools(e.target.value)}
                    className="h-12"
                  />
                </div>
                <Button 
                  onClick={calculateROI}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-12"
                >
                  Calculate Savings
                </Button>
              </div>

              <AnimatePresence>
                {savings !== null && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 p-6 bg-emerald-50 rounded-lg"
                  >
                    <div className="text-center">
                      <p className="text-sm text-emerald-700 mb-2">Annual Savings with evergreenOS</p>
                      <p className="text-4xl font-bold text-emerald-600">{formatNumber(savings)}</p>
                      <p className="text-sm text-slate-600 mt-2">
                        Plus unmeasurable gains in efficiency and growth
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-900">92%</p>
                        <p className="text-xs text-slate-600">Less Software Cost</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-900">48hr</p>
                        <p className="text-xs text-slate-600">Migration Time</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-900">10x</p>
                        <p className="text-xs text-slate-600">Faster Operations</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </div>

        {/* Action Buttons Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 max-w-4xl mx-auto"
        >
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-semibold text-slate-900">Try Live Demo</h4>
                  </div>
                  <p className="text-sm text-slate-600">Experience the magic yourself</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-semibold text-slate-900">Book Demo</h4>
                  </div>
                  <p className="text-sm text-slate-600">15-min personalized walkthrough</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-semibold text-slate-900">Get Whitepaper</h4>
                  </div>
                  <p className="text-sm text-slate-600">Technical architecture deep-dive</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-600">SOC 2 Type II Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-600">10,847 Companies Waiting</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-600">$73M Software Costs Eliminated</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}