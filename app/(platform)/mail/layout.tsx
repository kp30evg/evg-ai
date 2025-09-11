'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc/client';
import { AUTO_LABELS, getSortedLabels } from '@/lib/evermail/constants/labels';
import { 
  Inbox,
  Send,
  FileText,
  Archive,
  Trash2,
  Star,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Menu,
  ChevronDown,
  Mail,
  Tag,
  Newspaper,
  Briefcase,
  Users,
  Reply,
  Calendar,
  Edit,
  Lock,
  Sparkles
} from 'lucide-react';

// Design System Tokens
const tokens = {
  colors: {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    gray50: '#FAFBFC',
    gray100: '#F1F3F5',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    softGreen: '#E6F4EC',
    gold: '#FFD600',
    success: '#10B981',
    error: '#EF4444',
    info: '#3B82F6'
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    sizes: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px'
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeights: {
      tight: 1.2,
      base: 1.5,
      relaxed: 1.7
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px'
  },
  radii: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px'
  },
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 2px 4px rgba(0, 0, 0, 0.05)',
    md: '0 4px 16px rgba(0, 0, 0, 0.06)',
    lg: '0 12px 32px rgba(0, 0, 0, 0.08)'
  },
  transitions: {
    fast: '150ms ease-out',
    base: '200ms ease-out',
    slow: '300ms ease-out'
  }
};

interface MailLayoutProps {
  children: React.ReactNode;
}

