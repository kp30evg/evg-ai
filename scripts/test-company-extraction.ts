#!/usr/bin/env tsx

import { extractCompanyFromEmail } from '../lib/modules-simple/evercore'

const testEmails = [
  // Simple company domains
  'john@acme.com',
  'alice@microsoft.com',
  'bob@apple.com',
  'sarah@tesla.com',
  
  // Subdomain cases
  'growth@instantly.ai',
  'hi@learn.therundown.ai',
  'support@mail.google.com',
  'team@blog.notion.so',
  
  // Personal emails (should return null)
  'user@gmail.com',
  'person@yahoo.com',
  'someone@hotmail.com',
  
  // Edge cases
  'admin@ibm.com',
  'contact@ge.com',
  'info@t.co',
  'hello@x.com',
  
  // Complex domains
  'sales@company.co.uk',
  'marketing@business.org.au',
  'hr@startup.io',
  'dev@cloud.aws.amazon.com'
]

console.log('🧪 Testing Company Extraction from Emails\n')
console.log('=' .repeat(60))

testEmails.forEach(email => {
  const company = extractCompanyFromEmail(email)
  const result = company ? `✅ "${company}"` : '❌ null (personal/skip)'
  console.log(`${email.padEnd(35)} → ${result}`)
})

console.log('=' .repeat(60))
console.log('\n✨ Test complete!')