'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TRPCCacheBuster } from '@/components/providers/trpc-cache-buster';
import { 
  Mail,
  Calendar,
  Users,
  FileText,
  Settings,
  MessageSquare,
  BarChart3,
  Package,
  Home,
  CheckSquare
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
    success: '#10B981',
    error: '#EF4444'
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

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { userId, orgId, isLoaded } = useAuth();
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  
  // Check if we're in Playwright test mode
  const isTestMode = process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST === 'true';

  useEffect(() => {
    // Skip auth checks in test mode
    if (isTestMode) return;
    
    // Wait for auth to load before redirecting
    if (!isLoaded) return;
    
    if (!userId) {
      redirect('/sign-in');
    }
    if (!orgId) {
      redirect('/select-org');
    }
  }, [userId, orgId, isLoaded, isTestMode]);

  const modules = [
    { 
      id: 'dashboard',
      name: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      color: tokens.colors.evergreen
    },
    { 
      id: 'evercore',
      name: 'EverCore',
      icon: Users,
      path: '/dashboard/crm',
      color: tokens.colors.evergreen
    },
    { 
      id: 'evertask',
      name: 'EverTask',
      icon: CheckSquare,
      path: '/dashboard/tasks',
      color: tokens.colors.evergreen
    },
    { 
      id: 'evermail',
      name: 'EverMail',
      icon: Mail,
      path: '/mail',
      color: tokens.colors.evergreen
    },
    { 
      id: 'evercal',
      name: 'EverCal',
      icon: Calendar,
      path: '/dashboard/calendar',
      color: tokens.colors.evergreen
    },
    { 
      id: 'everchat',
      name: 'EverChat',
      icon: MessageSquare,
      path: '/chat',
      color: tokens.colors.evergreen
    },
    { 
      id: 'everdocs',
      name: 'EverDocs',
      icon: FileText,
      path: '/docs',
      color: tokens.colors.evergreen
    },
    { 
      id: 'everlytics',
      name: 'EverLytics',
      icon: BarChart3,
      path: '/analytics',
      color: tokens.colors.evergreen
    },
    { 
      id: 'modules',
      name: 'All Modules',
      icon: Package,
      path: '/modules',
      color: tokens.colors.evergreen
    }
  ];

  const bottomModules = [
    { 
      id: 'settings',
      name: 'Settings',
      icon: Settings,
      path: '/settings',
      color: tokens.colors.gray500
    }
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path === '/mail' && pathname.startsWith('/mail')) return true;
    if (path === '/dashboard/calendar' && pathname.startsWith('/dashboard/calendar')) return true;
    if (path === '/dashboard/crm' && (pathname.startsWith('/dashboard/crm') || pathname.startsWith('/contacts'))) return true;
    return pathname.startsWith(path);
  };

  // Show loading state while auth is being checked (skip in test mode)
  if (!isTestMode && !isLoaded) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: tokens.colors.white
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p style={{ marginTop: '16px', color: tokens.colors.gray600 }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <TRPCCacheBuster>
      <div style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: tokens.colors.white,
        fontFamily: tokens.typography.fontFamily
      }}>
        {/* Main Icon Navigation Bar */}
      <div style={{
        width: '64px',
        backgroundColor: tokens.colors.white,
        borderRight: `1px solid ${tokens.colors.gray200}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: tokens.spacing.lg,
        paddingBottom: tokens.spacing.lg,
        position: 'relative',
        zIndex: 20
      }}>
        {/* Logo */}
        <div style={{
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: tokens.spacing['2xl'],
          cursor: 'pointer',
          borderRadius: tokens.radii.lg,
          transition: tokens.transitions.fast
        }}
        onClick={() => router.push('/dashboard')}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        >
          <img 
            src="/logo.png" 
            alt="Evergreen" 
            style={{
              width: '36px',
              height: '36px',
              objectFit: 'contain'
            }}
          />
        </div>

        {/* Main Navigation */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.spacing.sm,
          width: '100%',
          paddingLeft: tokens.spacing.md,
          paddingRight: tokens.spacing.md
        }}>
          {modules.map(module => {
            const Icon = module.icon;
            const active = isActive(module.path);
            const hovered = hoveredModule === module.id;
            
            return (
              <div
                key={module.id}
                style={{ position: 'relative' }}
                onMouseEnter={() => setHoveredModule(module.id)}
                onMouseLeave={() => setHoveredModule(null)}
              >
                <motion.button
                  onClick={() => router.push(module.path)}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: active ? tokens.colors.softGreen : 'transparent',
                    border: 'none',
                    borderRadius: tokens.radii.lg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: tokens.transitions.fast
                  }}
                  whileHover={{
                    backgroundColor: active ? tokens.colors.softGreen : tokens.colors.gray100
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon 
                    size={20}
                    color={active ? tokens.colors.evergreen : tokens.colors.gray600}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  
                  {/* Active Indicator */}
                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      style={{
                        position: 'absolute',
                        left: '-12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '4px',
                        height: '24px',
                        backgroundColor: tokens.colors.evergreen,
                        borderRadius: '0 2px 2px 0'
                      }}
                    />
                  )}
                </motion.button>

                {/* Tooltip */}
                <AnimatePresence>
                  {hovered && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute',
                        left: '52px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: tokens.colors.charcoal,
                        color: tokens.colors.white,
                        padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
                        borderRadius: tokens.radii.md,
                        fontSize: tokens.typography.sizes.sm,
                        fontWeight: tokens.typography.weights.medium,
                        whiteSpace: 'nowrap',
                        boxShadow: tokens.shadows.lg,
                        zIndex: 30,
                        pointerEvents: 'none'
                      }}
                    >
                      {module.name}
                      {/* Tooltip Arrow */}
                      <div style={{
                        position: 'absolute',
                        left: '-4px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 0,
                        height: 0,
                        borderTop: '4px solid transparent',
                        borderBottom: '4px solid transparent',
                        borderRight: `4px solid ${tokens.colors.charcoal}`
                      }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Bottom Navigation */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.spacing.sm,
          width: '100%',
          paddingLeft: tokens.spacing.md,
          paddingRight: tokens.spacing.md,
          borderTop: `1px solid ${tokens.colors.gray100}`,
          paddingTop: tokens.spacing.lg
        }}>
          {bottomModules.map(module => {
            const Icon = module.icon;
            const active = isActive(module.path);
            const hovered = hoveredModule === module.id;
            
            return (
              <div
                key={module.id}
                style={{ position: 'relative' }}
                onMouseEnter={() => setHoveredModule(module.id)}
                onMouseLeave={() => setHoveredModule(null)}
              >
                <motion.button
                  onClick={() => router.push(module.path)}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: tokens.radii.lg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: tokens.transitions.fast
                  }}
                  whileHover={{
                    backgroundColor: tokens.colors.gray100
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon 
                    size={20}
                    color={module.color}
                    strokeWidth={2}
                  />
                </motion.button>

                {/* Tooltip */}
                <AnimatePresence>
                  {hovered && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute',
                        left: '52px',
                        bottom: '0',
                        backgroundColor: tokens.colors.charcoal,
                        color: tokens.colors.white,
                        padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
                        borderRadius: tokens.radii.md,
                        fontSize: tokens.typography.sizes.sm,
                        fontWeight: tokens.typography.weights.medium,
                        whiteSpace: 'nowrap',
                        boxShadow: tokens.shadows.lg,
                        zIndex: 30,
                        pointerEvents: 'none'
                      }}
                    >
                      {module.name}
                      {/* Tooltip Arrow */}
                      <div style={{
                        position: 'absolute',
                        left: '-4px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 0,
                        height: 0,
                        borderTop: '4px solid transparent',
                        borderBottom: '4px solid transparent',
                        borderRight: `4px solid ${tokens.colors.charcoal}`
                      }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        backgroundColor: tokens.colors.white
      }}>
        {children}
      </div>
    </div>
    </TRPCCacheBuster>
  );
}