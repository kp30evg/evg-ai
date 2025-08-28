'use client'

import { motion } from 'framer-motion'
import { Terminal, Github, Twitter, Linkedin, Mail, MapPin, Globe } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  const footerLinks = {
    product: [
      { label: 'Features', href: '#features' },
      { label: 'Modules', href: '#modules' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Security', href: '#security' },
      { label: 'Roadmap', href: '#roadmap' },
    ],
    company: [
      { label: 'About', href: '#about' },
      { label: 'Careers', href: '#careers' },
      { label: 'Blog', href: '#blog' },
      { label: 'Press Kit', href: '#press' },
      { label: 'Investors', href: '#investors' },
    ],
    resources: [
      { label: 'Documentation', href: '#docs' },
      { label: 'API Reference', href: '#api' },
      { label: 'Migration Guide', href: '#migration' },
      { label: 'Case Studies', href: '#cases' },
      { label: 'Webinars', href: '#webinars' },
    ],
    support: [
      { label: 'Help Center', href: '#help' },
      { label: 'Contact Sales', href: '#sales' },
      { label: 'System Status', href: '#status' },
      { label: 'Community', href: '#community' },
      { label: 'Partners', href: '#partners' },
    ],
  }

  return (
    <footer className="bg-slate-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="container relative mx-auto px-4 py-16">
        {/* Top Section */}
        <div className="grid lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-8 h-8 text-emerald-400" />
              <span className="text-xl font-bold">evergreenOS</span>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              The unified operating system for business. Command everything.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-4 grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                {footerLinks.product.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2">
                {footerLinks.resources.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2">
                {footerLinks.support.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Middle Section - Newsletter */}
        <div className="border-t border-slate-800 py-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-xl font-semibold mb-2">Stay ahead of the revolution</h3>
              <p className="text-slate-400">Get exclusive insights on the future of business software</p>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-800 pt-8">
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="flex flex-wrap gap-6 text-sm text-slate-400">
              <span>© {currentYear} evergreenOS Inc.</span>
              <a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">Cookie Policy</a>
            </div>
            <div className="flex items-center gap-6 lg:justify-end text-sm text-slate-400">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>San Francisco, CA</span>
              </div>
              <div className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                <span>Available Worldwide</span>
              </div>
            </div>
          </div>
        </div>

        {/* Launch Banner */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-8 p-4 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 rounded-lg border border-emerald-500/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm">
                <span className="text-emerald-400 font-semibold">LAUNCHING SEPTEMBER 19, 2025</span>
                <span className="text-slate-400 ml-2">· Join 10,847 companies on the waitlist</span>
              </span>
            </div>
            <a href="#waitlist" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors">
              Reserve Your Spot →
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}