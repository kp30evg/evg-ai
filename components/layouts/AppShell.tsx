'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import CommandBar from './CommandBar'
import { theme } from '@/lib/evercore/theme'
import { useRouter } from 'next/navigation'

interface AppShellProps {
  children: React.ReactNode
  showCommandBar?: boolean
  showSidebar?: boolean
}

export default function AppShell({ 
  children, 
  showCommandBar = true,
  showSidebar = true 
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isProcessingCommand, setIsProcessingCommand] = useState(false)
  const router = useRouter()

  // Persist sidebar state
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed')
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState))
    }
  }, [])

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState))
  }

  const handleCommand = async (command: string) => {
    setIsProcessingCommand(true)
    
    // Simple command routing (this would be enhanced in Section 2)
    const lowerCommand = command.toLowerCase()
    
    try {
      if (lowerCommand.includes('contact') || lowerCommand.includes('lead')) {
        router.push('/dashboard/crm?tab=contacts')
      } else if (lowerCommand.includes('deal') || lowerCommand.includes('pipeline')) {
        router.push('/dashboard/crm?tab=deals')
      } else if (lowerCommand.includes('company') || lowerCommand.includes('account')) {
        router.push('/dashboard/crm?tab=companies')
      } else if (lowerCommand.includes('email')) {
        router.push('/mail')
      } else if (lowerCommand.includes('chat') || lowerCommand.includes('message')) {
        router.push('/chat')
      } else if (lowerCommand.includes('calendar') || lowerCommand.includes('meeting')) {
        router.push('/calendar')
      } else if (lowerCommand.includes('setting')) {
        router.push('/settings')
      } else {
        // In Section 2, this would trigger the AI command processor
        console.log('Processing command:', command)
      }
    } finally {
      setTimeout(() => setIsProcessingCommand(false), 500)
    }
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: theme.colors.lightGray + '20',
      overflow: 'hidden',
    }}>
      {/* Sidebar */}
      {showSidebar && (
        <Sidebar 
          isCollapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />
      )}

      {/* Main Content Area */}
      <motion.div
        animate={{
          marginLeft: showSidebar 
            ? (sidebarCollapsed ? theme.layout.sidebarCollapsedWidth : theme.layout.sidebarExpandedWidth)
            : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Command Bar */}
        {showCommandBar && (
          <CommandBar 
            onExecute={handleCommand}
            isProcessing={isProcessingCommand}
            placeholder="Type a command or search... Try 'Show me contacts with high deal potential'"
          />
        )}

        {/* Page Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          position: 'relative',
        }}>
          <div style={{
            minHeight: '100%',
            paddingTop: showCommandBar ? 0 : theme.layout.commandBarHeight,
          }}>
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  )
}