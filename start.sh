#!/bin/bash
# start.sh - Launch NA NATURAL AIR CONDITION® CRM Bill Generator (React Native / Expo)

echo "=========================================================="
echo "    NA NATURAL AIR CONDITION® CRM Bill Generator          "
echo "              React Native & Expo App                     "
echo "=========================================================="
echo ""

# Find Node executable
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH."
    echo "Please install Node.js (https://nodejs.org/) to run."
    exit 1
fi

echo "⚡ Starting React Native / Expo application..."
echo "📱 Run 'npm run android' or 'npm run ios' for native mobile devices."
echo "🌐 Starting web client..."
echo ""

npx expo start --web
