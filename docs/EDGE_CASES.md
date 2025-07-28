# Edge Cases and Limitations

This document covers important edge cases, limitations, and their solutions.

## 1. Guest Checkouts

**Issue**: Guest customers don't have customer IDs or metafields.

**Solution**:
```javascript
// In cart-monitor.js
if (!customerId) {
  console.log('Guest checkout - no lifetime discount available');
  return { discountPercent: 0, discountCode: null };
}
```

**Alternative**: Encourage account creation with incentives.

## 2. Multiple Discount Conflicts

**Issue**: Shopify only allows one discount code per checkout.

**Scenarios**:
- Customer has a promotional code
- Multiple automatic discounts conflict
- Gift card + discount code

**Solution**:
```javascript
// Priority system in cart-monitor.js
const DISCOUNT_PRIORITY = {
  'PROMO_CODE': 1,      // Highest priority
  'LIFETIME_20': 2,
  'LIFETIME_15': 3,
  'LIFETIME_12': 4,
  'LIFETIME_10': 5      // Lowest priority
};

// Check existing discount before applying
if (cart.discount_code && DISCOUNT_PRIORITY[cart.discount_code] < DISCOUNT_PRIORITY[newCode]) {
  // Don't override higher priority discount
  return;
}
```

## 3. Refunds and Returns

**Issue**: Lifetime spent doesn't automatically decrease with refunds.

**Solution**: Additional Flow workflow
```yaml
Trigger: Refund created
Condition: Refund amount > 0
Action: Update customer metafield
  Value: {{customer.metafields.lifetime_value.total_spent.value | minus: refund.totalRefundedSet.shopMoney.amount}}
```

## 4. Currency Conversion

**Issue**: Multi-currency stores need consistent calculations.

**Solution**:
```javascript
// Always use shop currency for calculations
const cartTotalInShopCurrency = cart.total_price / 100; // cents to dollars

// In GraphQL, use shopMoney amounts
order.totalPriceSet.shopMoney.amount
```

## 5. Cart Abandonment

**Issue**: Discount codes remain "applied" in abandoned carts.

**Solution**:
```javascript
// Add session timeout
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

if (Date.now() - lastActivity > SESSION_TIMEOUT) {
  clearDiscountCode();
}
```

## 6. Race Conditions

**Issue**: Rapid cart updates cause conflicting discount applications.

**Solution**:
```javascript
// Debounce cart monitoring
let debounceTimer;
function debouncedMonitorCart() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(monitorCart, 500);
}
```

## 7. B2B and Wholesale

**Issue**: B2B customers might have different pricing rules.

**Solution**:
```javascript
// Check customer tags
if (customer.tags.includes('wholesale') || customer.tags.includes('b2b')) {
  // Skip lifetime discount for B2B
  return { discountPercent: 0, discountCode: null };
}
```

## 8. Subscription Orders

**Issue**: Recurring subscription orders continuously increase lifetime value.

**Solution**:
```javascript
// In Flow workflow, check order tags
Condition: NOT order.tags contains "subscription_renewal"
```

## 9. Draft Orders

**Issue**: Draft orders might not trigger Flow workflows.

**Solution**: Use additional trigger
```yaml
Triggers:
  - Order paid
  - Draft order completed
```

## 10. Performance Impact

**Issue**: Cart monitoring affects page performance.

**Solution**:
```javascript
// Use Web Workers for heavy calculations
const worker = new Worker('discount-calculator.js');
worker.postMessage({ cart, customerId });

// Or use requestIdleCallback
requestIdleCallback(() => {
  monitorCart();
});
```

## 11. Discount Stacking

**Issue**: Customer wants to use multiple discounts.

**Solution**: Create combination codes
```javascript
// Instead of separate codes, create combined discounts
'LIFETIME_10_FREESHIP' // 10% + free shipping
'LIFETIME_15_GIFT'     // 15% + gift with purchase
```

## 12. API Rate Limits

**Issue**: Too many API calls hit Shopify's rate limits.

**Solution**:
```javascript
// Implement caching
const customerCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedCustomerData(customerId) {
  const cached = customerCache.get(customerId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}
```

## 13. Testing Edge Cases

### Test Scenarios:

1. **Discount Threshold Boundaries**
   - Cart exactly $2,500
   - Cart $2,499.99
   - Cart $2,500.01

2. **Customer State Changes**
   - Login during shopping
   - Logout with items in cart
   - Session expiration

3. **Concurrent Updates**
   - Multiple tabs open
   - Mobile + desktop sessions
   - API updates during checkout

### Test Data:
```javascript
// Create test customers with specific lifetime values
const testCustomers = [
  { email: 'test-0@example.com', lifetime: 0 },
  { email: 'test-2499@example.com', lifetime: 2499 },
  { email: 'test-3500@example.com', lifetime: 3500 },
  { email: 'test-5000@example.com', lifetime: 5000 },
  { email: 'test-20000@example.com', lifetime: 20000 }
];
```

## 14. Rollback Plan

If issues arise:

1. **Disable Script Tag**: Remove or disable the cart monitor
2. **Deactivate Discounts**: Pause all LIFETIME_* discount codes
3. **Stop Flow Workflow**: Deactivate the lifetime value update workflow
4. **Clear Cache**: Reset any cached discount states

## 15. Known Limitations

1. **Cannot stack with other automatic discounts**
2. **Discount codes visible in checkout**
3. **Requires customer login for personalization**
4. **Subject to Shopify's discount code limits**
5. **No real-time sync across devices**

## Best Practices

1. **Always fail gracefully** - Don't break checkout
2. **Log extensively** - Track all discount decisions
3. **Monitor performance** - Watch for impact on conversion
4. **Communicate clearly** - Show customers why they got a discount
5. **Test thoroughly** - Use staging environment first