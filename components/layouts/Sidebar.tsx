'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home,
  Users,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
  LogOut,
  HelpCircle,
  Package,
  ShoppingCart,
  CheckSquare,
} from 'lucide-react'
import { theme } from '@/lib/evercore/theme'
import { useUser, useOrganization } from '@clerk/nextjs'

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  href: string
  badge?: number
  children?: NavItem[]
}

const navItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    href: '/dashboard',
  },
  {
    id: 'evercore',
    label: 'EverCore',
    icon: Users,
    href: '/dashboard/crm',
    children: [
      { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard/crm' },
      { id: 'leads', label: 'Leads', icon: Users, href: '/dashboard/crm/leads' },
      { id: 'contacts', label: 'Contacts', icon: Users, href: '/dashboard/crm/contacts' },
      { id: 'companies', label: 'Companies', icon: Building2, href: '/dashboard/crm/companies' },
      { id: 'deals', label: 'Deals', icon: FileText, href: '/dashboard/crm/deals' },
      { id: 'products', label: 'Products', icon: Package, href: '/dashboard/crm/products' },
      { id: 'orders', label: 'Orders', icon: ShoppingCart, href: '/dashboard/crm/orders' },
    ],
  },
  {
    id: 'evertask',
    label: 'EverTask',
    icon: CheckSquare,
    href: '/dashboard/tasks',
  },
  {
    id: 'evermail',
    label: 'EverMail',
    icon: Mail,
    href: '/mail',
    badge: 3,
  },
  {
    id: 'everchat',
    label: 'EverChat',
    icon: MessageSquare,
    href: '/chat',
  },
  {
    id: 'evercal',
    label: 'EverCal',
    icon: Calendar,
    href: '/calendar',
  },
  {
    id: 'everdocs',
    label: 'EverDocs',
    icon: FileText,
    href: '/dashboard/docs',
  },
]

const bottomNavItems: NavItem[] = [
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/settings',
  },
  {
    id: 'help',
    label: 'Help & Support',
    icon: HelpCircle,
    href: '/help',
  },
]

export default function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useUser()
  const { organization } = useOrganization()
  const [expandedItems, setExpandedItems] = useState<string[]>(['evercore'])

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.id)
    const active = isActive(item.href)

    return (
      <div key={item.id}>
        <Link
          href={item.href}
          onClick={(e) => {
            if (hasChildren && !isCollapsed) {
              e.preventDefault()
              toggleExpanded(item.id)
            }
          }}
          className="sidebar-nav-item"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isCollapsed ? '12px' : '10px 16px',
            marginBottom: '2px',
            borderRadius: theme.borderRadius.base,
            backgroundColor: active ? theme.colors.softGreen : 'transparent',
            color: active ? theme.colors.evergreen : theme.colors.charcoal,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: active ? theme.typography.fontWeight.medium : theme.typography.fontWeight.normal,
            textDecoration: 'none',
            transition: theme.transitions.fast,
            cursor: 'pointer',
            paddingLeft: !isCollapsed && depth > 0 ? `${16 + depth * 16}px` : undefined,
          }}
          onMouseEnter={(e) => {
            if (!active) {
              e.currentTarget.style.backgroundColor = theme.colors.lightGray + '30'
            }
          }}
          onMouseLeave={(e) => {
            if (!active) {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <item.icon size={20} />
            {!isCollapsed && (
              <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
            )}
          </div>
          {!isCollapsed && (
            <>
              {item.badge && (
                <span style={{
                  backgroundColor: theme.colors.error,
                  color: theme.colors.white,
                  fontSize: '11px',
                  fontWeight: theme.typography.fontWeight.semibold,
                  padding: '2px 6px',
                  borderRadius: theme.borderRadius.full,
                  minWidth: '20px',
                  textAlign: 'center',
                }}>
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight size={16} />
                </motion.div>
              )}
            </>
          )}
        </Link>
        
        {hasChildren && !isCollapsed && (
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                {item.children!.map(child => renderNavItem(child, depth + 1))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    )
  }

  return (
    <motion.aside
      animate={{ width: isCollapsed ? theme.layout.sidebarCollapsedWidth : theme.layout.sidebarExpandedWidth }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: theme.colors.white,
        borderRight: `1px solid ${theme.colors.lightGray}`,
        zIndex: theme.zIndex.sticky,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Logo Section */}
      <div style={{
        height: theme.layout.headerHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        padding: isCollapsed ? '0' : '0 16px',
        borderBottom: `1px solid ${theme.colors.lightGray}`,
      }}>
        {!isCollapsed ? (
          <>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <h1 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.evergreen,
                margin: 0,
              }}>
                evergreenOS
              </h1>
            </Link>
            <button
              onClick={onToggle}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: theme.colors.mediumGray,
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: theme.borderRadius.sm,
                transition: theme.transitions.fast,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.lightGray
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <ChevronLeft size={20} />
            </button>
          </>
        ) : (
          <button
            onClick={onToggle}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: theme.colors.mediumGray,
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: theme.borderRadius.sm,
              transition: theme.transitions.fast,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.lightGray
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 8px',
      }}>
        {navItems.map(item => renderNavItem(item))}
      </div>

      {/* Bottom Section */}
      <div style={{
        borderTop: `1px solid ${theme.colors.lightGray}`,
        padding: '16px 8px',
      }}>
        {bottomNavItems.map(item => renderNavItem(item))}
        
        {/* User Profile */}
        <div style={{
          marginTop: '16px',
          padding: isCollapsed ? '8px' : '12px',
          borderRadius: theme.borderRadius.base,
          backgroundColor: theme.colors.lightGray + '30',
        }}>
          {!isCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: theme.borderRadius.full,
                backgroundColor: theme.colors.evergreen,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.colors.white,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.semibold,
              }}>
                {user?.firstName?.[0] || 'U'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.charcoal,
                }}>
                  {user?.firstName} {user?.lastName}
                </div>
                <div style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.mediumGray,
                }}>
                  {organization?.name || 'Personal'}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: theme.borderRadius.full,
              backgroundColor: theme.colors.evergreen,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.colors.white,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              margin: '0 auto',
            }}>
              {user?.firstName?.[0] || 'U'}
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  )
}