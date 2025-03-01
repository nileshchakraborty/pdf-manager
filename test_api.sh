#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create outputs directory if it doesn't exist
mkdir -p outputs

# Get current timestamp
TIMESTAMP=$(date "+%Y%m%d_%H%M%S")

echo "Starting API tests..."

# Get auth token
echo -e "\n${GREEN}Getting authentication token...${NC}"
TOKEN_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test&password=test")

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to get token${NC}"
    exit 1
fi

echo -e "${GREEN}Successfully got token${NC}"

# Test PDF View
echo -e "\n${GREEN}Testing PDF View endpoint...${NC}"
curl -X GET "http://localhost:8000/api/pdf/view" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@uploads/test1.pdf" \
  --output "outputs/viewed_test_${TIMESTAMP}.pdf"

# Test PDF Compression
echo -e "\n${GREEN}Testing PDF Compression endpoint...${NC}"
curl -X POST "http://localhost:8000/api/pdf/compress" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@uploads/test1.pdf" \
  -F "compression_level=5" \
  --output "outputs/compressed_test_${TIMESTAMP}.pdf"

# Test PDF Merge (requires two PDFs)
echo -e "\n${GREEN}Testing PDF Merge endpoint...${NC}"
curl -X POST "http://localhost:8000/api/pdf/merge" \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@uploads/test1.pdf" \
  -F "files=@uploads/test2.pdf" \
  -F "merge_order=[0,1]" \
  --output "outputs/merged_test_${TIMESTAMP}.pdf"

# Test PDF Export
echo -e "\n${GREEN}Testing PDF Export endpoint...${NC}"
curl -X POST "http://localhost:8000/api/pdf/export" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@uploads/test1.pdf" \
  -F "export_format=jpg" \
  --output "outputs/exported_test_${TIMESTAMP}.jpg"

echo -e "\n${GREEN}Tests completed. Check the output files in outputs directory:${NC}"
echo "- viewed_test_${TIMESTAMP}.pdf"
echo "- compressed_test_${TIMESTAMP}.pdf"
echo "- merged_test_${TIMESTAMP}.pdf"
echo "- exported_test_${TIMESTAMP}.jpg" 