# Development Server Setup Guide

This guide explains how to run the Shopify Lifetime Value Discounts app development server.

## Quick Start

Run the development server with a single command:

```bash
npm run dev:server
```

This command will:
1. Check all prerequisites
2. Install dependencies if needed
3. Set up the database
4. Start the Shopify development server with automatic tunneling

## What Happens During Setup

When you run `npm run dev:server` for the first time:

1. **Shopify CLI Login**: You'll be prompted to log into your Partner account
2. **Organization Selection**: Choose your Partner organization
3. **Store Selection**: Select or create a development store
4. **App Creation**: Shopify CLI creates/links the app in your Partner Dashboard
5. **Tunnel Creation**: A secure HTTPS tunnel is created to your local machine
6. **Server Start**: The Remix development server starts on port 3000
7. **Browser Launch**: Your app opens in the default browser

## Configuration Details

### shopify.app.toml
The main configuration file contains comments explaining where to find each value:
- **client_id**: Found in Partner Dashboard > Apps > [Your App] > Overview
- **[HOST] placeholders**: Automatically replaced by Shopify CLI for local development
- **dev_store_url**: Set this to skip store selection prompts

### Environment Variables
For local development, Shopify CLI automatically provides:
- `SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`
- `SHOPIFY_APP_URL` (tunnel URL)
- `SCOPES`
- `PORT`

### Manual Setup (Alternative)

If you prefer to run commands manually:

```bash
# 1. Install dependencies
npm install

# 2. Set up database
npm run db:migrate

# 3. Start dev server
npm run dev
```

## Troubleshooting

### Common Issues

1. **"Shopify CLI is not installed"**
   ```bash
   npm install -g @shopify/cli
   ```

2. **"Not logged in to Shopify"**
   ```bash
   shopify auth login
   ```

3. **"No app configuration found"**
   ```bash
   shopify app config link
   ```

4. **Port 3000 is already in use**
   - Kill the process using port 3000, or
   - Change the port in your environment

### Getting Help

- Run `shopify app dev --help` for CLI options
- Check the [Shopify CLI documentation](https://shopify.dev/docs/api/shopify-cli)
- Review the main README.md for app-specific details

## Next Steps

After the dev server is running:
1. Install the app on your development store
2. Test the lifetime value discount functionality
3. Use `npm run test:data` to create test customers/orders
4. Monitor the console for API calls and debugging info