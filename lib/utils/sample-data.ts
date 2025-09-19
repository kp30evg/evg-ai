import { 
  Contact, 
  Lead, 
  Deal, 
  Company, 
  Product, 
  Order, 
  Activity,
  EmailTemplate 
} from '@/lib/contexts/crm-context'

// Sample data generators
export const generateSampleContacts = (): Contact[] => [
  {
    id: 'contact_1',
    name: 'John Smith',
    email: 'john.smith@acme.com',
    company: 'Acme Corp',
    title: 'VP of Sales',
    phone: '(555) 123-4567',
    lastContact: new Date('2024-01-15'),
    dealValue: 75000,
    status: 'Hot',
    source: 'Referral',
    tags: ['decision-maker', 'enterprise'],
    customFields: { linkedin: 'linkedin.com/in/johnsmith' }
  },
  {
    id: 'contact_2',
    name: 'Sarah Johnson',
    email: 'sarah@techstart.io',
    company: 'TechStart',
    title: 'CEO',
    phone: '(555) 234-5678',
    lastContact: new Date('2024-01-14'),
    dealValue: 125000,
    status: 'Warm',
    source: 'Inbound',
    tags: ['founder', 'startup'],
    customFields: { preferredContact: 'email' }
  },
  {
    id: 'contact_3',
    name: 'Mike Chen',
    email: 'mchen@enterprise.com',
    company: 'Enterprise Co',
    title: 'Director of IT',
    phone: '(555) 345-6789',
    lastContact: new Date('2024-01-10'),
    dealValue: 45000,
    status: 'Cold',
    source: 'Cold Outreach',
    tags: ['technical', 'enterprise']
  },
  {
    id: 'contact_4',
    name: 'Emily Davis',
    email: 'emily.davis@globaltech.com',
    company: 'GlobalTech Solutions',
    title: 'Product Manager',
    phone: '(555) 456-7890',
    lastContact: new Date('2024-01-16'),
    dealValue: 95000,
    status: 'Hot',
    source: 'Website',
    tags: ['product', 'decision-maker']
  },
  {
    id: 'contact_5',
    name: 'Robert Wilson',
    email: 'rwilson@innovate.io',
    company: 'Innovate Labs',
    title: 'CTO',
    phone: '(555) 567-8901',
    lastContact: new Date('2024-01-12'),
    dealValue: 150000,
    status: 'Warm',
    source: 'LinkedIn',
    tags: ['technical', 'c-suite', 'startup']
  }
]

export const generateSampleLeads = (): Lead[] => [
  {
    id: 'lead_1',
    name: 'Alice Cooper',
    email: 'alice@prospect.com',
    company: 'Prospect Inc',
    source: 'Website',
    status: 'New',
    score: 85,
    assignedTo: 'You',
    createdAt: new Date('2024-01-16'),
    lastActivity: new Date('2024-01-16')
  },
  {
    id: 'lead_2',
    name: 'Bob Martinez',
    email: 'bob@futuretech.com',
    company: 'FutureTech',
    source: 'LinkedIn',
    status: 'Contacted',
    score: 72,
    assignedTo: 'You',
    createdAt: new Date('2024-01-15'),
    lastActivity: new Date('2024-01-15')
  },
  {
    id: 'lead_3',
    name: 'Carol Thompson',
    email: 'carol@growth.co',
    company: 'Growth Company',
    source: 'Cold Outreach',
    status: 'Qualified',
    score: 90,
    assignedTo: 'You',
    createdAt: new Date('2024-01-14'),
    lastActivity: new Date('2024-01-16')
  },
  {
    id: 'lead_4',
    name: 'David Kim',
    email: 'dkim@startup.io',
    source: 'Referral',
    status: 'New',
    score: 65,
    assignedTo: 'Team',
    createdAt: new Date('2024-01-17'),
    lastActivity: new Date('2024-01-17')
  }
]

