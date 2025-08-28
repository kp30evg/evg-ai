'use client'

import { motion } from 'framer-motion'
import { TrendingUp, DollarSign, Building2, Globe2, Cpu, Users } from 'lucide-react'

export default function OpportunitySection() {
  const opportunities = [
    {
      icon: DollarSign,
      title: '$2 Trillion',
      subtitle: 'Business Software Market',
      description: 'The fragmented SaaS market is ripe for unification',
      highlight: true
    },
    {
      icon: Building2,
      title: '130+ Tools',
      subtitle: 'Average Enterprise Stack',
      description: 'Each requiring separate logins, training, and contracts'
    },
    {
      icon: Users,
      title: '73% Waste',
      subtitle: 'Software Spending',
      description: 'Most features never used, licenses underutilized'
    },
    {
      icon: Globe2,
      title: '10M+ Companies',
      subtitle: 'Ready to Switch',
      description: 'Tired of juggling dozens of disconnected tools'
    },
    {
      icon: Cpu,
      title: 'AI Revolution',
      subtitle: 'Perfect Timing',
      description: 'Natural language finally makes unified systems possible'
    },
    {
      icon: TrendingUp,
      title: '48-Hour Migration',
      subtitle: 'Our Guarantee',
      description: 'Or we pay you $10,000 for your time'
    }
  ]

  return (
    <section className="relative py-16 md:py-20 bg-gray-50">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-light rounded-full text-sm font-medium text-gray-medium mb-6">
              <TrendingUp className="w-4 h-4" />
              THE OPPORTUNITY
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-charcoal leading-tight mb-6">
              The $2 Trillion Problem<br />
              <span className="text-evergreen">We're Solving</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-medium max-w-3xl mx-auto">
              Business software is broken. 130+ tools. Zero integration. 
              Infinite complexity. Until now.
            </p>
          </motion.div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opp, index) => {
            const Icon = opp.icon
            
            return (
              <motion.div
                key={opp.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`
                  bg-white rounded-xl p-8 border transition-all duration-120 cursor-pointer hover:-translate-y-1 hover:shadow-hover
                  ${opp.highlight 
                    ? 'md:col-span-2 lg:col-span-1 bg-gradient-to-br from-evergreen-light via-white to-white border-evergreen/20' 
                    : 'border-gray-light/50'
                  }
                `}
              >
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center mb-5
                  ${opp.highlight ? 'bg-evergreen/10' : 'bg-evergreen-light'}
                `}>
                  <Icon className="w-6 h-6 text-evergreen" strokeWidth={1.5} />
                </div>
                <h3 className="text-3xl font-bold text-evergreen mb-2">{opp.title}</h3>
                <p className="text-base font-semibold text-charcoal mb-3">{opp.subtitle}</p>
                <p className="text-sm text-gray-medium leading-relaxed">{opp.description}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Stats Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-16 p-10 bg-white rounded-xl border border-gray-light/50 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          <div className="text-center border-r border-gray-light last:border-r-0">
            <div className="text-4xl font-bold text-evergreen mb-2">87%</div>
            <div className="text-sm text-gray-medium">Cost Reduction</div>
          </div>
          <div className="text-center border-r border-gray-light last:border-r-0">
            <div className="text-4xl font-bold text-evergreen mb-2">4.2x</div>
            <div className="text-sm text-gray-medium">Productivity Gain</div>
          </div>
          <div className="text-center border-r border-gray-light last:border-r-0">
            <div className="text-4xl font-bold text-evergreen mb-2">100%</div>
            <div className="text-sm text-gray-medium">Data Unified</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-evergreen mb-2">48hr</div>
            <div className="text-sm text-gray-medium">Full Migration</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}