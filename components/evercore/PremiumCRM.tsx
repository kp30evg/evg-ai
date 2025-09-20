'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Building2, 
  DollarSign, 
  UserPlus,
  TrendingUp,
  Activity,
  Target,
  Sparkles
} from 'lucide-react'
import LeadsView from './views/LeadsView'
import ContactsView from './views/ContactsView'
import CompaniesView from './views/CompaniesView'
import DealsView from './views/DealsView'
import { cn } from '@/lib/utils'

export default function PremiumCRM() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('leads')
  
  const tabs = [
    { id: 'leads', label: 'Leads', icon: UserPlus, color: 'text-blue-600' },
    { id: 'contacts', label: 'Contacts', icon: Users, color: 'text-emerald-600' },
    { id: 'companies', label: 'Companies', icon: Building2, color: 'text-purple-600' },
    { id: 'deals', label: 'Deals', icon: DollarSign, color: 'text-amber-600' }
  ]
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'leads':
        return <LeadsView />
      case 'contacts':
        return <ContactsView />
      case 'companies':
        return <CompaniesView />
      case 'deals':
        return <DealsView />
      default:
        return <LeadsView />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 pt-6">
          {/* Title Section */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  EverCore
                  <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                    AI-Powered
                  </span>
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Intelligent CRM with autonomous relationship management
                </p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">$2.4M</div>
                <div className="text-xs text-gray-500 uppercase">Pipeline</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">87%</div>
                <div className="text-xs text-gray-500 uppercase">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">42</div>
                <div className="text-xs text-gray-500 uppercase">Active Deals</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 font-medium text-sm rounded-t-lg transition-all',
                    isActive
                      ? 'bg-white text-gray-900 shadow-sm border-t border-x border-gray-200 relative -mb-px'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                  style={{
                    borderBottom: isActive ? '2px solid white' : undefined
                  }}
                >
                  <Icon className={cn('h-4 w-4', isActive && tab.color)} />
                  {tab.label}
                  {isActive && (
                    <div 
                      className={cn(
                        'absolute bottom-0 left-0 right-0 h-0.5',
                        tab.id === 'leads' && 'bg-blue-500',
                        tab.id === 'contacts' && 'bg-emerald-500',
                        tab.id === 'companies' && 'bg-purple-500',
                        tab.id === 'deals' && 'bg-amber-500'
                      )}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {renderTabContent()}
      </div>
    </div>
  )
}