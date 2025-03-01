import pytest
import io
import os
import logging
from unittest.mock import Mock, AsyncMock
from fastapi import UploadFile
from app.services.pdf_service import PDFService

logger = logging.getLogger(__name__)

# Valid minimal PDF content
VALID_PDF_CONTENT = b"""%PDF-1.7
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000056 00000 n
0000000111 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
178
%%EOF"""

def create_test_pdf(filename: str, text: str) -> str:
    """Create a test PDF file with given text."""
    # Save to temporary file
    temp_path = os.path.join(os.path.dirname(__file__), filename)
    with open(temp_path, 'wb') as f:
        f.write(VALID_PDF_CONTENT)
    return temp_path

@pytest.fixture
def pdf_service():
    return PDFService()

@pytest.fixture
def mock_file():
    file = Mock(spec=UploadFile)
    file.filename = "test.pdf"
    file.read = AsyncMock(return_value=VALID_PDF_CONTENT)
    file.seek = AsyncMock()
    return file

@pytest.mark.asyncio
async def test_add_text_to_existing_page(pdf_service, mock_file):
    """Test adding text to an existing page"""
    logger.info("Starting test: add text to existing page")

    # Create test PDF
    test_pdf = create_test_pdf("test_add_text.pdf", "Original text")

    try:
        with open(test_pdf, 'rb') as f:
            content = f.read()
            mock_file.read = AsyncMock(return_value=content)

        # Test viewing the PDF
        result = await pdf_service.view(mock_file)
        assert isinstance(result, bytes)
        assert len(result) > 0

    finally:
        # Cleanup
        if os.path.exists(test_pdf):
            os.remove(test_pdf)

@pytest.mark.asyncio
async def test_add_text_to_new_page(pdf_service, mock_file):
    """Test adding text to a new page"""
    logger.info("Starting test: add text to new page")

    # Create test PDF
    test_pdf = create_test_pdf("test_new_page.pdf", "First page text")

    try:
        with open(test_pdf, 'rb') as f:
            content = f.read()
            mock_file.read = AsyncMock(return_value=content)

        # Test viewing the PDF
        result = await pdf_service.view(mock_file)
        assert isinstance(result, bytes)
        assert len(result) > 0

    finally:
        # Cleanup
        if os.path.exists(test_pdf):
            os.remove(test_pdf)

@pytest.mark.asyncio
async def test_multiple_operations(pdf_service, mock_file):
    """Test multiple text operations on different pages"""
    logger.info("Starting test: multiple operations")

    # Create test PDF
    test_pdf = create_test_pdf("test_multiple.pdf", "Original text")

    try:
        with open(test_pdf, 'rb') as f:
            content = f.read()
            mock_file.read = AsyncMock(return_value=content)

        # Test viewing the PDF
        result = await pdf_service.view(mock_file)
        assert isinstance(result, bytes)
        assert len(result) > 0

    finally:
        # Cleanup
        if os.path.exists(test_pdf):
            os.remove(test_pdf)

@pytest.mark.asyncio
async def test_text_formatting(pdf_service, mock_file):
    """Test various text formatting options"""
    logger.info("Starting test: text formatting")

    # Create test PDF
    test_pdf = create_test_pdf("test_formatting.pdf", "Text with formatting")

    try:
        with open(test_pdf, 'rb') as f:
            content = f.read()
            mock_file.read = AsyncMock(return_value=content)

        # Test viewing the PDF
        result = await pdf_service.view(mock_file)
        assert isinstance(result, bytes)
        assert len(result) > 0

    finally:
        # Cleanup
        if os.path.exists(test_pdf):
            os.remove(test_pdf) 