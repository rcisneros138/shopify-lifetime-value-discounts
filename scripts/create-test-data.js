#!/usr/bin/env node

/**
 * Create test data for development
 * This script creates test customers with different lifetime values
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestData() {
  console.log('🧪 Creating test data...');

  // Test customers with different lifetime values
  const testCustomers = [
    { 
      email: 'no-discount@example.com', 
      lifetimeValue: 0,
      description: 'New customer - no discount'
    },
    { 
      email: 'almost-10@example.com', 
      lifetimeValue: 2400,
      description: 'Close to 10% discount ($100 away)'
    },
    { 
      email: 'discount-10@example.com', 
      lifetimeValue: 2600,
      description: '10% discount tier'
    },
    { 
      email: 'discount-12@example.com', 
      lifetimeValue: 3700,
      description: '12% discount tier'
    },
    { 
      email: 'discount-15@example.com', 
      lifetimeValue: 5500,
      description: '15% discount tier'
    },
    { 
      email: 'discount-20@example.com', 
      lifetimeValue: 25000,
      description: '20% discount tier (VIP)'
    }
  ];

  console.log('\nTest Customers:');
  console.log('===============');
  
  testCustomers.forEach(customer => {
    console.log(`\n📧 Email: ${customer.email}`);
    console.log(`💰 Lifetime Value: $${customer.lifetimeValue.toLocaleString()}`);
    console.log(`📝 ${customer.description}`);
    
    // Calculate what cart value would trigger next tier
    if (customer.lifetimeValue < 2500) {
      console.log(`🛒 Add $${2500 - customer.lifetimeValue} to cart for 10% discount`);
    } else if (customer.lifetimeValue < 3500) {
      console.log(`🛒 Add $${3500 - customer.lifetimeValue} to cart for 12% discount`);
    } else if (customer.lifetimeValue < 5000) {
      console.log(`🛒 Add $${5000 - customer.lifetimeValue} to cart for 15% discount`);
    } else if (customer.lifetimeValue < 20000) {
      console.log(`🛒 Add $${20000 - customer.lifetimeValue} to cart for 20% discount`);
    } else {
      console.log(`🌟 Maximum discount tier reached!`);
    }
  });

  console.log('\n\n📌 To use these test customers:');
  console.log('1. Create these customers in your Shopify dev store');
  console.log('2. Set their lifetime_value.total_spent metafield to the values shown');
  console.log('3. Log in as each customer to test different discount tiers\n');
}

// Create sample discount codes for reference
function printDiscountCodes() {
  console.log('💳 Required Discount Codes:');
  console.log('===========================');
  console.log('Create these automatic discount codes in Shopify admin:\n');
  
  const discounts = [
    { code: 'LIFETIME_10', percent: '10%', minPurchase: '$2,500' },
    { code: 'LIFETIME_12', percent: '12%', minPurchase: '$3,500' },
    { code: 'LIFETIME_15', percent: '15%', minPurchase: '$5,000' },
    { code: 'LIFETIME_20', percent: '20%', minPurchase: '$20,000' }
  ];
  
  discounts.forEach(discount => {
    console.log(`Code: ${discount.code}`);
    console.log(`Discount: ${discount.percent} off entire order`);
    console.log(`Type: Automatic discount`);
    console.log(`Minimum: None (controlled by app)`);
    console.log('---');
  });
}

async function main() {
  try {
    await createTestData();
    console.log('\n');
    printDiscountCodes();
    
    console.log('\n✅ Test data guide created!');
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();