export const generateSampleDeals = (): Deal[] => [
  {
    id: 'deal_1',
    name: 'Acme Corp - Enterprise Package',
    company: 'Acme Corp',
    value: 75000,
    stage: 'Proposal',
    probability: 60,
    closeDate: new Date('2024-02-15'),
    owner: 'You',
    contactId: 'contact_1',
    companyId: 'company_1',
    products: ['product_1', 'product_2'],
    lastActivity: new Date('2024-01-15')
  },
  {
    id: 'deal_2',
    name: 'TechStart - Annual Subscription',
    company: 'TechStart',
    value: 125000,
    stage: 'Negotiation',
    probability: 80,
    closeDate: new Date('2024-02-01'),
    owner: 'You',
    contactId: 'contact_2',
    companyId: 'company_2',
    products: ['product_1'],
    lastActivity: new Date('2024-01-14')
  },
  {
    id: 'deal_3',
    name: 'Enterprise Co - Pilot Program',
    company: 'Enterprise Co',
    value: 45000,
    stage: 'Qualification',
    probability: 30,
    closeDate: new Date('2024-03-01'),
    owner: 'You',
    contactId: 'contact_3',
    companyId: 'company_3',
    products: ['product_3'],
    lastActivity: new Date('2024-01-10')
  },
  {
    id: 'deal_4',
    name: 'GlobalTech - Multi-Year Deal',
    company: 'GlobalTech Solutions',
    value: 250000,
    stage: 'Closed Won',
    probability: 100,
    closeDate: new Date('2024-01-10'),
    owner: 'You',
    contactId: 'contact_4',
    companyId: 'company_4',
    products: ['product_1', 'product_2', 'product_3'],
    lastActivity: new Date('2024-01-10')
  },
  {
    id: 'deal_5',
    name: 'Innovate Labs - Custom Solution',
    company: 'Innovate Labs',
    value: 150000,
    stage: 'Prospecting',
    probability: 20,
    closeDate: new Date('2024-03-15'),
    owner: 'You',
    contactId: 'contact_5',
    companyId: 'company_5',
    products: ['product_2'],
    lastActivity: new Date('2024-01-16')
  },
  {
    id: 'deal_6',
    name: 'Prospect Inc - Trial to Paid',
    company: 'Prospect Inc',
    value: 35000,
    stage: 'Qualification',
    probability: 40,
    closeDate: new Date('2024-02-20'),
    owner: 'Team',
    companyId: 'company_6',
    products: ['product_3'],
    lastActivity: new Date('2024-01-15')
  }
]

export const generateSampleCompanies = (): Company[] => [
  {
    id: 'company_1',
    name: 'Acme Corp',
    domain: 'acme.com',
    industry: 'Technology',
    size: '500-1000',
    location: 'San Francisco, CA',
    deals: 3,
    value: 250000,
    lastActivity: new Date('2024-01-15'),
    contacts: ['contact_1']
  },
  {
    id: 'company_2',
    name: 'TechStart',
    domain: 'techstart.io',
    industry: 'Software',
    size: '50-100',
    location: 'New York, NY',
    deals: 2,
    value: 175000,
    lastActivity: new Date('2024-01-14'),
    contacts: ['contact_2']
  },
  {
    id: 'company_3',
    name: 'Enterprise Co',
    domain: 'enterprise.com',
    industry: 'Finance',
    size: '1000-5000',
    location: 'Chicago, IL',
    deals: 1,
    value: 45000,
    lastActivity: new Date('2024-01-10'),
    contacts: ['contact_3']
  },
  {
    id: 'company_4',
    name: 'GlobalTech Solutions',
    domain: 'globaltech.com',
    industry: 'Technology',
    size: '200-500',
    location: 'Austin, TX',
    deals: 4,
    value: 380000,
    lastActivity: new Date('2024-01-16'),
    contacts: ['contact_4']
  },
  {
    id: 'company_5',
    name: 'Innovate Labs',
    domain: 'innovate.io',
    industry: 'Research',
    size: '10-50',
    location: 'Boston, MA',
    deals: 2,
    value: 150000,
    lastActivity: new Date('2024-01-12'),
    contacts: ['contact_5']
  },
  {
    id: 'company_6',
    name: 'Prospect Inc',
    domain: 'prospect.com',
    industry: 'Retail',
    size: '100-200',
    location: 'Seattle, WA',
    deals: 1,
    value: 35000,
    lastActivity: new Date('2024-01-16')
  }
]

