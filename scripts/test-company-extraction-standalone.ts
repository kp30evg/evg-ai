#!/usr/bin/env tsx

// Standalone version of the company extraction function for testing
function extractCompanyFromEmail(email: string): string | null {
  if (!email || !email.includes('@')) return null;
  
  const domainMatch = email.toLowerCase().match(/@(.+)$/);
  if (!domainMatch) return null;
  
  const fullDomain = domainMatch[1];
  const parts = fullDomain.split('.');
  
  // Skip personal email providers
  const personalDomains = ['gmail', 'yahoo', 'hotmail', 'outlook', 'live', 'msn', 'aol', 'icloud', 'protonmail', 'fastmail', 'zoho', 'yandex', 'qq', 'me'];
  
  // Check if it's a simple domain (company.com)
  if (parts.length === 2) {
    const companyPart = parts[0];
    
    // Skip if it's a personal domain
    if (personalDomains.includes(companyPart)) return null;
    
    // Skip common email prefixes
    const skipPrefixes = ['mail', 'smtp', 'email', 'noreply', 'no-reply', 'support', 'help', 'info', 'contact', 'admin', 'webmaster', 'postmaster'];
    if (skipPrefixes.includes(companyPart)) return null;
    
    // Clean and capitalize
    const cleaned = companyPart.replace(/[^a-z0-9]/gi, '');
    if (!cleaned) return null;
    
    // Handle acronyms
    if (cleaned.length <= 3 && cleaned === cleaned.toUpperCase()) {
      return cleaned.toUpperCase();
    }
    
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  }
  
  // For subdomains (e.g., learn.therundown.ai, mail.google.com)
  // Try to extract the main company name
  if (parts.length >= 3) {
    // First check if the second-to-last part is a personal domain
    const mainPart = parts[parts.length - 2];
    if (personalDomains.includes(mainPart)) return null;
    
    // Skip if it's a mail/support subdomain of a known service
    const firstPart = parts[0];
    if (['mail', 'smtp', 'email', 'support', 'help'].includes(firstPart) && 
        personalDomains.includes(mainPart)) {
      return null;
    }
    
    // Use the second-to-last part as the company name
    const companyPart = mainPart;
    
    // Skip common prefixes
    const skipPrefixes = ['mail', 'smtp', 'email', 'noreply', 'no-reply', 'support', 'help', 'info', 'contact', 'admin', 'webmaster', 'postmaster'];
    if (skipPrefixes.includes(companyPart)) return null;
    
    // Clean and capitalize
    const cleaned = companyPart.replace(/[^a-z0-9]/gi, '');
    if (!cleaned) return null;
    
    // Handle acronyms
    if (cleaned.length <= 3 && cleaned === cleaned.toUpperCase()) {
      return cleaned.toUpperCase();
    }
    
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  }
  
  // Fallback: use the first part of the domain
  const companyPart = parts[0];
  
  // Skip personal domains
  if (personalDomains.includes(companyPart)) return null;
  
  // Skip common email prefixes
  const skipPrefixes = ['mail', 'smtp', 'email', 'noreply', 'no-reply', 'support', 'help', 'info', 'contact', 'admin', 'webmaster', 'postmaster'];
  if (skipPrefixes.includes(companyPart)) return null;
  
  // Clean and capitalize
  const cleaned = companyPart.replace(/[^a-z0-9]/gi, '');
  if (!cleaned) return null;
  
  // Handle acronyms
  if (cleaned.length <= 3 && cleaned === cleaned.toUpperCase()) {
    return cleaned.toUpperCase();
  }
  
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

const testEmails = [
  // Simple company domains
  'john@acme.com',
  'alice@microsoft.com',
  'bob@apple.com',
  'sarah@tesla.com',
  'jane@vanta.com',
  
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