# Shopify Lifetime Value Discount System

A Shopify app that implements dynamic discounts based on customer lifetime value + current cart value, designed for non-Plus stores.

## Overview

This system automatically applies percentage discounts based on the total of:
- Customer's historical spending (stored in metafields)
- Current cart value

### Discount Tiers
- **10% off**: Total ≥ $2,500 and < $3,500
- **12% off**: Total ≥ $3,500 and < $5,000
- **15% off**: Total ≥ $5,000 and < $20,000
- **20% off**: Total ≥ $20,000

## Architecture

### Components

1. **Cart Monitor (Frontend)**
   - Script tag injected into storefront
   - Monitors cart changes in real-time
   - Communicates with backend API

2. **Remix App (Backend)**
   - Handles discount calculations
   - Manages automatic discount codes
   - Updates customer metafields
   - Integrates with Shopify Flow

3. **Shopify Flow Integration**
   - Updates lifetime spent after order completion
   - Triggers discount recalculations

4. **Data Storage**
   - Customer metafield: `lifetime_value.total_spent`
   - Tracks historical order totals

## Implementation Approach

Since Shopify's native automatic discounts don't support dynamic calculations based on metafields, we use a hybrid approach:

1. **Pre-created Discount Codes**: Create four automatic discount codes (10%, 12%, 15%, 20%)
2. **Dynamic Application**: Apply/remove codes based on real-time calculations
3. **Cart Monitoring**: Watch for cart changes and recalculate eligibility
4. **Session Management**: Track discount state per customer session

## Technical Stack

- **Frontend**: Vanilla JavaScript (Script Tag)
- **Backend**: Remix + Shopify App
- **APIs**: 
  - Storefront API (cart access)
  - Admin API (discount management)
  - Cart AJAX API (real-time updates)
- **Automation**: Shopify Flow

## Installation

```bash
npm install
npm run dev
```

## Configuration

1. Create automatic discount codes in Shopify admin:
   - `LIFETIME_10` - 10% off entire order
   - `LIFETIME_12` - 12% off entire order
   - `LIFETIME_15` - 15% off entire order
   - `LIFETIME_20` - 20% off entire order

2. Set up customer metafield definition:
   - Namespace: `lifetime_value`
   - Key: `total_spent`
   - Type: `number_decimal`

3. Configure Shopify Flow workflow for order completion

## Limitations & Considerations

- Requires automatic discount codes (not Functions)
- Cart monitoring adds slight performance overhead
- Discount codes visible to customers
- Maximum one discount code per checkout
