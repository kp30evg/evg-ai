'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Grid, List, Calendar, Users, Search, Filter, ChevronDown, LayoutGrid, ListTodo, User, CalendarDays } from 'lucide-react'
import { theme } from '@/lib/evercore/theme'
import NewProjectModal from '@/components/tasks/NewProjectModal'
import ProjectCard from '@/components/tasks/ProjectCard'
import { trpc } from '@/lib/trpc/client'
import TaskOverview from './overview'
import ProjectsView from './projects'
import TasksListView from './tasks-list'
import MyTasksView from './my-tasks'
import CalendarView from './calendar'

export default function TasksPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Fetch projects from database
  const { data: projects = [], isLoading, refetch } = trpc.evertask.getProjects.useQuery()
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'projects', label: 'Projects', icon: Grid },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
    { id: 'my-tasks', label: 'My Tasks', icon: User },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays }
  ]
  
  // Filter projects based on search
  const filteredProjects = projects.filter(project => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      project.data?.name?.toLowerCase().includes(searchLower) ||
      project.data?.description?.toLowerCase().includes(searchLower)
    )
  })
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <TaskOverview />
      case 'projects':
        return <ProjectsView projects={filteredProjects} searchQuery={searchQuery} setSearchQuery={setSearchQuery} viewMode={viewMode} setViewMode={setViewMode} isLoading={isLoading} refetch={refetch} />
      case 'tasks':
        return <TasksListView />
      case 'my-tasks':
        return <MyTasksView />
      case 'calendar':
        return <CalendarView />
      default:
        return <TaskOverview />
    }
  }

  return (
    <>
      <div style={{
        backgroundColor: theme.colors.softGray,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: theme.colors.white,
          borderBottom: `1px solid ${theme.colors.lightGray}`,
        }}>
          <div style={{
            padding: `${theme.spacing.xl} ${theme.spacing['2xl']}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h1 style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.charcoal,
                margin: 0,
                marginBottom: theme.spacing.xs
              }}>
                EverTask
              </h1>
              <p style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.mediumGray,
                margin: 0
              }}>
                Intelligent project management integrated with your CRM
              </p>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div style={{
            paddingLeft: theme.spacing['2xl'],
            paddingRight: theme.spacing['2xl'],
            display: 'flex',
            gap: theme.spacing['2xl']
          }}>
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    backgroundColor: 'transparent',
                    border: 'none',
                    paddingTop: theme.spacing.md,
                    paddingBottom: theme.spacing.md,
                    paddingLeft: 0,
                    paddingRight: 0,
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: activeTab === tab.id ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
                    color: activeTab === tab.id ? theme.colors.charcoal : theme.colors.mediumGray,
                    cursor: 'pointer',
                    borderBottom: `2px solid ${activeTab === tab.id ? theme.colors.evergreen : 'transparent'}`,
                    transition: theme.transitions.fast
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = theme.colors.charcoal
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = theme.colors.mediumGray
                    }
                  }}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div style={{
          flex: 1,
          overflow: 'auto'
        }}>
          {renderTabContent()}
        </div>

      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <NewProjectModal onClose={() => {
          setShowNewProjectModal(false)
          refetch() // Refresh the projects list
        }} />
      )}
    </>
  )
}