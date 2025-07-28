#!/bin/bash

# Shopify Lifetime Value Discounts - Development Setup Script

set -e  # Exit on error

echo "🚀 Setting up Shopify Lifetime Value Discounts for development..."

# Check for required tools
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Prerequisites checked"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set up environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env with your Shopify app credentials"
else
    echo "✅ .env file exists"
fi

# Set up database
echo "🗄️  Setting up database..."
npx prisma generate
npx prisma migrate dev --name init

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p tmp

# Generate session secret if not set
if grep -q "SESSION_SECRET=your_session_secret_key_here" .env; then
    echo "🔐 Generating session secret..."
    SESSION_SECRET=$(openssl rand -hex 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/SESSION_SECRET=your_session_secret_key_here/SESSION_SECRET=$SESSION_SECRET/" .env
    else
        # Linux
        sed -i "s/SESSION_SECRET=your_session_secret_key_here/SESSION_SECRET=$SESSION_SECRET/" .env
    fi
    echo "✅ Session secret generated"
fi

# Check for ngrok
if command -v ngrok >/dev/null 2>&1; then
    echo "✅ ngrok is installed"
else
    echo "⚠️  ngrok is not installed. Install it for local development:"
    echo "   npm install -g ngrok"
    echo "   or download from https://ngrok.com"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your Shopify app credentials"
echo "2. Start ngrok: ngrok http 3000"
echo "3. Update SHOPIFY_APP_URL in .env with your ngrok URL"
echo "4. Run: npm run dev"
echo ""
echo "For detailed instructions, see SETUP.md"