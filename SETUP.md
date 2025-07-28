# Shopify Lifetime Value Discounts - Setup Guide

This guide will help you set up the Shopify Lifetime Value Discounts app for both local development and production deployment.

## Prerequisites

- Node.js 18+ and npm installed
- Shopify Partner account
- Shopify development store for testing
- ngrok or Cloudflare Tunnel for local development

## Quick Start

### 1. Clone and Install Dependencies

```bash
git clone [your-repo-url]
cd shopify-lifetime-value-discounts
npm install
```

### 2. Create a Shopify App

1. Log in to your [Shopify Partner Dashboard](https://partners.shopify.com)
2. Click "Apps" → "Create app"
3. Choose "Create app manually"
4. Fill in:
   - App name: "Lifetime Value Discounts"
   - App URL: `https://your-tunnel-url.ngrok.io` (for development)
   - Allowed redirection URL(s): 
     - `https://your-tunnel-url.ngrok.io/auth/callback`
     - `https://your-tunnel-url.ngrok.io/auth/shopify/callback`
     - `https://your-tunnel-url.ngrok.io/api/auth/callback`
5. Save the app and copy your Client ID (API key)

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your app credentials:
   ```env
   SHOPIFY_API_KEY=your_api_key_from_partner_dashboard
   SHOPIFY_API_SECRET=your_api_secret_from_partner_dashboard
   SHOPIFY_APP_URL=https://your-tunnel-url.ngrok.io
   DATABASE_URL="file:./dev.db"
   SESSION_SECRET=generate_a_random_32_character_string
   DEV_STORE_DOMAIN=your-dev-store.myshopify.com
   ```

3. Update `shopify.app.toml` with your Client ID:
   ```toml
   client_id = "your_client_id_from_partner_dashboard"
   ```

📚 **For detailed environment configuration guide, see [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md)**

### 4. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

### 5. Configure App Proxy (Important!)

In your Shopify Partner Dashboard:

1. Go to your app's configuration
2. Navigate to "App setup" → "App proxy"
3. Configure:
   - Subpath prefix: `apps`
   - Subpath: `lifetime-discounts`
   - Proxy URL: `https://your-tunnel-url.ngrok.io/apps/lifetime-discounts`

This enables the cart monitor to communicate with your app.

### 6. Start Development Server

```bash
# Start ngrok tunnel (in a separate terminal)
ngrok http 3000

# Update SHOPIFY_APP_URL in .env with your ngrok URL

# Start the app
npm run dev
```

## Local Development Setup

### Using ngrok

1. Install ngrok:
   ```bash
   npm install -g ngrok
   # or download from https://ngrok.com
   ```

2. Start ngrok tunnel:
   ```bash
   ngrok http 3000
   ```

3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

4. Update your `.env` file and Shopify app settings with this URL

### Using Cloudflare Tunnel

1. Install cloudflared:
   ```bash
   brew install cloudflare/cloudflare/cloudflared
   ```

2. Run tunnel:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

3. Use the provided URL for your app configuration

## Installing the App

### 1. Install on Development Store

```bash
# The dev command will provide an installation URL
npm run dev

# Or manually construct:
# https://your-dev-store.myshopify.com/admin/oauth/install?client_id=YOUR_API_KEY
```

### 2. Run Initial Setup

After installation:
1. Navigate to your app in the Shopify admin
2. Go to "Lifetime Discounts Setup"
3. Click "Run Setup" to create:
   - Customer metafield definitions
   - Automatic discount codes

### 3. Install Cart Monitor Script

Add to your theme's `theme.liquid` file before `</head>`:

```liquid
{% if customer %}
  <script src="{{ 'cart-monitor.js' | asset_url }}" defer></script>
{% endif %}
```

Or use Script Tag API (automatically done if configured).

### 4. Configure Shopify Flow

1. In Shopify admin, go to "Flow"
2. Create new workflow:
   - **Trigger**: Order paid
   - **Action**: Update customer metafield
   - **Metafield**: `lifetime_value.total_spent`
   - **Value**: Previous value + order total

## Production Deployment

### Deployment Options

#### 1. Heroku

```bash
# Install Heroku CLI
# Create app
heroku create your-app-name

# Set environment variables
heroku config:set SHOPIFY_API_KEY=your_key
heroku config:set SHOPIFY_API_SECRET=your_secret
heroku config:set SHOPIFY_APP_URL=https://your-app-name.herokuapp.com

# Deploy
git push heroku main
```

#### 2. Fly.io

1. Install Fly CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Create `fly.toml`:
   ```toml
   app = "lifetime-discounts"
   primary_region = "iad"

   [build]
     builder = "heroku/builder:22"

   [env]
     PORT = "8080"

   [[services]]
     http_checks = []
     internal_port = 8080
     protocol = "tcp"
     script_checks = []

     [[services.ports]]
       force_https = true
       handlers = ["http"]
       port = 80

     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443
   ```

3. Deploy:
   ```bash
   fly launch
   fly secrets set SHOPIFY_API_KEY=your_key
   fly deploy
   ```

#### 3. Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Update Shopify App Settings

1. Update App URL in Partner Dashboard
2. Update Allowed redirection URLs
3. Update App Proxy URL
4. Update webhook URLs if using custom domain

## Testing

### 1. Create Test Data

```bash
# Create test customers with different lifetime values
npm run seed:customers
```

### 2. Test Discount Tiers

1. Log in as test customer
2. Add items to cart
3. Verify discount auto-applies at thresholds:
   - $2,500 → 10% off
   - $3,500 → 12% off
   - $5,000 → 15% off
   - $20,000 → 20% off

### 3. Monitor Logs

```bash
# Development
npm run dev

# Production (Heroku)
heroku logs --tail

# Production (Fly.io)
fly logs
```

## Troubleshooting

### Common Issues

#### App Proxy Not Working
- Ensure proxy is configured in Partner Dashboard
- Check URL matches exactly
- Verify CORS headers in response

#### Discounts Not Applying
- Check discount codes exist in Shopify admin
- Verify customer is logged in
- Check browser console for errors
- Ensure metafield is set correctly

#### Database Issues
```bash
# Reset database
rm prisma/dev.db
npx prisma migrate dev
```

#### Authentication Errors
- Verify API credentials are correct
- Check redirect URLs match configuration
- Ensure scopes are correct

### Debug Mode

Enable debug logging:

1. In `cart-monitor.js`, set:
   ```javascript
   const DEBUG = true;
   ```

2. Check browser console for detailed logs

3. Server logs:
   ```bash
   DEBUG=* npm run dev
   ```

## Security Checklist

- [ ] Environment variables are not committed
- [ ] Session secret is randomly generated
- [ ] Database is properly secured
- [ ] Rate limiting is enabled
- [ ] Input validation is working
- [ ] HTTPS is enforced in production

## Next Steps

1. Customize discount tiers in `app/routes/apps.lifetime-discounts.api.calculate.tsx`
2. Modify UI in `app/routes/apps.lifetime-discounts.setup.tsx`
3. Enhance cart monitor features in `public/cart-monitor.js`
4. Add analytics tracking
5. Implement A/B testing for thresholds

## Support

For issues or questions:
1. Check the [troubleshooting guide](docs/TROUBLESHOOTING.md)
2. Review [edge cases documentation](docs/EDGE_CASES.md)
3. Open an issue on GitHub
4. Contact support at [your-email@example.com]

---

Happy selling! 🛍️