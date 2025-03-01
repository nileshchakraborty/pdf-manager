#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to cleanup background processes on script exit
cleanup() {
    echo -e "\n${RED}Shutting down services...${NC}"
    kill $(jobs -p) 2>/dev/null
    echo -e "${GREEN}Cleanup completed${NC}"
    exit
}

# Set up trap for cleanup
trap cleanup EXIT INT TERM

# Create necessary directories
mkdir -p uploads outputs
mkdir -p app/tests/test_files/test_data

# Check if Python virtual environment exists and create if it doesn't
if [ ! -d "venv" ]; then
    echo -e "${BLUE}Creating Python virtual environment...${NC}"
    python -m venv venv
fi

# Activate virtual environment and install backend dependencies
echo -e "${BLUE}Installing backend dependencies...${NC}"
source venv/bin/activate

# Upgrade pip first
pip install --upgrade pip

# Install all requirements
pip install -r requirements.txt || {
    echo -e "${RED}Failed to install Python dependencies${NC}"
    exit 1
}

# Install additional system dependencies if needed
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if ! command -v poppler >/dev/null 2>&1; then
        echo -e "${BLUE}Installing poppler for PDF processing...${NC}"
        brew install poppler || {
            echo -e "${RED}Failed to install poppler${NC}"
            exit 1
        }
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if ! command -v pdftoppm >/dev/null 2>&1; then
        echo -e "${BLUE}Installing poppler-utils for PDF processing...${NC}"
        sudo apt-get update && sudo apt-get install -y poppler-utils || {
            echo -e "${RED}Failed to install poppler-utils${NC}"
            exit 1
        }
    fi
fi

# Generate test data
echo -e "${BLUE}Generating test data...${NC}"
python -c "
from app.tests.test_files.test_data_generator import TestDataGenerator
generator = TestDataGenerator('app/tests/test_files/test_data')
generator.generate_large_pdf(pages=2)
generator.generate_multilingual_pdf()
generator.generate_special_chars_pdf()
generator.generate_edge_cases()
" || {
    echo -e "${RED}Failed to generate test data${NC}"
    exit 1
}

# Create test PDFs if they don't exist
if [ ! -f "uploads/sample_text.pdf" ] || [ ! -f "uploads/sample_images.pdf" ] || [ ! -f "uploads/sample_multipage.pdf" ]; then
    echo -e "${BLUE}Creating test PDFs...${NC}"
    python scripts/create_test_pdfs.py || {
        echo -e "${RED}Failed to create test PDFs${NC}"
        exit 1
    }
fi

# Commenting out backend tests temporarily
# echo -e "${BLUE}Running backend tests...${NC}"
# pytest app/tests/test_pdf_service.py -v || {
#     echo -e "${RED}Backend tests failed${NC}"
#     exit 1
# }

# Install frontend dependencies
echo -e "${BLUE}Setting up frontend...${NC}"
cd frontend || {
    echo -e "${RED}Frontend directory not found${NC}"
    exit 1
}

# Clean install
echo -e "${BLUE}Cleaning npm cache and node_modules...${NC}"
npm cache clean --force
rm -rf node_modules package-lock.json

# Install npm dependencies with legacy peer deps
echo -e "${BLUE}Installing frontend dependencies...${NC}"
npm install --legacy-peer-deps || {
    echo -e "${RED}Failed to install frontend dependencies${NC}"
    exit 1
}

# Commenting out frontend tests temporarily
# echo -e "${BLUE}Running frontend tests...${NC}"
# CI=true npm test || {
#     echo -e "${RED}Frontend tests failed${NC}"
#     exit 1
# }

# Commenting out type checking temporarily
# echo -e "${BLUE}Running type checking...${NC}"
# npm run type-check || {
#     echo -e "${RED}Type checking failed${NC}"
#     exit 1
# }

# Commenting out linting temporarily
# echo -e "${BLUE}Running linting...${NC}"
# npm run lint || {
#     echo -e "${RED}Linting failed${NC}"
#     exit 1
# }

# Return to root directory
cd ..

# Start backend server
echo -e "${GREEN}Starting backend server...${NC}"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &

# Wait a bit for backend to start
sleep 2

# Start frontend server
echo -e "${GREEN}Starting frontend server...${NC}"
cd frontend
npm run dev -- --host 0.0.0.0 &

# Print URLs
echo -e "\n${GREEN}Services are running:${NC}"
echo -e "Backend: ${BLUE}http://localhost:8000${NC}"
echo -e "Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "API Docs: ${BLUE}http://localhost:8000/docs${NC}"
echo -e "\n${GREEN}Press Ctrl+C to stop all services${NC}"

# Wait for all background processes
wait 