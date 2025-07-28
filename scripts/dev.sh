#!/bin/bash

# Shopify App Development Server Script
# This script sets up and runs the Shopify app development server

echo "🚀 Starting Shopify Lifetime Value Discounts App Development Server..."
echo ""

# Check if Shopify CLI is installed
if ! command -v shopify &> /dev/null; then
    echo "❌ Shopify CLI is not installed!"
    echo "Please install it by running: npm install -g @shopify/cli"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if database exists
if [ ! -f "prisma/dev.db" ]; then
    echo "🗄️ Setting up database..."
    npm run db:migrate
    echo ""
fi

# Check for required configuration
if [ -z "$SHOPIFY_API_KEY" ] && [ ! -f ".env" ] && [ ! -f ".env.development" ]; then
    echo "⚠️  No environment variables found."
    echo "Shopify CLI will handle this automatically during setup."
    echo ""
fi

echo "📋 Pre-flight checklist:"
echo "✅ Shopify CLI installed"
echo "✅ Dependencies installed"
echo "✅ Database ready"
echo ""

echo "🔧 Configuration notes:"
echo "- The app will use the settings in shopify.app.toml"
echo "- Shopify CLI will automatically create a tunnel URL for local development"
echo "- You'll be prompted to select a Partner organization and development store"
echo ""

echo "🌐 Starting development server..."
echo "This will:"
echo "1. Create a secure tunnel to your local machine"
echo "2. Update your app URLs automatically"
echo "3. Start the Remix development server"
echo "4. Open your app in the browser"
echo ""

# Run the Shopify development server
shopify app dev

# If the command fails, provide helpful information
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Something went wrong!"
    echo ""
    echo "Common issues:"
    echo "1. Not logged in: Run 'shopify auth login'"
    echo "2. No app linked: Run 'shopify app config link'"
    echo "3. Missing store: Set dev_store_url in shopify.app.toml"
    echo ""
    echo "For more help, run: shopify app dev --help"
fi