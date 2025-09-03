'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Inbox, Send, FileText, Upload, Settings, Calendar, Clock, Users, Plus, CalendarDays, Timer, Building2, User, TrendingUp, BarChart3, Brain, Target } from 'lucide-react'

interface ModuleItem {
  label: string
  icon: React.ReactNode
  path: string
}

interface Module {
  id: string
  icon: React.ReactNode
  label: string
  items: ModuleItem[]
}

export default function Sidebar() {
  const router = useRouter()
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const sidebarRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC',
    darkBg: '#0F172A',
    darkSurface: '#1E293B'
  }

  const modules: Module[] = [
    {
      id: 'evermail',
      icon: <Mail size={24} strokeWidth={2} />,
      label: 'EverMail',
      items: [
        { label: 'Inbox', icon: <Inbox size={18} />, path: '/mail/inbox' },
        { label: 'Sent', icon: <Send size={18} />, path: '/mail/sent' },
        { label: 'Drafts', icon: <FileText size={18} />, path: '/mail/drafts' },
        { label: 'Email Settings', icon: <Settings size={18} />, path: '/mail/settings' }
      ]
    },
    {
      id: 'evercal',
      icon: <Calendar size={24} strokeWidth={2} />,
      label: 'EverCal',
      items: [
        { label: 'My Calendar', icon: <CalendarDays size={18} />, path: '/dashboard/calendar' },
        { label: 'Schedule Meeting', icon: <Plus size={18} />, path: '/dashboard/calendar?action=new' },
        { label: 'Availability', icon: <Clock size={18} />, path: '/dashboard/calendar?view=availability' },
        { label: 'Meeting History', icon: <Users size={18} />, path: '/dashboard/calendar?view=history' },
        { label: 'Working Hours', icon: <Timer size={18} />, path: '/dashboard/calendar?view=settings' }
      ]
    },
    {
      id: 'evercore',
      icon: <Users size={24} strokeWidth={2} />,
      label: 'EverCore',
      items: [
        { label: 'Dashboard', icon: <BarChart3 size={18} />, path: '/dashboard/crm' },
        { label: 'Contacts', icon: <User size={18} />, path: '/dashboard/crm/contacts' },
        { label: 'Companies', icon: <Building2 size={18} />, path: '/dashboard/crm/companies' },
        { label: 'Deals', icon: <Target size={18} />, path: '/dashboard/crm/deals' },
        { label: 'Pipeline', icon: <TrendingUp size={18} />, path: '/dashboard/crm/pipeline' },
        { label: 'Insights', icon: <Brain size={18} />, path: '/dashboard/crm/insights' },
        { label: 'Import Data', icon: <Upload size={18} />, path: '/dashboard/crm/import' },
        { label: 'Settings', icon: <Settings size={18} />, path: '/dashboard/crm/settings' }
      ]
    }
  ]

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (sidebarRef.current) {
        const rect = sidebarRef.current.getBoundingClientRect()
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleModuleHover = (moduleId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setActiveModule(moduleId)
  }

  const handleModuleLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveModule(null)
    }, 300) // Increased delay to allow moving to panel
  }

  const handlePanelEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
  }

  const handlePanelLeave = () => {
    setActiveModule(null)
  }

  const handleItemClick = (path: string) => {
    router.push(path)
    setActiveModule(null)
  }

  const activeModuleData = modules.find(m => m.id === activeModule)

  return (
    <>
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '70px',
          height: '100vh',
          backgroundColor: colors.white,
          borderRight: `1px solid ${colors.lightGray}40`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '80px',
          gap: '8px',
          zIndex: 50
        }}
      >
        {modules.map((module) => (
          <motion.button
            key={module.id}
            onMouseEnter={() => handleModuleHover(module.id)}
            onMouseLeave={handleModuleLeave}
            onClick={() => {
              // Navigate to the first item in the module on click
              if (module.items.length > 0) {
                router.push(module.items[0].path)
              }
            }}
            style={{
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: activeModule === module.id ? colors.softGreen : 'transparent',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              color: activeModule === module.id ? colors.evergreen : colors.mediumGray,
              transition: 'all 200ms ease-out',
              position: 'relative'
            }}
            whileHover={{
              backgroundColor: colors.softGreen,
              color: colors.evergreen
            }}
            whileTap={{
              scale: 0.95
            }}
          >
            {module.icon}
            
            {/* Active indicator dot */}
            {activeModule === module.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '6px',
                  width: '6px',
                  height: '6px',
                  backgroundColor: colors.evergreen,
                  borderRadius: '50%'
                }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Hover Panel */}
      <AnimatePresence>
        {activeModule && activeModuleData && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onMouseEnter={handlePanelEnter}
            onMouseLeave={handlePanelLeave}
            style={{
              position: 'fixed',
              left: '80px', // Slightly overlapping to prevent gap
              top: '120px', // Fixed position instead of following mouse
              minWidth: '240px',
              backgroundColor: colors.white,
              border: `1px solid ${colors.lightGray}40`,
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
              padding: '12px',
              zIndex: 100,
              maxHeight: 'calc(100vh - 140px)',
              overflowY: 'auto'
            }}
          >
            {/* Module Title */}
            <div style={{
              padding: '8px 12px',
              marginBottom: '8px',
              borderBottom: `1px solid ${colors.lightGray}40`
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 600,
                color: colors.evergreen,
                letterSpacing: '-0.01em',
                margin: 0
              }}>
                {activeModuleData.label}
              </h3>
            </div>

            {/* Module Items */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              {activeModuleData.items.map((item, index) => (
                <motion.button
                  key={item.path}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  onClick={() => handleItemClick(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 150ms ease-out',
                    width: '100%',
                    textAlign: 'left'
                  }}
                  whileHover={{
                    backgroundColor: colors.softGreen,
                    x: 4
                  }}
                  whileTap={{
                    scale: 0.98
                  }}
                >
                  <span style={{
                    color: colors.mediumGray,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px'
                  }}>
                    {item.icon}
                  </span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: colors.charcoal,
                    flex: 1
                  }}>
                    {item.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}