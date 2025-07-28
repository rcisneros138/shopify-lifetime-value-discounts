# Installation Guide

Follow these steps to install and configure the Lifetime Value Discount system.

## Prerequisites

- Shopify store (Basic, Shopify, or Advanced plan)
- Node.js 18+ installed
- Shopify CLI installed
- Admin API access

## Step 1: Clone and Install

```bash
git clone https://github.com/your-username/shopify-lifetime-value-discounts.git
cd shopify-lifetime-value-discounts
npm install
```

## Step 2: Configure Shopify App

1. Create a new app in your Shopify Partners dashboard
2. Set up OAuth callback URLs:
   - `https://your-app-url.com/auth/callback`
   - `https://your-app-url.com/auth/shopify/callback`

3. Configure API scopes:
   - `read_customers`
   - `write_customers`
   - `read_discounts`
   - `write_discounts`
   - `read_script_tags`
   - `write_script_tags`

## Step 3: Environment Setup

Create a `.env` file:

```env
SHOPIFY_APP_URL=https://your-app-url.com
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SCOPES=read_customers,write_customers,read_discounts,write_discounts,read_script_tags,write_script_tags
HOST=your-app-url.com
```

## Step 4: Run Setup Script

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Install the app in your store

3. Navigate to `/apps/lifetime-discounts/setup` in your app

4. Click "Run Setup" to create:
   - Customer metafield definition
   - Four automatic discount codes

## Step 5: Install Cart Monitor Script

### Option A: Through Theme Editor

1. Go to Online Store > Themes > Actions > Edit code
2. In `layout/theme.liquid`, add before `</body>`:
   ```html
   <script src="{{ 'cart-monitor.js' | asset_url }}" defer></script>
   ```
3. Upload `public/cart-monitor.js` to Assets folder

### Option B: Through Script Tag API

```javascript
// Add this to your app's installation process
const scriptTag = {
  script_tag: {
    event: 'onload',
    src: 'https://your-app-url.com/cart-monitor.js'
  }
};

await admin.rest.post({
  path: 'script_tags',
  data: scriptTag
});
```

## Step 6: Configure Shopify Flow

1. Install Shopify Flow app (free)
2. Create new workflow: "Update Customer Lifetime Value"
3. Add trigger: "Order paid"
4. Add action: "Update customer metafield"
5. Configure metafield update:
   ```
   Namespace: lifetime_value
   Key: total_spent
   Value: {{customer.metafields.lifetime_value.total_spent.value | default: 0 | plus: order.totalPriceSet.shopMoney.amount}}
   ```
6. Activate workflow

## Step 7: Test Installation

1. Create a test customer account
2. Manually set their lifetime_value.total_spent metafield to 2000
3. Log in as that customer
4. Add $600 worth of products to cart
5. Verify that LIFETIME_10 discount is automatically applied
6. Add more items to reach $1500 cart value
7. Verify discount updates to LIFETIME_12

## Step 8: Production Deployment

1. Deploy app to production hosting
2. Update environment variables
3. Update script tag URL
4. Test all discount tiers
5. Monitor performance

## Troubleshooting

### Discount not applying
- Check browser console for errors
- Verify customer is logged in
- Check metafield value exists
- Ensure discount codes are active

### Cart monitor not working
- Verify script is loaded (Network tab)
- Check CORS settings
- Ensure API endpoint is accessible

### Flow not updating lifetime value
- Check workflow is active
- Verify order status is "paid"
- Check Flow run history for errors

## Security Considerations

1. **API Endpoint Security**:
   - Implement rate limiting
   - Validate customer session
   - Use CORS properly

2. **Script Tag Security**:
   - Serve over HTTPS only
   - Add integrity checks
   - Minimize exposed data

3. **Discount Code Security**:
   - Use unpredictable codes
   - Monitor for abuse
   - Set usage limits

## Performance Optimization

1. **Cart Monitor**:
   - Debounce API calls
   - Cache customer data
   - Use local storage for state

2. **Backend**:
   - Cache metafield queries
   - Batch discount updates
   - Use GraphQL for efficiency

## Monitoring

Set up monitoring for:
- Cart monitor errors (Sentry/Bugsnag)
- API response times
- Discount application rates
- Customer satisfaction

## Support

For issues or questions:
1. Check the [Edge Cases documentation](./EDGE_CASES.md)
2. Review error logs
3. Contact support@your-app.com