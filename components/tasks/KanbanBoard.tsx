'use client'

import React from 'react'
import { theme } from '@/lib/evercore/theme'
import { 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  User,
  Calendar,
  Flag
} from 'lucide-react'

interface KanbanBoardProps {
  tasks: any[]
  onTaskClick?: (task: any) => void
  onStatusChange?: (taskId: string, newStatus: string) => void
}

const columns = [
  { id: 'todo', title: 'To Do', color: theme.colors.blue },
  { id: 'in_progress', title: 'In Progress', color: theme.colors.orange },
  { id: 'review', title: 'Review', color: theme.colors.purple },
  { id: 'done', title: 'Done', color: theme.colors.green }
]

export default function KanbanBoard({ tasks, onTaskClick, onStatusChange }: KanbanBoardProps) {
  const tasksByStatus = {
    todo: tasks.filter(t => !t.data?.status || t.data?.status === 'todo'),
    in_progress: tasks.filter(t => t.data?.status === 'in_progress'),
    review: tasks.filter(t => t.data?.status === 'review'),
    done: tasks.filter(t => t.data?.status === 'done')
  }
  
  const getPriorityColor = (priority: string) => {
    switch(priority?.toLowerCase()) {
      case 'critical': return theme.colors.red
      case 'high': return theme.colors.orange
      case 'medium': return theme.colors.yellow
      case 'low': return theme.colors.green
      default: return theme.colors.mediumGray
    }
  }
  
  const getTimeUntil = (date: string) => {
    const now = new Date()
    const dueDate = new Date(date)
    const diff = dueDate.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (diff < 0) return 'Overdue'
    if (hours < 24) return `${hours}h`
    return `${days}d`
  }
  
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId)
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }
  
  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId && onStatusChange) {
      onStatusChange(taskId, newStatus)
    }
  }
  
  const TaskCard = ({ task }: { task: any }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, task.id)}
      onClick={() => onTaskClick?.(task)}
      style={{
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.base,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        border: `1px solid ${theme.colors.lightGray}`,
        cursor: 'pointer',
        transition: theme.transitions.fast,
        boxShadow: theme.shadows.sm
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = theme.shadows.md
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = theme.shadows.sm
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Task Title */}
      <div style={{
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.charcoal,
        marginBottom: theme.spacing.sm
      }}>
        {task.data?.title || 'Untitled Task'}
      </div>
      
      {/* Task Description */}
      {task.data?.description && (
        <div style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.mediumGray,
          marginBottom: theme.spacing.md,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {task.data.description}
        </div>
      )}
      
      {/* Task Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Priority */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.xs
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: getPriorityColor(task.data?.priority)
          }} />
          <span style={{
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.mediumGray,
            textTransform: 'capitalize'
          }}>
            {task.data?.priority || 'medium'}
          </span>
        </div>
        
        {/* Due Date */}
        {task.data?.dueDate && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs,
            fontSize: theme.typography.fontSize.xs,
            color: new Date(task.data.dueDate) < new Date() && task.data?.status !== 'done'
              ? theme.colors.red
              : theme.colors.mediumGray
          }}>
            <Calendar size={12} />
            {getTimeUntil(task.data.dueDate)}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: theme.spacing.lg
    }}>
      {columns.map(column => (
        <div key={column.id}>
          {/* Column Header */}
          <div style={{
            backgroundColor: theme.colors.white,
            borderRadius: theme.borderRadius.base,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderTop: `3px solid ${column.color}`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.charcoal,
                margin: 0
              }}>
                {column.title}
              </h3>
              <span style={{
                backgroundColor: column.color + '20',
                color: column.color,
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                borderRadius: theme.borderRadius.full,
                fontSize: theme.typography.fontSize.xs,
                fontWeight: theme.typography.fontWeight.semibold
              }}>
                {tasksByStatus[column.id as keyof typeof tasksByStatus].length}
              </span>
            </div>
          </div>
          
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
            style={{
              minHeight: '200px',
              backgroundColor: theme.colors.softGray,
              borderRadius: theme.borderRadius.base,
              padding: theme.spacing.sm,
              border: `2px dashed transparent`,
              transition: theme.transitions.fast
            }}
            onDragEnter={(e) => {
              e.currentTarget.style.borderColor = column.color
              e.currentTarget.style.backgroundColor = column.color + '10'
            }}
            onDragLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.backgroundColor = theme.colors.softGray
            }}
          >
            {tasksByStatus[column.id as keyof typeof tasksByStatus].map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
            
            {tasksByStatus[column.id as keyof typeof tasksByStatus].length === 0 && (
              <div style={{
                padding: theme.spacing.lg,
                textAlign: 'center',
                color: theme.colors.mediumGray,
                fontSize: theme.typography.fontSize.sm
              }}>
                No tasks
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}