export default function MailLayout({ children }: MailLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMoreFolders, setShowMoreFolders] = useState(false);
  const [showSmartLabels, setShowSmartLabels] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({
    inbox: 2584,
    drafts: 4,
    spam: 0,
    trash: 0
  });
  
  // Fetch label statistics
  const { data: labelStats } = trpc.evermail.getLabelStats.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000,
    cacheTime: 30000
  });
  
  // Hide sidebar on dashboard (main mail page)
  const showSidebar = pathname !== '/mail';

  const navigationItems = [
    { 
      id: 'inbox', 
      label: 'Inbox', 
      icon: Inbox, 
      path: '/mail/inbox',
      count: unreadCounts.inbox,
      color: tokens.colors.charcoal
    },
    { 
      id: 'starred', 
      label: 'Starred', 
      icon: Star, 
      path: '/mail/starred',
      count: 0,
      color: tokens.colors.gray500
    },
    { 
      id: 'snoozed', 
      label: 'Snoozed', 
      icon: Clock, 
      path: '/mail/snoozed',
      count: 0,
      color: tokens.colors.gray500
    },
    { 
      id: 'sent', 
      label: 'Sent', 
      icon: Send, 
      path: '/mail/sent',
      count: 0,
      color: tokens.colors.charcoal
    },
    { 
      id: 'drafts', 
      label: 'Drafts', 
      icon: FileText, 
      path: '/mail/drafts',
      count: unreadCounts.drafts,
      color: tokens.colors.charcoal
    }
  ];

  const moreItems = [
    { 
      id: 'important', 
      label: 'Important', 
      icon: AlertCircle, 
      path: '/mail/important',
      count: 0,
      color: tokens.colors.gray500
    },
    { 
      id: 'spam', 
      label: 'Spam', 
      icon: AlertCircle, 
      path: '/mail/spam',
      count: unreadCounts.spam,
      color: tokens.colors.gray500
    },
    { 
      id: 'trash', 
      label: 'Trash', 
      icon: Trash2, 
      path: '/mail/trash',
      count: unreadCounts.trash,
      color: tokens.colors.gray500
    },
    { 
      id: 'archive', 
      label: 'Archive', 
      icon: Archive, 
      path: '/mail/archive',
      count: 0,
      color: tokens.colors.gray500
    }
  ];

  const labels = [
    { id: 'work', label: 'Work', color: tokens.colors.charcoal },
    { id: 'personal', label: 'Personal', color: tokens.colors.gray500 },
    { id: 'finance', label: 'Finance', color: tokens.colors.charcoal },
    { id: 'newsletter', label: 'Newsletter', color: tokens.colors.gray500 },
    { id: 'social', label: 'Social Media', color: tokens.colors.gray500 }
  ];

  const isActive = (path: string) => {
    // Handle the /mail redirect case
    if (pathname === '/mail' && path === '/mail/inbox') return true;
    return pathname === path;
  };

  const handleCompose = () => {
    router.push('/mail/compose');
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: tokens.colors.gray50,
      fontFamily: tokens.typography.fontFamily,
      overflow: 'hidden'
    }}>
      {/* Sidebar - Only shown when not on dashboard */}
      <AnimatePresence mode="wait">
        {showSidebar && (
          <motion.div 
            key="sidebar"
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{
            width: sidebarCollapsed ? '60px' : '260px',
            backgroundColor: tokens.colors.white,
            borderRight: `1px solid ${tokens.colors.gray100}`,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 10
          }}>
        {/* Logo/Header */}
        <div style={{
          padding: tokens.spacing.lg,
          borderBottom: `1px solid ${tokens.colors.gray100}`,
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing.md
        }}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              padding: tokens.spacing.sm,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: tokens.radii.md,
              transition: tokens.transitions.fast
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = tokens.colors.gray100;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Menu size={20} color={tokens.colors.gray600} strokeWidth={2} />
          </button>
          {!sidebarCollapsed && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing.sm
            }}>
              <Mail size={24} color={tokens.colors.evergreen} strokeWidth={2} />
              <span style={{
                fontSize: tokens.typography.sizes.lg,
                fontWeight: tokens.typography.weights.semibold,
                color: tokens.colors.charcoal
              }}>
                Mail
              </span>
            </div>
          )}
        </div>

        {/* Compose Button */}
        <div style={{ padding: tokens.spacing.lg }}>
          <motion.button
            onClick={handleCompose}
            style={{
              width: '100%',
              padding: sidebarCollapsed ? tokens.spacing.md : `${tokens.spacing.md} ${tokens.spacing.lg}`,
              backgroundColor: tokens.colors.white,
              color: tokens.colors.gray700,
              border: `1px solid ${tokens.colors.gray300}`,
              borderRadius: tokens.radii.lg,
              fontSize: tokens.typography.sizes.sm,
              fontWeight: tokens.typography.weights.medium,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: tokens.spacing.sm,
              boxShadow: tokens.shadows.sm,
              transition: tokens.transitions.fast
            }}
            whileHover={{ 
              backgroundColor: tokens.colors.gray50,
              scale: 1.02
            }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={20} strokeWidth={2} />
            {!sidebarCollapsed && 'Compose'}
          </motion.button>
        </div>

        {/* Navigation Items */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: `0 ${tokens.spacing.sm}`
        }}>
          {/* Main Navigation */}
          <div>
            {navigationItems.map(item => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => router.push(item.path)}
                  style={{
                    width: '100%',
                    padding: sidebarCollapsed ? tokens.spacing.md : `${tokens.spacing.sm} ${tokens.spacing.md}`,
                    backgroundColor: active ? tokens.colors.gray100 : 'transparent',
                    border: 'none',
                    borderRadius: tokens.radii.md,
                    fontSize: tokens.typography.sizes.sm,
                    fontWeight: active ? tokens.typography.weights.medium : tokens.typography.weights.regular,
                    color: active ? tokens.colors.charcoal : tokens.colors.gray700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                    marginBottom: '2px',
                    transition: tokens.transitions.fast,
                    position: 'relative'
                  }}
                  whileHover={{
                    backgroundColor: active ? tokens.colors.softGreen : tokens.colors.gray50
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: tokens.spacing.md
                  }}>
                    <Icon 
                      size={18} 
                      color={active ? tokens.colors.charcoal : item.color}
                      strokeWidth={active ? 2.5 : 2}
                    />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </div>
                  {!sidebarCollapsed && item.count > 0 && (
                    <span style={{
                      fontSize: tokens.typography.sizes.xs,
                      fontWeight: tokens.typography.weights.medium,
                      color: tokens.colors.gray500,
                      backgroundColor: tokens.colors.gray100,
                      padding: `2px ${tokens.spacing.sm}`,
                      borderRadius: tokens.radii.full,
                      minWidth: '24px',
                      textAlign: 'center'
                    }}>
                      {item.count > 999 ? '999+' : item.count}
                    </span>
                  )}
                  {sidebarCollapsed && item.count > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '8px',
                      height: '8px',
                      backgroundColor: tokens.colors.error,
                      borderRadius: '50%'
                    }} />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* More Section */}
          {!sidebarCollapsed && (
            <div style={{ marginTop: tokens.spacing.lg }}>
              <button
                onClick={() => setShowMoreFolders(!showMoreFolders)}
                style={{
                  width: '100%',
                  padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: tokens.typography.sizes.sm,
                  color: tokens.colors.gray600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: tokens.spacing.sm,
                  transition: tokens.transitions.fast
                }}
              >
                <ChevronDown 
                  size={16} 
                  strokeWidth={2}
                  style={{
                    transform: showMoreFolders ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: tokens.transitions.fast
                  }}
                />
                More
              </button>
              
              {showMoreFolders && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {moreItems.map(item => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    
                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => router.push(item.path)}
                        style={{
                          width: '100%',
                          padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                          backgroundColor: active ? tokens.colors.gray100 : 'transparent',
                          border: 'none',
                          borderRadius: tokens.radii.md,
                          fontSize: tokens.typography.sizes.sm,
                          fontWeight: active ? tokens.typography.weights.medium : tokens.typography.weights.regular,
                          color: active ? tokens.colors.charcoal : tokens.colors.gray700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '2px',
                          transition: tokens.transitions.fast
                        }}
                        whileHover={{
                          backgroundColor: active ? tokens.colors.gray100 : tokens.colors.gray50
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: tokens.spacing.md
                        }}>
                          <Icon 
                            size={18} 
                            color={active ? tokens.colors.charcoal : item.color}
                            strokeWidth={active ? 2.5 : 2}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.count > 0 && (
                          <span style={{
                            fontSize: tokens.typography.sizes.xs,
                            fontWeight: tokens.typography.weights.medium,
                            color: tokens.colors.gray500
                          }}>
                            {item.count}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </div>
          )}

          {/* Smart Labels Section */}
          {!sidebarCollapsed && (
            <div style={{ 
              marginTop: tokens.spacing.xl,
              paddingTop: tokens.spacing.lg,
              borderTop: `1px solid ${tokens.colors.gray100}`
            }}>
              <button
                onClick={() => setShowSmartLabels(!showSmartLabels)}
                style={{
                  width: '100%',
                  padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: tokens.typography.sizes.xs,
                  fontWeight: tokens.typography.weights.semibold,
                  color: tokens.colors.evergreen,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: tokens.transitions.fast
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
                  <Sparkles size={12} />
                  Smart Labels
                </div>
                <ChevronDown 
                  size={12} 
                  strokeWidth={2}
                  style={{
                    transform: showSmartLabels ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: tokens.transitions.fast
                  }}
                />
              </button>
              
              {showSmartLabels && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  {getSortedLabels().map(label => {
                    const count = labelStats?.find(s => s.id === label.id)?.count || 0;
                    const Icon = 
                      label.id === 'marketing' ? Tag :
                      label.id === 'news' ? Newspaper :
                      label.id === 'pitch' ? Briefcase :
                      label.id === 'social' ? Users :
                      label.id === 'respond' ? Reply :
                      label.id === 'meeting' ? Calendar :
                      label.id === 'signature' ? Edit :
                      label.id === 'login' ? Lock :
                      Mail;
                    
                    return (
                      <motion.button
                        key={label.id}
                        onClick={() => router.push(`/mail/label/${label.id}`)}
                        style={{
                          width: '100%',
                          padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                          backgroundColor: pathname === `/mail/label/${label.id}` ? tokens.colors.gray100 : 'transparent',
                          border: 'none',
                          fontSize: tokens.typography.sizes.sm,
                          color: pathname === `/mail/label/${label.id}` ? tokens.colors.charcoal : tokens.colors.gray700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: tokens.transitions.fast
                        }}
                        whileHover={{
                          backgroundColor: pathname === `/mail/label/${label.id}` ? tokens.colors.gray100 : tokens.colors.gray50
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: tokens.spacing.md
                        }}>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            backgroundColor: label.bgColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Icon size={10} color={label.color} strokeWidth={2} />
                          </div>
                          <span>{label.name}</span>
                        </div>
                        {count > 0 && (
                          <span style={{
                            fontSize: tokens.typography.sizes.xs,
                            fontWeight: tokens.typography.weights.medium,
                            color: tokens.colors.gray500,
                            backgroundColor: tokens.colors.gray100,
                            padding: `2px ${tokens.spacing.sm}`,
                            borderRadius: tokens.radii.full,
                            minWidth: '24px',
                            textAlign: 'center'
                          }}>
                            {count > 999 ? '999+' : count}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </div>
          )}

          {/* Labels Section */}
          {!sidebarCollapsed && (
            <div style={{ 
              marginTop: tokens.spacing.lg,
              paddingTop: tokens.spacing.lg,
              borderTop: `1px solid ${tokens.colors.gray100}`
            }}>
              <div style={{
                padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                fontSize: tokens.typography.sizes.xs,
                fontWeight: tokens.typography.weights.semibold,
                color: tokens.colors.gray500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Labels
              </div>
              {labels.map(label => (
                <button
                  key={label.id}
                  onClick={() => router.push(`/mail/label/${label.id}`)}
                  style={{
                    width: '100%',
                    padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: tokens.typography.sizes.sm,
                    color: tokens.colors.gray700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: tokens.spacing.md,
                    transition: tokens.transitions.fast
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = tokens.colors.gray50;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: label.color,
                    flexShrink: 0
                  }} />
                  <span>{label.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {children}
      </div>
    </div>
  );
}