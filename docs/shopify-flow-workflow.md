# Shopify Flow Workflow Configuration

This document describes how to set up the Shopify Flow workflow that updates customer lifetime spending after each order.

## Workflow: Update Customer Lifetime Spent

### Trigger
- **Event**: Order paid
- **Conditions**: None (runs for all paid orders)

### Actions

1. **Get customer data**
   - Retrieve current customer metafield value
   - Query: `customer.metafield(namespace: "lifetime_value", key: "total_spent")`

2. **Calculate new total**
   - Add order total to existing lifetime value
   - Formula: `{{customer.metafield.value | default: 0}} + {{order.totalPrice}}`

3. **Update customer metafield**
   - Namespace: `lifetime_value`
   - Key: `total_spent`
   - Value: Calculated total from step 2
   - Type: `number_decimal`

### Implementation Steps

1. Go to Shopify Admin → Apps → Flow
2. Click "Create workflow"
3. Name: "Update Customer Lifetime Value"
4. Add trigger: "Order paid"
5. Add action: "Update customer metafield"
6. Configure the metafield update:
   ```
   Namespace: lifetime_value
   Key: total_spent
   Value: {{customer.metafields.lifetime_value.total_spent.value | plus: order.totalPriceSet.shopMoney.amount}}
   ```
7. Save and activate the workflow

### Alternative: Using GraphQL Admin API

If you prefer to handle this in your app instead of Flow:

```graphql
mutation updateCustomerLifetimeSpent($customerId: ID!, $newTotal: String!) {
  customerUpdate(
    input: {
      id: $customerId
      metafields: [{
        namespace: "lifetime_value"
        key: "total_spent"
        value: $newTotal
        type: "number_decimal"
      }]
    }
  ) {
    customer {
      id
      metafield(namespace: "lifetime_value", key: "total_spent") {
        value
      }
    }
    userErrors {
      field
      message
    }
  }
}
```

### Testing

1. Create a test order
2. Mark it as paid
3. Check the customer's metafield value in Admin API
4. Verify the lifetime value has been updated

### Notes

- The workflow only counts paid orders
- Refunds are not automatically subtracted (you'd need another workflow for that)
- The metafield must be created before the workflow can update it
- Use the setup script to create the metafield definition