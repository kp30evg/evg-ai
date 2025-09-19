'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { WorkspaceConfiguration, NavigationItem, EntityTypeDefinition, ViewConfiguration, WorkspaceTemplate } from '@/lib/services/workspace/workspace-config'
import { workspaceConfigService } from '@/lib/services/workspace/workspace-config'
import { useOrganization } from '@clerk/nextjs'
import { trpc } from '@/lib/trpc/client'

interface WorkspaceConfigContextState {
  // Configuration
  config: WorkspaceConfiguration | null
  loading: boolean
  error: string | null
  
  // Navigation
  navigation: NavigationItem[]
  addNavigationItem: (item: Omit<NavigationItem, 'id' | 'order'>) => Promise<void>
  updateNavigationItem: (id: string, updates: Partial<NavigationItem>) => Promise<void>
  removeNavigationItem: (id: string) => Promise<void>
  reorderNavigation: (items: NavigationItem[]) => Promise<void>
  
  // Entity Types
  entityTypes: EntityTypeDefinition[]
  addEntityType: (entityType: Omit<EntityTypeDefinition, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateEntityType: (id: string, updates: Partial<EntityTypeDefinition>) => Promise<void>
  removeEntityType: (id: string) => Promise<void>
  getEntityType: (name: string) => EntityTypeDefinition | undefined
  
  // Views
  views: ViewConfiguration[]
  addView: (view: Omit<ViewConfiguration, 'id'>) => Promise<void>
  updateView: (id: string, updates: Partial<ViewConfiguration>) => Promise<void>
  removeView: (id: string) => Promise<void>
  setDefaultView: (entityType: string, viewId: string) => Promise<void>
  
  // Templates
  templates: WorkspaceTemplate[]
  applyTemplate: (templateId: string) => Promise<void>
  saveAsTemplate: (name: string, description: string) => Promise<void>
  
  // Actions
  refreshConfig: () => Promise<void>
  resetToDefault: () => Promise<void>
  exportConfig: () => string
  importConfig: (configJson: string) => Promise<void>
}

const WorkspaceConfigContext = createContext<WorkspaceConfigContextState | undefined>(undefined)

export function WorkspaceConfigProvider({ children }: { children: ReactNode }) {
  const { organization } = useOrganization()
  const [config, setConfig] = useState<WorkspaceConfiguration | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Get workspace ID from organization
  const workspaceId = organization?.id || ''

  // Use tRPC to fetch configuration
  const { data: savedConfig, isLoading: loading, refetch } = trpc.workspaceConfig.get.useQuery(
    undefined,
    {
      enabled: !!workspaceId,
      staleTime: 30000, // Cache for 30 seconds
      onError: (err) => {
        console.error('Failed to load workspace configuration:', err)
        setError('Failed to load workspace configuration')
      }
    }
  )

  // Use tRPC mutations
  const saveConfigMutation = trpc.workspaceConfig.save.useMutation()
  const addNavigationItemMutation = trpc.workspaceConfig.addNavigationItem.useMutation()
  const updateNavigationItemMutation = trpc.workspaceConfig.updateNavigationItem.useMutation()
  const removeNavigationItemMutation = trpc.workspaceConfig.removeNavigationItem.useMutation()
  const applyTemplateMutation = trpc.workspaceConfig.applyTemplate.useMutation()

  // Get templates
  const { data: templatesData } = trpc.workspaceConfig.getTemplates.useQuery()

  // Set config when data is loaded
  useEffect(() => {
    if (savedConfig) {
      setConfig(savedConfig)
    } else if (!loading && workspaceId) {
      // Use default configuration if no saved config
      const defaultConfig = workspaceConfigService.getDefaultConfiguration(workspaceId)
      setConfig(defaultConfig)
    }
  }, [savedConfig, loading, workspaceId])

  // Navigation management
  const addNavigationItem = async (item: Omit<NavigationItem, 'id' | 'order'>) => {
    if (!config) return
    
    try {
      await addNavigationItemMutation.mutateAsync(item)
      await refetch()
    } catch (err) {
      console.error('Failed to add navigation item:', err)
      setError('Failed to add navigation item')
    }
  }

  const updateNavigationItem = async (id: string, updates: Partial<NavigationItem>) => {
    if (!config) return
    
    try {
      await updateNavigationItemMutation.mutateAsync({ id, updates })
      await refetch()
    } catch (err) {
      console.error('Failed to update navigation item:', err)
      setError('Failed to update navigation item')
    }
  }

  const removeNavigationItem = async (id: string) => {
    if (!config) return
    
    try {
      await removeNavigationItemMutation.mutateAsync({ id })
      await refetch()
    } catch (err) {
      console.error('Failed to remove navigation item:', err)
      setError('Failed to remove navigation item')
    }
  }

  const reorderNavigation = async (items: NavigationItem[]) => {
    if (!config) return
    
    const reorderedItems = items.map((item, index) => ({
      ...item,
      order: index
    }))
    
    try {
      await saveConfigMutation.mutateAsync({ navigation: reorderedItems })
      await refetch()
    } catch (err) {
      console.error('Failed to reorder navigation:', err)
      setError('Failed to reorder navigation')
    }
  }

  // Entity type management
  const addEntityType = async (entityType: Omit<EntityTypeDefinition, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!config) return
    
    const newEntityType: EntityTypeDefinition = {
      ...entityType,
      id: `entity_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const updatedEntityTypes = [...config.entityTypes, newEntityType]
    
    try {
      await saveConfigMutation.mutateAsync({ entityTypes: updatedEntityTypes })
      await refetch()
    } catch (err) {
      console.error('Failed to add entity type:', err)
      setError('Failed to add entity type')
    }
  }

  const updateEntityType = async (id: string, updates: Partial<EntityTypeDefinition>) => {
    if (!config) return
    
    const updatedEntityTypes = config.entityTypes.map(type =>
      type.id === id ? { ...type, ...updates, updatedAt: new Date() } : type
    )
    
    try {
      await saveConfigMutation.mutateAsync({ entityTypes: updatedEntityTypes })
      await refetch()
    } catch (err) {
      console.error('Failed to update entity type:', err)
      setError('Failed to update entity type')
    }
  }

  const removeEntityType = async (id: string) => {
    if (!config) return
    
    const updatedEntityTypes = config.entityTypes.filter(type => type.id !== id)
    
    // Also remove navigation items for this entity type
    const entityType = config.entityTypes.find(t => t.id === id)
    const updatedNavigation = config.navigation.filter(
      item => item.entityType !== entityType?.name
    )
    
    try {
      await saveConfigMutation.mutateAsync({ 
        entityTypes: updatedEntityTypes,
        navigation: updatedNavigation
      })
      await refetch()
    } catch (err) {
      console.error('Failed to remove entity type:', err)
      setError('Failed to remove entity type')
    }
  }

  const getEntityType = (name: string): EntityTypeDefinition | undefined => {
    return config?.entityTypes.find(type => type.name === name)
  }

  // View management
  const addView = async (view: Omit<ViewConfiguration, 'id'>) => {
    if (!config) return
    
    const newView: ViewConfiguration = {
      ...view,
      id: `view_${Date.now()}`
    }
    
    const updatedViews = [...config.views, newView]
    
    try {
      await saveConfigMutation.mutateAsync({ views: updatedViews })
      await refetch()
    } catch (err) {
      console.error('Failed to add view:', err)
      setError('Failed to add view')
    }
  }

  const updateView = async (id: string, updates: Partial<ViewConfiguration>) => {
    if (!config) return
    
    const updatedViews = config.views.map(view =>
      view.id === id ? { ...view, ...updates } : view
    )
    
    try {
      await saveConfigMutation.mutateAsync({ views: updatedViews })
      await refetch()
    } catch (err) {
      console.error('Failed to update view:', err)
      setError('Failed to update view')
    }
  }

  const removeView = async (id: string) => {
    if (!config) return
    
    const updatedViews = config.views.filter(view => view.id !== id)
    
    try {
      await saveConfigMutation.mutateAsync({ views: updatedViews })
      await refetch()
    } catch (err) {
      console.error('Failed to remove view:', err)
      setError('Failed to remove view')
    }
  }

  const setDefaultView = async (entityType: string, viewId: string) => {
    if (!config) return
    
    const updatedViews = config.views.map(view => ({
      ...view,
      isDefault: view.entityType === entityType ? view.id === viewId : view.isDefault
    }))
    
    try {
      await saveConfigMutation.mutateAsync({ views: updatedViews })
      await refetch()
    } catch (err) {
      console.error('Failed to set default view:', err)
      setError('Failed to set default view')
    }
  }

  // Template management
  const templates = templatesData || []

  const applyTemplate = async (templateId: string) => {
    if (!workspaceId) return
    
    try {
      await applyTemplateMutation.mutateAsync({ templateId })
      await refetch()
    } catch (err) {
      console.error('Failed to apply template:', err)
      setError('Failed to apply template')
    }
  }

  const saveAsTemplate = async (name: string, description: string) => {
    if (!config) return
    
    // In a production app, this would save to a template repository
    console.log('Saving workspace as template:', { name, description })
    // For now, just export the configuration
    const exported = exportConfig()
    console.log('Exported configuration:', exported)
  }

  // Utility actions
  const refreshConfig = async () => {
    await refetch()
  }

  const resetToDefault = async () => {
    if (!workspaceId) return
    
    const defaultConfig = workspaceConfigService.getDefaultConfiguration(workspaceId)
    
    try {
      await saveConfigMutation.mutateAsync({
        navigation: defaultConfig.navigation,
        entityTypes: defaultConfig.entityTypes,
        views: defaultConfig.views,
        theme: defaultConfig.theme,
        features: defaultConfig.features
      })
      await refetch()
    } catch (err) {
      console.error('Failed to reset to default:', err)
      setError('Failed to reset to default')
    }
  }

  const exportConfig = (): string => {
    if (!config) return '{}'
    
    const exportData = {
      ...config,
      id: undefined,
      workspaceId: undefined
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  const importConfig = async (configJson: string) => {
    if (!workspaceId) return
    
    try {
      const importedConfig = JSON.parse(configJson)
      await saveConfigMutation.mutateAsync({
        navigation: importedConfig.navigation,
        entityTypes: importedConfig.entityTypes,
        views: importedConfig.views,
        theme: importedConfig.theme,
        features: importedConfig.features
      })
      await refetch()
    } catch (err) {
      console.error('Failed to import configuration:', err)
      setError('Failed to import configuration')
    }
  }

  const value: WorkspaceConfigContextState = {
    config,
    loading,
    error,
    navigation: config?.navigation || [],
    entityTypes: config?.entityTypes || [],
    views: config?.views || [],
    templates,
    addNavigationItem,
    updateNavigationItem,
    removeNavigationItem,
    reorderNavigation,
    addEntityType,
    updateEntityType,
    removeEntityType,
    getEntityType,
    addView,
    updateView,
    removeView,
    setDefaultView,
    applyTemplate,
    saveAsTemplate,
    refreshConfig,
    resetToDefault,
    exportConfig,
    importConfig
  }

  return (
    <WorkspaceConfigContext.Provider value={value}>
      {children}
    </WorkspaceConfigContext.Provider>
  )
}

export function useWorkspaceConfig() {
  const context = useContext(WorkspaceConfigContext)
  if (!context) {
    throw new Error('useWorkspaceConfig must be used within WorkspaceConfigProvider')
  }
  return context
}