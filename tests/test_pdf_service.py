import pytest
from fastapi import UploadFile
from unittest.mock import Mock, AsyncMock, patch
import io

from app.services.pdf_service import PDFService
from app.services.plagiarism_service import PlagiarismService
from app.models.plagiarism import PlagiarismResult, PlagiarismMatch

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
async def test_check_plagiarism(pdf_service, mock_file):
    """Test plagiarism check functionality."""
    result = await pdf_service.check_plagiarism(mock_file)
    assert isinstance(result, dict)  # PlagiarismResult is a TypedDict
    assert isinstance(result["plagiarized"], bool)
    assert isinstance(result["matches"], list)
    assert isinstance(result["error"], (str, type(None)))

@pytest.mark.asyncio
async def test_compress_pdf(pdf_service, mock_file):
    """Test PDF compression."""
    result = await pdf_service.compress(mock_file)
    assert isinstance(result, bytes)
    assert len(result) > 0

@pytest.mark.asyncio
async def test_merge_pdfs(pdf_service):
    """Test PDF merging."""
    # Create two mock files with valid PDF content
    files = []
    for _ in range(2):
        file = Mock(spec=UploadFile)
        file.filename = "test.pdf"
        file.read = AsyncMock(return_value=VALID_PDF_CONTENT)
        file.seek = AsyncMock()
        files.append(file)
    
    result = await pdf_service.merge(files)
    assert isinstance(result, bytes)
    assert len(result) > 0

@pytest.mark.asyncio
async def test_view_pdf(pdf_service, mock_file):
    """Test PDF viewing."""
    result = await pdf_service.view(mock_file)
    assert isinstance(result, bytes)
    assert len(result) > 0

@pytest.mark.asyncio
async def test_export_pdf(pdf_service, mock_file):
    """Test PDF export."""
    result = await pdf_service.export(mock_file, "txt")
    assert isinstance(result, bytes)
    assert len(result) > 0 