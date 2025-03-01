#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create uploads directory if it doesn't exist
mkdir -p uploads

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo -e "${BLUE}Activating virtual environment...${NC}"
    source venv/bin/activate
fi

# Install required packages if not already installed
echo -e "${BLUE}Checking and installing required packages...${NC}"
pip install reportlab

# Generate the PDFs
echo -e "${GREEN}Generating test PDFs...${NC}"
python scripts/create_test_pdfs.py

# Check if PDFs were created successfully
if [ -f "uploads/sample_text.pdf" ] && [ -f "uploads/sample_images.pdf" ] && [ -f "uploads/sample_multipage.pdf" ]; then
    echo -e "${GREEN}PDFs generated successfully!${NC}"
    echo -e "Files created:"
    ls -lh uploads/*.pdf
else
    echo -e "${RED}Error: Some PDFs were not created${NC}"
    exit 1
fi 