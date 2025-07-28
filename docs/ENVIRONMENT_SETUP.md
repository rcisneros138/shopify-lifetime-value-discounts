# Environment Configuration Guide

This guide explains how to properly configure environment variables for the Shopify Lifetime Value Discounts app across different environments.

## Overview

The app uses environment variables to manage configuration across different environments (local development, staging, production). This approach keeps sensitive data secure and allows for easy deployment to different environments.

## Environment Files

### Development Setup

1. **`.env`** - Your local development environment file (never committed)
   - Copy from `.env.example`
   - Contains your development credentials and ngrok URL
   - Listed in `.gitignore` to prevent accidental commits

2. **`.env.example`** - Template for development (committed)
   - Contains all required variables with placeholder values
   - Serves as documentation for new developers
   - Safe to commit as it contains no real credentials

### Production Setup

1. **`.env.production.example`** - Template for production deployment (committed)
   - Contains production-specific configuration examples
   - Includes additional security and monitoring options
   - Use as reference when deploying to production

## Key Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SHOPIFY_API_KEY` | Your app's API key from Partner Dashboard | `3dafe45c087f97c9fe55d2f415d91d74` |
| `SHOPIFY_API_SECRET` | Your app's API secret (keep secure!) | `shpss_1234567890abcdef` |
| `SHOPIFY_APP_URL` | Public URL where your app is hosted | `https://abc123.ngrok.io` |
| `SCOPES` | Shopify API permissions required | `read_customers,write_customers...` |
| `DATABASE_URL` | Database connection string | `file:./dev.db` or `postgresql://...` |
| `SESSION_SECRET` | Secret for session encryption (32+ chars) | `generate_random_string_here` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node environment (`development`/`production`) | `development` |
| `APP_ENV` | Custom environment identifier | `local` |
| `PORT` | Server port | `3000` |
| `HOST` | Server host | `localhost` |
| `DEV_STORE_DOMAIN` | Your test store domain | - |

## Environment-Specific Configuration

### Local Development

```bash
# Copy the example file
cp .env.example .env

# Edit with your credentials
nano .env
```

Example `.env` for local development:
```env
SHOPIFY_API_KEY=your_actual_api_key
SHOPIFY_API_SECRET=your_actual_api_secret
SHOPIFY_APP_URL=https://abc123.ngrok.io
DATABASE_URL="file:./dev.db"
SESSION_SECRET=dev_secret_at_least_32_characters_long
NODE_ENV=development
APP_ENV=local
```

### Staging Environment

Use production settings but with staging-specific values:
```env
NODE_ENV=production  # Use production optimizations
APP_ENV=staging      # Identify as staging
SHOPIFY_APP_URL=https://staging.yourapp.com
DATABASE_URL=postgresql://staging_connection_string
```

### Production Environment

```bash
# Use production example as reference
cp .env.production.example .env

# Set via your hosting provider's UI or CLI
heroku config:set SHOPIFY_API_KEY=your_key
# or
fly secrets set SHOPIFY_API_KEY=your_key
```

## Best Practices

### 1. Security

- **Never commit `.env` files** containing real credentials
- Use strong, unique values for `SESSION_SECRET`
- Store production secrets in your hosting provider's secret management
- Rotate secrets periodically

### 2. Multiple Environments

For managing multiple Shopify app configurations:

```bash
# Create a new app configuration for staging
shopify app config link

# Select "Create new app" when prompted
# Name it appropriately (e.g., "staging", "production")
```

This creates separate entries in your Partner Dashboard, allowing different webhook URLs and configurations per environment.

### 3. Environment Variable Priority

Variables are loaded in this order (later overrides earlier):
1. System environment variables
2. `.env` file
3. Command-line environment variables

Example:
```bash
# Override PORT for one run
PORT=4000 npm run dev
```

### 4. Validation

Always validate required environment variables on startup:

```javascript
// In your app initialization
const requiredEnvVars = [
  'SHOPIFY_API_KEY',
  'SHOPIFY_API_SECRET',
  'SHOPIFY_APP_URL',
  'DATABASE_URL',
  'SESSION_SECRET'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

## Deployment Checklist

Before deploying to production:

- [ ] All required environment variables are set
- [ ] `NODE_ENV` is set to `production`
- [ ] Database URL points to production database
- [ ] `SESSION_SECRET` is strong and unique
- [ ] App URL matches your hosting provider
- [ ] Webhook URLs in Partner Dashboard are updated
- [ ] App proxy URL is configured correctly

## Troubleshooting

### Common Issues

1. **"Missing API Key" errors**
   - Ensure `SHOPIFY_API_KEY` is set correctly
   - Check for typos or extra spaces

2. **OAuth redirect failures**
   - Verify `SHOPIFY_APP_URL` matches your actual URL
   - Update redirect URLs in Partner Dashboard

3. **Database connection errors**
   - Check `DATABASE_URL` format
   - Ensure database server is accessible

4. **Session errors**
   - Verify `SESSION_SECRET` is at least 32 characters
   - Check it's the same across all app instances

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=shopify:*
LOG_LEVEL=debug
```

## Additional Resources

- [Shopify App Development](https://shopify.dev/docs/apps)
- [Node.js Environment Variables](https://nodejs.org/dist/latest-v18.x/docs/api/process.html#processenv)
- [Twelve-Factor App Config](https://12factor.net/config)