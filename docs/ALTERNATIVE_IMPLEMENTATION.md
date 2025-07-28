# Alternative Implementation: Customer Tag-Based Approach

A simpler but less dynamic approach using customer tags and Shopify Flow.

## Overview

Instead of real-time cart monitoring, use customer tags to assign discount tiers:
- `vip-10` - 10% discount tier
- `vip-12` - 12% discount tier  
- `vip-15` - 15% discount tier
- `vip-20` - 20% discount tier

## Implementation Steps

### 1. Create Automatic Discounts by Customer Tag

```graphql
mutation createTagBasedDiscount {
  discountAutomaticBasicCreate(automaticBasicDiscount: {
    title: "VIP 10% Discount"
    startsAt: "2024-01-01T00:00:00Z"
    customerGets: {
      value: { percentage: 0.10 }
      items: { all: true }
    }
    customerSelection: {
      customerAll: false
      customers: {
        customerSavedSearchIds: ["gid://shopify/CustomerSavedSearch/123"]
      }
    }
  }) {
    automaticDiscountNode { id }
    userErrors { field message }
  }
}
```

### 2. Shopify Flow Workflow

```yaml
Name: Update Customer VIP Status
Trigger: Order paid
Actions:
  1. Get customer data
  2. Calculate new lifetime total
  3. Remove all vip-* tags
  4. Add appropriate vip tag based on total:
     - If total >= 20000: Add tag "vip-20"
     - Else if total >= 5000: Add tag "vip-15"
     - Else if total >= 3500: Add tag "vip-12"
     - Else if total >= 2500: Add tag "vip-10"
```

### 3. Create Customer Segments

For each VIP tier, create a customer segment:
1. Go to Customers > Segments
2. Create segment "VIP 10%" with filter: Customer tags contains "vip-10"
3. Repeat for all tiers

### 4. Link Discounts to Segments

Create automatic discounts that apply to customer segments:
- Each discount targets its corresponding customer segment
- Discounts apply automatically at checkout

## Pros and Cons

### Pros ✅
- No custom code needed
- Works entirely with native Shopify features
- Easy to understand and maintain
- No performance impact on storefront
- Works with all sales channels

### Cons ❌
- Not real-time (updates after order completion)
- Current cart value doesn't count toward tier
- Tags visible in customer admin
- Requires manual segment creation

## Hybrid Approach

Combine both approaches for best results:

1. **Use tags for base tier** (updated via Flow after orders)
2. **Use cart monitor for preview** (show potential discount)
3. **Apply higher of the two** discounts

```javascript
// Modified cart-monitor.js for hybrid approach
async function calculateDiscount(cart, customerTags) {
  // Get base discount from tags
  const baseDiscount = getDiscountFromTags(customerTags);
  
  // Calculate potential discount with current cart
  const potentialDiscount = await calculatePotentialDiscount(cart);
  
  // Show message if they could get better discount
  if (potentialDiscount > baseDiscount) {
    showMessage(`Add $${amountNeeded} more to unlock ${potentialDiscount}% off!`);
  }
  
  return Math.max(baseDiscount, potentialDiscount);
}
```

## Quick Start Script

```javascript
// setup-tag-based-discounts.js
const segments = [
  { name: 'VIP 10%', tag: 'vip-10' },
  { name: 'VIP 12%', tag: 'vip-12' },
  { name: 'VIP 15%', tag: 'vip-15' },
  { name: 'VIP 20%', tag: 'vip-20' }
];

async function setupTagBasedDiscounts(admin) {
  for (const segment of segments) {
    // Create customer saved search
    const search = await admin.rest.post({
      path: 'customer_saved_searches',
      data: {
        customer_saved_search: {
          name: segment.name,
          query: `tag:${segment.tag}`
        }
      }
    });
    
    console.log(`Created segment: ${segment.name}`);
  }
}
```

## Migration Path

To migrate existing customers:

```javascript
// migrate-customers.js
async function migrateCustomersToTags(admin) {
  const customers = await admin.graphql(`
    query {
      customers(first: 250) {
        edges {
          node {
            id
            metafield(namespace: "lifetime_value", key: "total_spent") {
              value
            }
          }
        }
      }
    }
  `);
  
  for (const customer of customers) {
    const spent = parseFloat(customer.metafield?.value || 0);
    const tag = getAppropriateTier(spent);
    
    await admin.graphql(`
      mutation {
        tagsAdd(id: "${customer.id}", tags: ["${tag}"]) {
          userErrors { message }
        }
      }
    `);
  }
}
```

## Comparison Table

| Feature | Real-time Cart Monitor | Tag-Based | Hybrid |
|---------|----------------------|-----------|---------|
| Real-time updates | ✅ | ❌ | ✅ |
| Includes current cart | ✅ | ❌ | ✅ |
| Code complexity | High | Low | Medium |
| Performance impact | Medium | None | Low |
| Guest checkout support | ❌ | ❌ | ❌ |
| Multi-channel support | Limited | ✅ | ✅ |
| Maintenance | High | Low | Medium |

## Recommendation

- **Small stores (<1000 customers)**: Use tag-based approach
- **Medium stores (1000-10000 customers)**: Use hybrid approach
- **Large stores (>10000 customers)**: Consider Shopify Plus for native features
- **Technical teams**: Use real-time cart monitor
- **Non-technical teams**: Use tag-based approach
