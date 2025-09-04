#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function checkAccounts() {
  console.log('🔍 Checking database accounts...\n');
  
  try {
    const prisma = new PrismaClient();
    
    // Get all accounts
    const accounts = await prisma.account.findMany();
    
    console.log(`📋 Found ${accounts.length} accounts:`);
    
    for (const account of accounts) {
      console.log(`\n📊 Account:`);
      console.log(`   ID: ${account.id}`);
      console.log(`   Account ID: ${account.accountId}`);
      console.log(`   Email: ${account.email}`);
      console.log(`   Exchange: ${account.exchange}`);
      console.log(`   Sync Status: ${account.syncStatus}`);
      console.log(`   Testnet: ${account.testnet}`);
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Failed to check accounts:', error.message);
  }
}

checkAccounts();