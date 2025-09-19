'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { useWorkspaceConfig } from './workspace-config-context'
import { DynamicEntity } from '@/lib/services/workspace/entity-types'
import { EntityTypeDefinition } from '@/lib/services/workspace/workspace-config'
import { trpc } from '@/lib/trpc/client'
import { useOrganization } from '@clerk/nextjs'

interface DynamicEntitiesContextState {
  // Entity data storage - keyed by entity type name
  entities: Record<string, DynamicEntity[]>
  loading: Record<string, boolean>
  errors: Record<string, string | null>
  
  // CRUD operations
  createEntity: (entityType: string, data: Record<string, any>) => Promise<DynamicEntity>
  updateEntity: (entityType: string, entityId: string, updates: Record<string, any>) => Promise<DynamicEntity>
  deleteEntity: (entityType: string, entityId: string) => Promise<void>
  getEntity: (entityType: string, entityId: string) => DynamicEntity | undefined
  
  // Batch operations
  createEntities: (entityType: string, dataArray: Record<string, any>[]) => Promise<DynamicEntity[]>
  deleteEntities: (entityType: string, entityIds: string[]) => Promise<void>
  
  // Query operations
  fetchEntities: (entityType: string, options?: {
    filters?: Record<string, any>
    search?: string
    limit?: number
    offset?: number
    orderBy?: string
    orderDirection?: 'asc' | 'desc'
  }) => Promise<void>
  refreshEntities: (entityType: string) => Promise<void>
  
  // Pipeline operations (for entities with pipelines)
  moveToStage: (entityType: string, entityId: string, stageId: string) => Promise<DynamicEntity>
  
  // Relationship operations
  linkEntities: (fromType: string, fromId: string, toType: string, toId: string, relationshipType: string) => Promise<void>
  unlinkEntities: (fromType: string, fromId: string, toType: string, toId: string) => Promise<void>
  getRelatedEntities: (entityType: string, entityId: string, relatedType: string) => DynamicEntity[]
  
  // Utility functions
  getEntityCount: (entityType: string) => number
  getEntitiesByStage: (entityType: string, stage: string) => DynamicEntity[]
  searchEntities: (entityType: string, query: string) => DynamicEntity[]
  exportEntities: (entityType: string, format: 'csv' | 'json') => string
  importEntities: (entityType: string, data: string, format: 'csv' | 'json') => Promise<number>
}

const DynamicEntitiesContext = createContext<DynamicEntitiesContextState | undefined>(undefined)

