'use client'

import { CRMProvider } from '@/lib/contexts/crm-context'
import { WorkspaceConfigProvider } from '@/lib/contexts/workspace-config-context'
import { DynamicEntitiesProvider } from '@/lib/contexts/dynamic-entities-context'

export default function CRMWrapper({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceConfigProvider>
      <DynamicEntitiesProvider>
        <CRMProvider>{children}</CRMProvider>
      </DynamicEntitiesProvider>
    </WorkspaceConfigProvider>
  )
}