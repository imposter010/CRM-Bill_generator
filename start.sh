#!/bin/bash
# start.sh - Launch NA NATURAL AIR CONDITION® Bill Generator

echo "=========================================================="
echo "      NA NATURAL AIR CONDITION® Bill Generator            "
echo "=========================================================="
echo ""

# Find PHP executable
if command -v php &> /dev/null; then
    PHP_BIN="php"
elif [ -f "/usr/local/bin/php" ]; then
    PHP_BIN="/usr/local/bin/php"
elif [ -f "/opt/homebrew/bin/php" ]; then
    PHP_BIN="/opt/homebrew/bin/php"
else
    echo "❌ Error: PHP is not installed or not in PATH."
    echo "Please install PHP (e.g. via Homebrew: brew install php) to run."
    exit 1
fi

# Starting PHP Built-in Server
PORT=8000
URL="http://127.0.0.1:$PORT"

echo "⚡ Starting web server on $URL..."
$PHP_BIN -S 127.0.0.1:$PORT &
SERVER_PID=$!

# Let the server spin up for 1 second
sleep 1

# Open web page in default browser
echo "🖥️  Opening dashboard in your browser..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$URL"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "$URL"
else
    start "$URL"
fi

echo ""
echo "👉 Server is running. Press [Ctrl + C] to stop."
echo "=========================================================="

# Trap Ctrl+C (SIGINT) to terminate background PHP process cleanly
cleanup() {
    echo ""
    echo "⏹️  Stopping local web server..."
    kill $SERVER_PID
    exit 0
}
trap cleanup SIGINT

# Keep script running to listen for Ctrl+C
wait $SERVER_PID