export function DynamicEntitiesProvider({ children }: { children: ReactNode }) {
  const { organization } = useOrganization()
  const { entityTypes } = useWorkspaceConfig()
  const [entities, setEntities] = useState<Record<string, DynamicEntity[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string | null>>({})

  const workspaceId = organization?.id || ''

  // Initialize entity storage for each entity type
  useEffect(() => {
    const newEntities: Record<string, DynamicEntity[]> = {}
    const newLoading: Record<string, boolean> = {}
    const newErrors: Record<string, string | null> = {}

    entityTypes.forEach(entityType => {
      if (!entities[entityType.name]) {
        newEntities[entityType.name] = []
        newLoading[entityType.name] = false
        newErrors[entityType.name] = null
      }
    })

    if (Object.keys(newEntities).length > 0) {
      setEntities(prev => ({ ...prev, ...newEntities }))
      setLoading(prev => ({ ...prev, ...newLoading }))
      setErrors(prev => ({ ...prev, ...newErrors }))
    }
  }, [entityTypes])

  // Get entity type definition
  const getEntityTypeDefinition = useCallback((entityTypeName: string): EntityTypeDefinition | undefined => {
    return entityTypes.find(et => et.name === entityTypeName)
  }, [entityTypes])

  // tRPC mutations
  const createEntityMutation = trpc.entityTypes.createEntity.useMutation()
  const updateEntityMutation = trpc.entityTypes.updateEntity.useMutation()
  const deleteEntityMutation = trpc.entityTypes.deleteEntity.useMutation()
  const linkEntitiesMutation = trpc.entityTypes.linkEntities.useMutation()
  const unlinkEntitiesMutation = trpc.entityTypes.unlinkEntities.useMutation()

  // Create entity
  const createEntity = useCallback(async (
    entityTypeName: string, 
    data: Record<string, any>
  ): Promise<DynamicEntity> => {
    const entityType = getEntityTypeDefinition(entityTypeName)
    if (!entityType) {
      throw new Error(`Entity type ${entityTypeName} not found`)
    }

    try {
      const newEntity = await createEntityMutation.mutateAsync({
        entityTypeName,
        data
      })

      setEntities(prev => ({
        ...prev,
        [entityTypeName]: [...(prev[entityTypeName] || []), newEntity]
      }))

      return newEntity
    } catch (error) {
      console.error(`Failed to create ${entityTypeName}:`, error)
      throw error
    }
  }, [getEntityTypeDefinition, createEntityMutation])

  // Update entity
  const updateEntity = useCallback(async (
    entityTypeName: string,
    entityId: string,
    updates: Record<string, any>
  ): Promise<DynamicEntity> => {
    const entityType = getEntityTypeDefinition(entityTypeName)
    if (!entityType) {
      throw new Error(`Entity type ${entityTypeName} not found`)
    }

    try {
      const updatedEntity = await updateEntityMutation.mutateAsync({
        entityId,
        entityTypeName,
        updates
      })

      setEntities(prev => ({
        ...prev,
        [entityTypeName]: (prev[entityTypeName] || []).map(e =>
          e.id === entityId ? updatedEntity : e
        )
      }))

      return updatedEntity
    } catch (error) {
      console.error(`Failed to update ${entityTypeName}:`, error)
      throw error
    }
  }, [getEntityTypeDefinition, updateEntityMutation])

  // Delete entity
  const deleteEntity = useCallback(async (
    entityTypeName: string,
    entityId: string
  ): Promise<void> => {
    try {
      await deleteEntityMutation.mutateAsync({
        entityId,
        entityTypeName
      })

      setEntities(prev => ({
        ...prev,
        [entityTypeName]: (prev[entityTypeName] || []).filter(e => e.id !== entityId)
      }))
    } catch (error) {
      console.error(`Failed to delete ${entityTypeName}:`, error)
      throw error
    }
  }, [deleteEntityMutation])

  // Get single entity
  const getEntity = useCallback((
    entityTypeName: string,
    entityId: string
  ): DynamicEntity | undefined => {
    return entities[entityTypeName]?.find(e => e.id === entityId)
  }, [entities])

  // Batch create
  const createEntities = useCallback(async (
    entityTypeName: string,
    dataArray: Record<string, any>[]
  ): Promise<DynamicEntity[]> => {
    const results: DynamicEntity[] = []
    
    for (const data of dataArray) {
      try {
        const entity = await createEntity(entityTypeName, data)
        results.push(entity)
      } catch (error) {
        console.error('Batch create error:', error)
      }
    }
    
    return results
  }, [createEntity])

  // Batch delete
  const deleteEntities = useCallback(async (
    entityTypeName: string,
    entityIds: string[]
  ): Promise<void> => {
    for (const id of entityIds) {
      await deleteEntity(entityTypeName, id)
    }
  }, [deleteEntity])

  // Fetch entities using tRPC
  const utils = trpc.useUtils()
  const fetchEntities = useCallback(async (
    entityTypeName: string,
    options?: {
      filters?: Record<string, any>
      search?: string
      limit?: number
      offset?: number
      orderBy?: string
      orderDirection?: 'asc' | 'desc'
    }
  ): Promise<void> => {
    if (!workspaceId) return

    setLoading(prev => ({ ...prev, [entityTypeName]: true }))
    setErrors(prev => ({ ...prev, [entityTypeName]: null }))

    try {
      // Use tRPC utils to fetch entities
      const fetchedEntities = await utils.entityTypes.getEntities.fetch({
        entityTypeName,
        ...options
      })

      setEntities(prev => ({
        ...prev,
        [entityTypeName]: fetchedEntities
      }))
    } catch (error) {
      console.error(`Failed to fetch ${entityTypeName}:`, error)
      setErrors(prev => ({
        ...prev,
        [entityTypeName]: error instanceof Error ? error.message : 'Failed to fetch entities'
      }))
    } finally {
      setLoading(prev => ({ ...prev, [entityTypeName]: false }))
    }
  }, [workspaceId, utils])

  // Refresh entities
  const refreshEntities = useCallback(async (entityTypeName: string): Promise<void> => {
    await fetchEntities(entityTypeName)
  }, [fetchEntities])

  // Move to pipeline stage
  const moveToStage = useCallback(async (
    entityTypeName: string,
    entityId: string,
    stageId: string
  ): Promise<DynamicEntity> => {
    const entityType = getEntityTypeDefinition(entityTypeName)
    if (!entityType) {
      throw new Error(`Entity type ${entityTypeName} not found`)
    }

    if (!entityType.enablePipeline) {
      throw new Error(`Entity type ${entityTypeName} does not support pipelines`)
    }

    const stage = entityType.pipelineStages?.find(s => s.id === stageId)
    if (!stage) {
      throw new Error(`Stage ${stageId} not found`)
    }

    return updateEntity(entityTypeName, entityId, {
      stage: stageId,
      stageChangedAt: new Date(),
      probability: stage.probability
    })
  }, [getEntityTypeDefinition, updateEntity])

  // Link entities
  const linkEntities = useCallback(async (
    fromType: string,
    fromId: string,
    toType: string,
    toId: string,
    relationshipType: string
  ): Promise<void> => {
    try {
      await linkEntitiesMutation.mutateAsync({
        fromType,
        fromId,
        toType,
        toId,
        relationshipType
      })
    } catch (error) {
      console.error('Failed to link entities:', error)
      throw error
    }
  }, [linkEntitiesMutation])

  // Unlink entities
  const unlinkEntities = useCallback(async (
    fromType: string,
    fromId: string,
    toType: string,
    toId: string
  ): Promise<void> => {
    try {
      await unlinkEntitiesMutation.mutateAsync({
        fromType,
        fromId,
        toType,
        toId
      })
    } catch (error) {
      console.error('Failed to unlink entities:', error)
      throw error
    }
  }, [unlinkEntitiesMutation])

  // Get related entities
  const getRelatedEntities = useCallback((
    entityType: string,
    entityId: string,
    relatedType: string
  ): DynamicEntity[] => {
    // This would check relationships and return related entities
    return []
  }, [])

  // Get entity count
  const getEntityCount = useCallback((entityTypeName: string): number => {
    return entities[entityTypeName]?.length || 0
  }, [entities])

  // Get entities by stage
  const getEntitiesByStage = useCallback((
    entityTypeName: string,
    stage: string
  ): DynamicEntity[] => {
    return (entities[entityTypeName] || []).filter(e => e.data.stage === stage)
  }, [entities])

  // Search entities
  const searchEntities = useCallback((
    entityTypeName: string,
    query: string
  ): DynamicEntity[] => {
    const lowerQuery = query.toLowerCase()
    const entityType = getEntityTypeDefinition(entityTypeName)
    
    if (!entityType || !entities[entityTypeName]) return []

    return entities[entityTypeName].filter(entity => {
      // Search in searchable fields
      return entityType.searchableFields?.some(field => {
        const value = entity.data[field]
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerQuery)
        }
        return false
      })
    })
  }, [entities, getEntityTypeDefinition])

  // Export entities
  const exportEntities = useCallback((
    entityTypeName: string,
    format: 'csv' | 'json'
  ): string => {
    const entitiesToExport = entities[entityTypeName] || []
    
    if (format === 'json') {
      return JSON.stringify(entitiesToExport, null, 2)
    }
    
    // CSV export
    if (entitiesToExport.length === 0) return ''
    
    const headers = Object.keys(entitiesToExport[0].data)
    const rows = entitiesToExport.map(e => 
      headers.map(h => {
        const value = e.data[h]
        return typeof value === 'object' ? JSON.stringify(value) : value
      }).join(',')
    )
    
    return [headers.join(','), ...rows].join('\n')
  }, [entities])

  // Import entities
  const importEntities = useCallback(async (
    entityTypeName: string,
    data: string,
    format: 'csv' | 'json'
  ): Promise<number> => {
    let parsedData: Record<string, any>[] = []
    
    if (format === 'json') {
      try {
        parsedData = JSON.parse(data)
      } catch (error) {
        throw new Error('Invalid JSON format')
      }
    } else {
      // Simple CSV parser
      const lines = data.split('\n')
      if (lines.length < 2) throw new Error('Invalid CSV format')
      
      const headers = lines[0].split(',')
      parsedData = lines.slice(1).map(line => {
        const values = line.split(',')
        const obj: Record<string, any> = {}
        headers.forEach((h, i) => {
          obj[h] = values[i]
        })
        return obj
      })
    }
    
    const created = await createEntities(entityTypeName, parsedData)
    return created.length
  }, [createEntities])

  const value: DynamicEntitiesContextState = {
    entities,
    loading,
    errors,
    createEntity,
    updateEntity,
    deleteEntity,
    getEntity,
    createEntities,
    deleteEntities,
    fetchEntities,
    refreshEntities,
    moveToStage,
    linkEntities,
    unlinkEntities,
    getRelatedEntities,
    getEntityCount,
    getEntitiesByStage,
    searchEntities,
    exportEntities,
    importEntities
  }

  return (
    <DynamicEntitiesContext.Provider value={value}>
      {children}
    </DynamicEntitiesContext.Provider>
  )
}

export function useDynamicEntities() {
  const context = useContext(DynamicEntitiesContext)
  if (!context) {
    throw new Error('useDynamicEntities must be used within DynamicEntitiesProvider')
  }
  return context
}