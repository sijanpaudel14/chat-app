#!/bin/bash

# Start the chat application

echo "🚀 Starting AI Chat Application..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Start FastAPI backend in background
echo "🐍 Starting FastAPI backend..."
python api_server.py &
BACKEND_PID=$!

# Change to Next.js directory
cd chatapp

# Install Node.js dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Start Next.js frontend
echo "⚛️ Starting Next.js frontend..."
npm run dev &
FRONTEND_PID=$!

echo "✅ Application started!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for Ctrl+C
trap "echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait