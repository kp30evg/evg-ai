'use client'

import React, { useState, useMemo } from 'react'
import { DataTable } from '@/components/ui/premium/data-table'
import { Chip } from '@/components/ui/premium/chip'
import { trpc } from '@/lib/trpc/client'
import { 
  Mail, 
  Phone, 
  Building2,
  Calendar,
  MessageSquare,
  Video,
  CheckCircle,
  Clock,
  AlertCircle,
  Star,
  Briefcase,
  MapPin,
  Link2,
  Linkedin,
  Twitter
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import NewContactModal from '../modals/NewContactModal'

interface Contact {
  id: string
  data: {
    name: string
    email: string
    phone?: string
    company?: string
    companyId?: string
    title?: string
    department?: string
    status?: string
    lastContact?: string
    owner?: string
    tags?: string[]
    priority?: string
    linkedin?: string
    twitter?: string
    location?: string
    notes?: string
  }
  metadata?: {
    emailsSent?: number
    meetingsHeld?: number
    dealsClosed?: number
  }
  createdAt: string
  updatedAt: string
}

export default function ContactsView() {
  const [showNewContactModal, setShowNewContactModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContacts, setSelectedContacts] = useState(new Set<string>())
  
  // Fetch contacts from database
  const { data: contacts = [], isLoading, refetch } = trpc.evercore.getContacts.useQuery()
  const { data: companies = [] } = trpc.evercore.getCompanies.useQuery()
  
  // Filter contacts
  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts
    
    const query = searchQuery.toLowerCase()
    return contacts.filter((contact: Contact) => 
      contact.data?.name?.toLowerCase().includes(query) ||
      contact.data?.email?.toLowerCase().includes(query) ||
      contact.data?.company?.toLowerCase().includes(query) ||
      contact.data?.title?.toLowerCase().includes(query)
    )
  }, [contacts, searchQuery])
  
  // Get company favicon
  const getCompanyLogo = (company?: string) => {
    if (!company) return null
    const domain = company.toLowerCase().replace(/[^a-z0-9]/g, '')
    return `https://logo.clearbit.com/${domain}.com`
  }
  
  // Activity indicator
  const ActivityIndicator = ({ lastContact }: { lastContact?: string }) => {
    if (!lastContact) {
      return <div className="w-2 h-2 rounded-full bg-gray-300" />
    }
    const days = Math.floor((Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24))
    if (days <= 7) return <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
    if (days <= 30) return <div className="w-2 h-2 rounded-full bg-amber-500" />
    return <div className="w-2 h-2 rounded-full bg-red-500" />
  }
  
  const columns = [
    {
      id: 'name',
      header: 'Contact',
      accessor: (contact: Contact) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium">
              {contact.data?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
            </div>
            <ActivityIndicator lastContact={contact.data?.lastContact} />
          </div>
          <div>
            <div className="font-medium text-gray-900 flex items-center gap-2">
              {contact.data?.name || 'Unknown'}
              {contact.data?.priority === 'high' && (
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {contact.data?.email}
              </span>
              {contact.data?.phone && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {contact.data.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
      width: '300px'
    },
    {
      id: 'company',
      header: 'Company',
      accessor: (contact: Contact) => {
        const company = companies.find((c: any) => c.id === contact.data?.companyId)
        const companyName = company?.data?.name || contact.data?.company
        
        if (!companyName) return <span className="text-gray-400">—</span>
        
        return (
          <div className="flex items-center gap-2">
            <img 
              src={getCompanyLogo(companyName) || '/api/placeholder/16/16'} 
              alt=""
              className="w-4 h-4 rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <div>
              <div className="text-sm text-gray-900">{companyName}</div>
              {contact.data?.title && (
                <div className="text-xs text-gray-500">{contact.data.title}</div>
              )}
            </div>
          </div>
        )
      },
      width: '200px'
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (contact: Contact) => {
        const status = contact.data?.status || 'cold'
        const variants: Record<string, any> = {
          cold: 'cold',
          warm: 'warm',
          hot: 'hot',
          active: 'success',
          inactive: 'default'
        }
        const icons: Record<string, any> = {
          cold: Clock,
          warm: MessageSquare,
          hot: AlertCircle,
          active: CheckCircle,
          inactive: Clock
        }
        const Icon = icons[status] || Clock
        return (
          <Chip variant={variants[status] || 'default'} size="sm" icon={<Icon className="h-3 w-3" />}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Chip>
        )
      },
      width: '120px'
    },
    {
      id: 'engagement',
      header: 'Engagement',
      accessor: (contact: Contact) => {
        const emails = contact.metadata?.emailsSent || 0
        const meetings = contact.metadata?.meetingsHeld || 0
        const deals = contact.metadata?.dealsClosed || 0
        
        return (
          <div className="flex items-center gap-3 text-xs">
            {emails > 0 && (
              <span className="flex items-center gap-1 text-gray-600">
                <Mail className="h-3 w-3" />
                {emails}
              </span>
            )}
            {meetings > 0 && (
              <span className="flex items-center gap-1 text-gray-600">
                <Video className="h-3 w-3" />
                {meetings}
              </span>
            )}
            {deals > 0 && (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <Briefcase className="h-3 w-3" />
                {deals}
              </span>
            )}
            {emails === 0 && meetings === 0 && deals === 0 && (
              <span className="text-gray-400">No activity</span>
            )}
          </div>
        )
      },
      width: '140px'
    },
    {
      id: 'tags',
      header: 'Tags',
      accessor: (contact: Contact) => {
        if (!contact.data?.tags || contact.data.tags.length === 0) {
          return <span className="text-gray-400">—</span>
        }
        return (
          <div className="flex gap-1 flex-wrap">
            {contact.data.tags.slice(0, 2).map((tag, idx) => (
              <Chip key={idx} variant="default" size="xs">
                {tag}
              </Chip>
            ))}
            {contact.data.tags.length > 2 && (
              <Chip variant="default" size="xs">
                +{contact.data.tags.length - 2}
              </Chip>
            )}
          </div>
        )
      },
      width: '140px'
    },
    {
      id: 'lastContact',
      header: 'Last Contact',
      accessor: (contact: Contact) => {
        if (!contact.data?.lastContact) {
          return (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Never
            </span>
          )
        }
        const days = Math.floor((Date.now() - new Date(contact.data.lastContact).getTime()) / (1000 * 60 * 60 * 24))
        const color = days <= 7 ? 'text-emerald-600' : days <= 30 ? 'text-amber-600' : 'text-red-600'
        return (
          <span className={`text-xs ${color}`}>
            {formatDistanceToNow(new Date(contact.data.lastContact), { addSuffix: true })}
          </span>
        )
      },
      width: '120px'
    },
    {
      id: 'owner',
      header: 'Owner',
      accessor: (contact: Contact) => {
        if (!contact.data?.owner) {
          return (
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              Assign
            </Button>
          )
        }
        return (
          <Chip variant="default" size="sm" avatar="/api/placeholder/20/20">
            {contact.data.owner}
          </Chip>
        )
      },
      width: '100px'
    },
    {
      id: 'social',
      header: '',
      accessor: (contact: Contact) => (
        <div className="flex gap-1">
          {contact.data?.linkedin && (
            <a 
              href={contact.data.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Linkedin className="h-3 w-3 text-blue-600" />
            </a>
          )}
          {contact.data?.twitter && (
            <a 
              href={contact.data.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Twitter className="h-3 w-3 text-sky-500" />
            </a>
          )}
        </div>
      ),
      width: '60px',
      align: 'right' as const
    }
  ]
  
  return (
    <>
      <div className="p-6">
        <DataTable
          data={filteredContacts}
          columns={columns}
          searchPlaceholder="Search contacts by name, email, company, or title..."
          onSearch={setSearchQuery}
          primaryAction={{
            label: 'New Contact',
            onClick: () => setShowNewContactModal(true)
          }}
          selectedRows={selectedContacts}
          onRowSelect={(id, selected) => {
            const newSelection = new Set(selectedContacts)
            if (selected) {
              newSelection.add(id)
            } else {
              newSelection.delete(id)
            }
            setSelectedContacts(newSelection)
          }}
          isLoading={isLoading}
          emptyState={
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Start building relationships by adding your first contact
              </p>
              <Button onClick={() => setShowNewContactModal(true)}>
                Add First Contact
              </Button>
            </div>
          }
        />
      </div>
      
      {showNewContactModal && (
        <NewContactModal
          onClose={() => {
            setShowNewContactModal(false)
            refetch()
          }}
        />
      )}
    </>
  )
}