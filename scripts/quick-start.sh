#!/bin/bash

# Quick start script for Shopify Lifetime Value Discounts

cat << "EOF"
 _     _  __     _   _                ____  _                           _       
| |   (_)/ _|___| |_(_)_ __ ___   ___  |  _ \(_)___  ___ ___  _   _ _ __ | |_ ___ 
| |   | | |_ / _ \ __| | '_ ` _ \ / _ \ | | | | / __|/ __/ _ \| | | | '_ \| __/ __|
| |___| |  _|  __/ |_| | | | | | |  __/ | |_| | \__ \ (_| (_) | |_| | | | | |_\__ \
|_____|_|_|  \___|\__|_|_| |_| |_|\___| |____/|_|___/\___\___/ \__,_|_| |_|\__|___/

EOF

echo "Welcome to Shopify Lifetime Value Discounts! 🛍️"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Let's create one..."
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo ""
    echo "📝 Please edit .env and add your Shopify app credentials:"
    echo "   - SHOPIFY_API_KEY"
    echo "   - SHOPIFY_API_SECRET"
    echo "   - DEV_STORE_DOMAIN"
    echo ""
    echo "Then run this script again!"
    exit 0
fi

# Check if credentials are set
if grep -q "your_shopify_api_key" .env; then
    echo "⚠️  Please update your Shopify credentials in .env file first!"
    echo "   Edit .env and replace the placeholder values."
    exit 1
fi

echo "🔍 Checking setup..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate Prisma client
echo "🗄️  Setting up database..."
npx prisma generate
npx prisma migrate dev --name init 2>/dev/null || echo "✅ Database already migrated"

# Instructions
echo ""
echo "✅ Setup complete! Here's how to start developing:"
echo ""
echo "1️⃣  Start ngrok tunnel (in a new terminal):"
echo "    ngrok http 3000"
echo ""
echo "2️⃣  Copy the HTTPS URL and update SHOPIFY_APP_URL in .env"
echo ""
echo "3️⃣  Start the development server:"
echo "    npm run dev"
echo ""
echo "4️⃣  Install the app on your development store"
echo ""
echo "📚 For detailed instructions, see SETUP.md"
echo ""
echo "🧪 To create test data, run: npm run test:data"
echo ""