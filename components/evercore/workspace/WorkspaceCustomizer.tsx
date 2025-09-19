'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { theme } from '@/lib/evercore/theme'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { useWorkspaceConfig } from '@/lib/contexts/workspace-config-context'
import * as Icons from 'lucide-react'
import { 
  Settings,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  ChevronLeft,
  GripVertical,
  Eye,
  EyeOff,
  Download,
  Upload,
  RefreshCw,
  Layout,
  Home,
  Users,
  Building2,
  Target,
  Package,
  ShoppingCart,
  Calendar,
  FileText,
  Heart,
  CreditCard,
  Briefcase,
  Scale,
  Activity,
  TrendingUp,
  DollarSign,
  BarChart3
} from 'lucide-react'

export default function WorkspaceCustomizer() {
  const router = useRouter()
  const {
    config,
    navigation,
    entityTypes,
    templates,
    addNavigationItem,
    updateNavigationItem,
    removeNavigationItem,
    reorderNavigation,
    addEntityType,
    applyTemplate,
    resetToDefault,
    exportConfig,
    importConfig
  } = useWorkspaceConfig()

  const [activeTab, setActiveTab] = useState<'navigation' | 'entities' | 'templates' | 'export'>('navigation')
  const [editingNav, setEditingNav] = useState<string | null>(null)
  const [showAddNav, setShowAddNav] = useState(false)
  const [newNavItem, setNewNavItem] = useState({
    label: '',
    icon: 'FileText',
    entityType: '',
    visible: true
  })
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // Available icons for selection
  const availableIcons = [
    { name: 'BarChart3', icon: BarChart3 },
    { name: 'Users', icon: Users },
    { name: 'Building2', icon: Building2 },
    { name: 'Target', icon: Target },
    { name: 'Package', icon: Package },
    { name: 'ShoppingCart', icon: ShoppingCart },
    { name: 'Calendar', icon: Calendar },
    { name: 'FileText', icon: FileText },
    { name: 'Home', icon: Home },
    { name: 'Heart', icon: Heart },
    { name: 'CreditCard', icon: CreditCard },
    { name: 'Briefcase', icon: Briefcase },
    { name: 'Scale', icon: Scale },
    { name: 'Activity', icon: Activity },
    { name: 'TrendingUp', icon: TrendingUp },
    { name: 'DollarSign', icon: DollarSign }
  ]

  const handleAddNavigation = async () => {
    if (!newNavItem.label) return

    await addNavigationItem({
      label: newNavItem.label,
      icon: newNavItem.icon,
      entityType: newNavItem.entityType || undefined,
      visible: newNavItem.visible,
      isCustom: true
    })

    setNewNavItem({
      label: '',
      icon: 'FileText',
      entityType: '',
      visible: true
    })
    setShowAddNav(false)
  }

  const handleToggleVisibility = async (navId: string, currentVisibility: boolean) => {
    await updateNavigationItem(navId, { visible: !currentVisibility })
  }

  const handleExport = () => {
    const configJson = exportConfig()
    const blob = new Blob([configJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'workspace-config.json'
    a.click()
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target?.result as string
      await importConfig(content)
    }
    reader.readAsText(file)
  }

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return
    
    if (confirm('This will replace your current workspace configuration. Continue?')) {
      await applyTemplate(selectedTemplate)
      router.push('/dashboard/crm')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.colors.background,
      fontFamily: theme.typography.fontFamily
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: theme.colors.white,
        borderBottom: `1px solid ${theme.colors.border}`,
        padding: theme.spacing.xl
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <button
              onClick={() => router.push('/dashboard/crm')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                backgroundColor: 'transparent',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.sm,
                cursor: 'pointer',
                transition: theme.transitions.base
              }}
            >
              <ChevronLeft size={16} />
              Back to CRM
            </button>
            <h1 style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text
            }}>
              Customize Workspace
            </h1>
          </div>
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            <button
              onClick={resetToDefault}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                backgroundColor: 'transparent',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.sm,
                cursor: 'pointer',
                transition: theme.transitions.base
              }}
            >
              <RefreshCw size={16} />
              Reset to Default
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        backgroundColor: theme.colors.white,
        borderBottom: `1px solid ${theme.colors.border}`,
        padding: `0 ${theme.spacing.xl}`
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          gap: theme.spacing.xl
        }}>
          {['navigation', 'entities', 'templates', 'export'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              style={{
                padding: `${theme.spacing.md} 0`,
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? `2px solid ${theme.colors.evergreen}` : '2px solid transparent',
                color: activeTab === tab ? theme.colors.evergreen : theme.colors.mediumGray,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                cursor: 'pointer',
                transition: theme.transitions.fast,
                textTransform: 'capitalize'
              }}
            >
              {tab === 'navigation' && 'Navigation Items'}
              {tab === 'entities' && 'Entity Types'}
              {tab === 'templates' && 'Industry Templates'}
              {tab === 'export' && 'Import/Export'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: theme.spacing.xl
      }}>
        {/* Navigation Tab */}
        {activeTab === 'navigation' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: theme.spacing.lg
            }}>
              <h2 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text
              }}>
                Navigation Items
              </h2>
              <button
                onClick={() => setShowAddNav(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  backgroundColor: theme.colors.evergreen,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.white,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  cursor: 'pointer',
                  transition: theme.transitions.base
                }}
              >
                <Plus size={16} />
                Add Navigation Item
              </button>
            </div>

            {/* Add Navigation Form */}
            <AnimatePresence>
              {showAddNav && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    backgroundColor: theme.colors.white,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing.lg,
                    marginBottom: theme.spacing.lg
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.text,
                        marginBottom: theme.spacing.xs
                      }}>
                        Label
                      </label>
                      <input
                        type="text"
                        value={newNavItem.label}
                        onChange={(e) => setNewNavItem(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="e.g., Properties"
                        style={{
                          width: '100%',
                          padding: theme.spacing.sm,
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: theme.borderRadius.md,
                          fontSize: theme.typography.fontSize.sm,
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.text,
                        marginBottom: theme.spacing.xs
                      }}>
                        Icon
                      </label>
                      <select
                        value={newNavItem.icon}
                        onChange={(e) => setNewNavItem(prev => ({ ...prev, icon: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: theme.spacing.sm,
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: theme.borderRadius.md,
                          fontSize: theme.typography.fontSize.sm,
                          outline: 'none'
                        }}
                      >
                        {availableIcons.map(icon => (
                          <option key={icon.name} value={icon.name}>{icon.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.text,
                        marginBottom: theme.spacing.xs
                      }}>
                        Entity Type (optional)
                      </label>
                      <input
                        type="text"
                        value={newNavItem.entityType}
                        onChange={(e) => setNewNavItem(prev => ({ ...prev, entityType: e.target.value }))}
                        placeholder="e.g., property"
                        style={{
                          width: '100%',
                          padding: theme.spacing.sm,
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: theme.borderRadius.md,
                          fontSize: theme.typography.fontSize.sm,
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'end', gap: theme.spacing.sm }}>
                      <button
                        onClick={handleAddNavigation}
                        style={{
                          flex: 1,
                          padding: theme.spacing.sm,
                          backgroundColor: theme.colors.evergreen,
                          border: 'none',
                          borderRadius: theme.borderRadius.md,
                          color: theme.colors.white,
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: theme.typography.fontWeight.medium,
                          cursor: 'pointer'
                        }}
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setShowAddNav(false)}
                        style={{
                          padding: theme.spacing.sm,
                          backgroundColor: theme.colors.lightGray,
                          border: 'none',
                          borderRadius: theme.borderRadius.md,
                          color: theme.colors.text,
                          fontSize: theme.typography.fontSize.sm,
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation List */}
            <Reorder.Group
              axis="y"
              values={navigation}
              onReorder={reorderNavigation}
              style={{ listStyle: 'none', padding: 0, margin: 0 }}
            >
              {navigation.map((item) => {
                const IconComponent = item.icon ? (Icons as any)[item.icon] : null
                
                return (
                  <Reorder.Item
                    key={item.id}
                    value={item}
                    style={{
                      backgroundColor: theme.colors.white,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.lg,
                      padding: theme.spacing.md,
                      marginBottom: theme.spacing.sm,
                      cursor: 'grab'
                    }}
                    whileDrag={{
                      scale: 1.02,
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                        <GripVertical size={16} color={theme.colors.mediumGray} />
                        {IconComponent && <IconComponent size={18} />}
                        {item.emoji && <span style={{ fontSize: '18px' }}>{item.emoji}</span>}
                        <span style={{
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: theme.typography.fontWeight.medium,
                          color: theme.colors.text
                        }}>
                          {item.label}
                        </span>
                        {item.entityType && (
                          <span style={{
                            fontSize: theme.typography.fontSize.xs,
                            color: theme.colors.mediumGray,
                            padding: `2px ${theme.spacing.xs}`,
                            backgroundColor: theme.colors.lightGray,
                            borderRadius: theme.borderRadius.sm
                          }}>
                            {item.entityType}
                          </span>
                        )}
                        {item.isCustom && (
                          <span style={{
                            fontSize: theme.typography.fontSize.xs,
                            color: theme.colors.evergreen,
                            padding: `2px ${theme.spacing.xs}`,
                            backgroundColor: theme.colors.softGreen,
                            borderRadius: theme.borderRadius.sm
                          }}>
                            Custom
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                        <button
                          onClick={() => handleToggleVisibility(item.id, item.visible)}
                          style={{
                            padding: theme.spacing.xs,
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: item.visible ? theme.colors.evergreen : theme.colors.mediumGray,
                            cursor: 'pointer'
                          }}
                        >
                          {item.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        {item.isCustom && (
                          <button
                            onClick={() => removeNavigationItem(item.id)}
                            style={{
                              padding: theme.spacing.xs,
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: theme.colors.error,
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </Reorder.Item>
                )
              })}
            </Reorder.Group>
          </div>
        )}

        {/* Entity Types Tab */}
        {activeTab === 'entities' && (
          <div>
            <h2 style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text,
              marginBottom: theme.spacing.lg
            }}>
              Entity Types
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: theme.spacing.md
            }}>
              {entityTypes.map((entityType) => {
                const IconComponent = entityType.icon ? (Icons as any)[entityType.icon] : FileText
                
                return (
                  <div
                    key={entityType.id}
                    style={{
                      backgroundColor: theme.colors.white,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.lg,
                      padding: theme.spacing.lg
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                      marginBottom: theme.spacing.md
                    }}>
                      <IconComponent size={20} color={theme.colors.evergreen} />
                      <h3 style={{
                        fontSize: theme.typography.fontSize.md,
                        fontWeight: theme.typography.fontWeight.semibold,
                        color: theme.colors.text
                      }}>
                        {entityType.label}
                      </h3>
                    </div>
                    <div style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.mediumGray,
                      marginBottom: theme.spacing.sm
                    }}>
                      {entityType.fields.length} fields
                    </div>
                    {entityType.enablePipeline && (
                      <div style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.evergreen,
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.xs
                      }}>
                        <Layout size={14} />
                        Pipeline enabled
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div>
            <h2 style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text,
              marginBottom: theme.spacing.lg
            }}>
              Industry Templates
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: theme.spacing.md
            }}>
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  style={{
                    backgroundColor: theme.colors.white,
                    border: `2px solid ${selectedTemplate === template.id ? theme.colors.evergreen : theme.colors.border}`,
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing.lg,
                    cursor: 'pointer',
                    transition: theme.transitions.base
                  }}
                >
                  <div style={{
                    fontSize: '32px',
                    marginBottom: theme.spacing.md
                  }}>
                    {template.icon}
                  </div>
                  <h3 style={{
                    fontSize: theme.typography.fontSize.md,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text,
                    marginBottom: theme.spacing.xs
                  }}>
                    {template.name}
                  </h3>
                  <p style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.mediumGray,
                    marginBottom: theme.spacing.md
                  }}>
                    {template.description}
                  </p>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: theme.spacing.xs
                  }}>
                    {template.tags?.map(tag => (
                      <span
                        key={tag}
                        style={{
                          fontSize: theme.typography.fontSize.xs,
                          color: theme.colors.evergreen,
                          padding: `2px ${theme.spacing.xs}`,
                          backgroundColor: theme.colors.softGreen,
                          borderRadius: theme.borderRadius.sm
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {selectedTemplate && (
              <div style={{
                marginTop: theme.spacing.xl,
                display: 'flex',
                justifyContent: 'center'
              }}>
                <button
                  onClick={handleApplyTemplate}
                  style={{
                    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                    backgroundColor: theme.colors.evergreen,
                    border: 'none',
                    borderRadius: theme.borderRadius.md,
                    color: theme.colors.white,
                    fontSize: theme.typography.fontSize.md,
                    fontWeight: theme.typography.fontWeight.medium,
                    cursor: 'pointer',
                    transition: theme.transitions.base
                  }}
                >
                  Apply {templates.find(t => t.id === selectedTemplate)?.name}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Import/Export Tab */}
        {activeTab === 'export' && (
          <div>
            <h2 style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text,
              marginBottom: theme.spacing.lg
            }}>
              Import/Export Configuration
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: theme.spacing.xl
            }}>
              <div style={{
                backgroundColor: theme.colors.white,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing.lg
              }}>
                <h3 style={{
                  fontSize: theme.typography.fontSize.md,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.md,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm
                }}>
                  <Download size={20} />
                  Export Configuration
                </h3>
                <p style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.mediumGray,
                  marginBottom: theme.spacing.lg
                }}>
                  Download your workspace configuration as a JSON file to share with others or backup.
                </p>
                <button
                  onClick={handleExport}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    backgroundColor: theme.colors.evergreen,
                    border: 'none',
                    borderRadius: theme.borderRadius.md,
                    color: theme.colors.white,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    cursor: 'pointer',
                    transition: theme.transitions.base
                  }}
                >
                  Export Configuration
                </button>
              </div>

              <div style={{
                backgroundColor: theme.colors.white,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing.lg
              }}>
                <h3 style={{
                  fontSize: theme.typography.fontSize.md,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.md,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm
                }}>
                  <Upload size={20} />
                  Import Configuration
                </h3>
                <p style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.mediumGray,
                  marginBottom: theme.spacing.lg
                }}>
                  Upload a workspace configuration JSON file to apply it to your workspace.
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: theme.spacing.md,
                    backgroundColor: 'transparent',
                    border: `1px solid ${theme.colors.evergreen}`,
                    borderRadius: theme.borderRadius.md,
                    color: theme.colors.evergreen,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: theme.transitions.base
                  }}
                >
                  Choose File to Import
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}