export const generateSampleProducts = (): Product[] => [
  {
    id: 'product_1',
    name: 'Enterprise Plan',
    sku: 'ENT-001',
    category: 'Subscription',
    price: 999,
    cost: 200,
    inventory: 999,
    status: 'Active',
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'product_2',
    name: 'Professional Plan',
    sku: 'PRO-001',
    category: 'Subscription',
    price: 499,
    cost: 100,
    inventory: 999,
    status: 'Active',
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'product_3',
    name: 'Starter Plan',
    sku: 'STR-001',
    category: 'Subscription',
    price: 99,
    cost: 20,
    inventory: 999,
    status: 'Active',
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'product_4',
    name: 'Custom Integration',
    sku: 'INT-001',
    category: 'Service',
    price: 5000,
    cost: 2000,
    inventory: 50,
    status: 'Active',
    createdAt: new Date('2023-06-01')
  },
  {
    id: 'product_5',
    name: 'Training Package',
    sku: 'TRN-001',
    category: 'Service',
    price: 2500,
    cost: 500,
    inventory: 100,
    status: 'Active',
    createdAt: new Date('2023-07-01')
  }
]

export const generateSampleOrders = (): Order[] => [
  {
    id: 'order_1',
    orderNumber: 'ORD-2024-001',
    customerId: 'contact_1',
    customerName: 'John Smith',
    customerEmail: 'john.smith@acme.com',
    lineItems: [
      { productId: 'product_1', productName: 'Enterprise Plan', quantity: 1, price: 999, total: 999 },
      { productId: 'product_4', productName: 'Custom Integration', quantity: 1, price: 5000, total: 5000 }
    ],
    subtotal: 5999,
    tax: 599.90,
    total: 6598.90,
    status: 'Processing',
    orderDate: new Date('2024-01-15'),
    deliveryDate: new Date('2024-01-20')
  },
  {
    id: 'order_2',
    orderNumber: 'ORD-2024-002',
    customerId: 'contact_2',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah@techstart.io',
    lineItems: [
      { productId: 'product_1', productName: 'Enterprise Plan', quantity: 2, price: 999, total: 1998 }
    ],
    subtotal: 1998,
    tax: 199.80,
    total: 2197.80,
    status: 'Delivered',
    orderDate: new Date('2024-01-10'),
    deliveryDate: new Date('2024-01-12')
  },
  {
    id: 'order_3',
    orderNumber: 'ORD-2024-003',
    customerId: 'contact_3',
    customerName: 'Mike Chen',
    customerEmail: 'mchen@enterprise.com',
    lineItems: [
      { productId: 'product_2', productName: 'Professional Plan', quantity: 5, price: 499, total: 2495 },
      { productId: 'product_5', productName: 'Training Package', quantity: 1, price: 2500, total: 2500 }
    ],
    subtotal: 4995,
    tax: 499.50,
    total: 5494.50,
    status: 'Pending',
    orderDate: new Date('2024-01-16')
  },
  {
    id: 'order_4',
    orderNumber: 'ORD-2024-004',
    customerId: 'contact_4',
    customerName: 'Emily Davis',
    customerEmail: 'emily.davis@globaltech.com',
    lineItems: [
      { productId: 'product_3', productName: 'Starter Plan', quantity: 10, price: 99, total: 990 }
    ],
    subtotal: 990,
    tax: 99,
    total: 1089,
    status: 'Shipped',
    orderDate: new Date('2024-01-14'),
    deliveryDate: new Date('2024-01-18')
  }
]

