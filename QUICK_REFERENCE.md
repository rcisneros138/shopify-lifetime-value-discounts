# Quick Reference - Shopify Lifetime Value Discounts

## 🚀 Quick Start

```bash
# First time setup
./scripts/quick-start.sh

# Start development
npm run dev

# Start ngrok tunnel (separate terminal)
npm run tunnel
```

## 📋 Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run tunnel           # Start ngrok tunnel
npm run build            # Build for production
npm start                # Run production server

# Database
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database

# Testing
npm run test:data        # Create test data guide
npm run typecheck        # Check TypeScript
npm run lint             # Run ESLint

# Setup
npm run setup:dev        # Run development setup
```

## 🔧 Environment Variables

```env
# Required
SHOPIFY_API_KEY=         # From Partner Dashboard
SHOPIFY_API_SECRET=      # From Partner Dashboard
SHOPIFY_APP_URL=         # Your app URL (ngrok for dev)
DATABASE_URL=            # Default: "file:./dev.db"
SESSION_SECRET=          # 32+ character random string

# Optional
DEV_STORE_DOMAIN=        # Your test store
PORT=3000                # Server port
NODE_ENV=development     # Environment
```

## 📁 Key Files

- **API Endpoint**: `app/routes/apps.lifetime-discounts.api.calculate.tsx`
- **Setup UI**: `app/routes/apps.lifetime-discounts.setup.tsx`
- **Cart Monitor**: `public/cart-monitor.js`
- **Webhooks**: `app/routes/webhooks.*.tsx`
- **Config**: `shopify.app.toml`

## 🏷️ Discount Tiers

| Total Value | Discount | Code |
|-------------|----------|------|
| $2,500+ | 10% | LIFETIME_10 |
| $3,500+ | 12% | LIFETIME_12 |
| $5,000+ | 15% | LIFETIME_15 |
| $20,000+ | 20% | LIFETIME_20 |

## 🔗 Important URLs

- **App Proxy**: `/apps/lifetime-discounts/*`
- **API Endpoint**: `/apps/lifetime-discounts/api/calculate`
- **Setup Page**: `/apps/lifetime-discounts/setup`
- **Health Check**: `/apps/lifetime-discounts/health`

## 🛠️ Troubleshooting

### App proxy not working?
1. Check configuration in Partner Dashboard
2. Verify URL matches exactly
3. Ensure ngrok is running

### Discounts not applying?
1. Check customer is logged in
2. Verify discount codes exist
3. Check browser console
4. Confirm metafields are set

### Database issues?
```bash
npm run db:reset
```

### Authentication errors?
- Verify API credentials
- Check redirect URLs
- Ensure scopes match

## 📱 Testing Flow

1. Create test customers (see `npm run test:data`)
2. Set lifetime value metafields
3. Log in as customer
4. Add items to cart
5. Watch discount auto-apply

## 🚢 Deployment

```bash
# Build
npm run build

# Deploy to Heroku
git push heroku main

# Deploy to Fly.io
fly deploy

# Update env vars
heroku config:set KEY=value
fly secrets set KEY=value
```

## 📞 Support

- Setup Guide: `SETUP.md`
- Technical Docs: `claude.md`
- Edge Cases: `docs/EDGE_CASES.md`
- GitHub Issues: [your-repo/issues]

---
Happy coding! 🎉