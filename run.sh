#!/bin/bash

# Kill any existing processes on ports 8000 and 3000
kill_ports() {
    echo "Checking for existing processes..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    lsof -ti:3000 | xargs kill -9 2>/dev/null
}

# Function to handle script exit
cleanup() {
    echo "Shutting down servers..."
    kill_ports
    exit 0
}

# Set up trap to catch script termination
trap cleanup SIGINT SIGTERM

# Kill any existing processes
kill_ports

# Start backend server
echo "Starting backend server..."
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 2

# Start frontend server
echo "Starting frontend server..."
cd frontend
npm run build
npm install -g serve
serve -s build &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID 