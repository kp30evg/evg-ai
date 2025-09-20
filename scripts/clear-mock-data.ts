#!/usr/bin/env node

/**
 * Script to clear all mock/sample data from localStorage and database
 */

console.log('Clear Mock Data Script')
console.log('======================\n')

console.log('⚠️  This script will:')
console.log('1. Clear localStorage data (requires running in browser)')
console.log('2. Remove sample-data.ts file\n')

console.log('To clear localStorage, run this in your browser console:')
console.log('----------------------------------------')
console.log(`localStorage.removeItem('crm_data')`)
console.log(`localStorage.removeItem('hiddenContactColumns')`)
console.log(`localStorage.removeItem('hiddenDealColumns')`)
console.log(`localStorage.removeItem('hiddenCompanyColumns')`)
console.log(`localStorage.removeItem('hiddenLeadColumns')`)
console.log('----------------------------------------\n')

console.log('✅ After clearing localStorage, refresh the page.')
console.log('The CRM should now start with 0 contacts, deals, companies, etc.')