export const generateSampleActivities = (): Activity[] => [
  {
    id: 'activity_1',
    type: 'call',
    title: 'Discovery call with John Smith',
    description: 'Discussed their current challenges with data management and how our solution could help.',
    entityType: 'contact',
    entityId: 'contact_1',
    createdAt: new Date('2024-01-15T10:00:00'),
    createdBy: 'You',
    duration: 30,
    completed: true,
    outcome: 'Positive - Moving to proposal stage'
  },
  {
    id: 'activity_2',
    type: 'email',
    title: 'Sent proposal to Sarah Johnson',
    description: 'Sent detailed proposal for enterprise package with custom pricing.',
    entityType: 'contact',
    entityId: 'contact_2',
    createdAt: new Date('2024-01-14T14:30:00'),
    createdBy: 'You',
    completed: true
  },
  {
    id: 'activity_3',
    type: 'meeting',
    title: 'Product demo with Enterprise Co team',
    description: 'Live demonstration of platform capabilities to their IT team.',
    entityType: 'deal',
    entityId: 'deal_3',
    createdAt: new Date('2024-01-10T15:00:00'),
    createdBy: 'You',
    dueDate: new Date('2024-01-18T15:00:00'),
    duration: 60,
    completed: false
  },
  {
    id: 'activity_4',
    type: 'task',
    title: 'Follow up on contract review',
    description: 'Check if legal team has reviewed the contract terms.',
    entityType: 'deal',
    entityId: 'deal_2',
    createdAt: new Date('2024-01-16T09:00:00'),
    createdBy: 'You',
    dueDate: new Date('2024-01-20T17:00:00'),
    completed: false
  },
  {
    id: 'activity_5',
    type: 'note',
    title: 'Competitor mentioned',
    description: 'Client mentioned they are also evaluating CompetitorX. Need to emphasize our unique value props.',
    entityType: 'company',
    entityId: 'company_3',
    createdAt: new Date('2024-01-12T11:00:00'),
    createdBy: 'You',
    completed: true
  }
]

export const generateSampleEmailTemplates = (): EmailTemplate[] => [
  {
    id: 'template_1',
    name: 'Initial Outreach',
    subject: 'Quick question about {{company}}',
    body: `Hi {{firstName}},

I noticed that {{company}} is growing rapidly in the {{industry}} space. 

Many companies at your stage struggle with {{challenge}}. We've helped similar companies like {{similarCompany}} achieve {{result}}.

Would you be open to a brief 15-minute call next week to explore if we could help {{company}} as well?

Best regards,
{{senderName}}`,
    category: 'Outreach',
    variables: ['firstName', 'company', 'industry', 'challenge', 'similarCompany', 'result', 'senderName'],
    sharedWithTeam: true,
    usageCount: 45,
    createdAt: new Date('2023-10-01')
  },
  {
    id: 'template_2',
    name: 'Follow Up - After Demo',
    subject: 'Following up on our demo - {{company}}',
    body: `Hi {{firstName}},

Thank you for taking the time to see our platform demo yesterday.

As discussed, here are the key points that align with {{company}}'s needs:
- {{point1}}
- {{point2}}
- {{point3}}

I'm attaching the proposal we discussed. The investment would be {{price}} for {{package}}.

What questions can I answer for you?

Best,
{{senderName}}`,
    category: 'Follow Up',
    variables: ['firstName', 'company', 'point1', 'point2', 'point3', 'price', 'package', 'senderName'],
    sharedWithTeam: true,
    usageCount: 28,
    createdAt: new Date('2023-11-01')
  },
  {
    id: 'template_3',
    name: 'Contract Follow Up',
    subject: 'Quick check-in on contract - {{company}}',
    body: `Hi {{firstName}},

I wanted to check in on the contract I sent over last {{day}}.

Have you had a chance to review it with your team? 

If there are any questions or concerns about the terms, I'm happy to hop on a quick call to discuss.

Looking forward to getting {{company}} started with {{product}}!

Best,
{{senderName}}`,
    category: 'Follow Up',
    variables: ['firstName', 'company', 'day', 'product', 'senderName'],
    sharedWithTeam: false,
    usageCount: 15,
    createdAt: new Date('2023-12-01')
  }
]

// Function to initialize all sample data
export const initializeSampleData = () => {
  return {
    contacts: generateSampleContacts(),
    leads: generateSampleLeads(),
    deals: generateSampleDeals(),
    companies: generateSampleCompanies(),
    products: generateSampleProducts(),
    orders: generateSampleOrders(),
    activities: generateSampleActivities(),
    emailTemplates: generateSampleEmailTemplates()
  }
}