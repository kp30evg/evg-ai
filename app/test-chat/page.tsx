'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Send, Loader2 } from 'lucide-react'

export default function TestChatPage() {
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([])
  const [isLoading, setIsLoading] = useState(false)

  // Mock workspace ID for testing
  const MOCK_WORKSPACE_ID = '123e4567-e89b-12d3-a456-426614174000'

  const handleSendMessage = async () => {
    if (!message.trim()) return

    const userMessage = message
    setMessage('')
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      // Test creating a message entity directly
      const response = await fetch('/api/test-entity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'message',
          data: { content: userMessage, channel: 'chat' },
          workspaceId: MOCK_WORKSPACE_ID
        })
      })

      const result = await response.json()
      
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `Message saved with ID: ${result.id || 'error'}. Type: ${result.type || 'unknown'}`
      }])

      // Test natural language command - process ALL commands that look like commands
      const lowerMessage = userMessage.toLowerCase()
      if (
        lowerMessage.includes('create') ||
        lowerMessage.includes('send #') ||
        lowerMessage.includes('show') ||
        lowerMessage.includes('find') ||
        lowerMessage.includes('search') ||
        lowerMessage.includes('why')
      ) {
        const cmdResponse = await fetch('/api/test-command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command: userMessage,
            workspaceId: MOCK_WORKSPACE_ID
          })
        })
        
        const cmdResult = await cmdResponse.json()
        
        // Format the response better for channel messages
        if (cmdResult.success && cmdResult.data?.channel) {
          setChatHistory(prev => [...prev, { 
            role: 'system', 
            content: `✅ ${cmdResult.message || 'Command executed'}\nChannel: ${cmdResult.data.channel}\nTopic: ${cmdResult.data.summaryTopic || 'N/A'}`
          }])
          
          // Show the actual message content if it exists
          if (cmdResult.data?.data?.content) {
            setChatHistory(prev => [...prev, { 
              role: 'assistant', 
              content: cmdResult.data.data.content
            }])
          }
        } else {
          setChatHistory(prev => [...prev, { 
            role: 'system', 
            content: `Command result: ${JSON.stringify(cmdResult.data || cmdResult.error || 'Unknown')}`
          }])
        }
      }
    } catch (error) {
      setChatHistory(prev => [...prev, { 
        role: 'error', 
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '20px' }}>
        Test Chat - Pure Single-Table Architecture
      </h1>
      
      <div style={{ 
        border: '1px solid #e5e7eb', 
        borderRadius: '8px', 
        padding: '20px',
        marginBottom: '20px',
        backgroundColor: '#f9fafb'
      }}>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          This test page demonstrates the pure single-table architecture where ALL data is stored in the entities table.
        </p>
        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '10px' }}>
          Try commands like: "send #sales a message summary on voice agents", "create customer John Doe", "show recent activity"
        </p>
      </div>

      <div style={{ 
        height: '400px', 
        overflowY: 'auto', 
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        backgroundColor: '#ffffff'
      }}>
        {chatHistory.length === 0 ? (
          <p style={{ color: '#9ca3af', textAlign: 'center' }}>
            No messages yet. Start a conversation!
          </p>
        ) : (
          chatHistory.map((msg, idx) => (
            <div 
              key={idx} 
              style={{ 
                marginBottom: '12px',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: msg.role === 'user' ? '#e6f4ec' : 
                               msg.role === 'error' ? '#fee2e2' :
                               msg.role === 'system' ? '#fef3c7' : '#f3f4f6',
                maxWidth: '70%',
                marginLeft: msg.role === 'user' ? 'auto' : '0',
                marginRight: msg.role === 'user' ? '0' : 'auto'
              }}
            >
              <div style={{ 
                fontSize: '11px', 
                color: '#6b7280', 
                marginBottom: '4px',
                fontWeight: 500
              }}>
                {msg.role.toUpperCase()}
              </div>
              <div style={{ fontSize: '14px', color: '#222b2e' }}>
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message or command..."
          style={{
            flex: 1,
            padding: '10px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !message.trim()}
          style={{
            padding: '10px 20px',
            backgroundColor: isLoading || !message.trim() ? '#e5e7eb' : '#1d5238',
            color: isLoading || !message.trim() ? '#9ca3af' : '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: isLoading || !message.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          Send
        </button>
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '16px', 
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
          Architecture Info
        </h3>
        <ul style={{ fontSize: '12px', color: '#6b7280', paddingLeft: '20px' }}>
          <li>All messages are stored as entities with type='message'</li>
          <li>All customers are stored as entities with type='customer'</li>
          <li>All deals are stored as entities with type='deal'</li>
          <li>Everything lives in ONE table with JSONB data</li>
        </ul>
      </div>
    </div>
  )
}