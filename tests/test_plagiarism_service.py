import pytest
from app.services.plagiarism_service import PlagiarismService, KnownSource
from app.models.plagiarism import PlagiarismResult, PlagiarismMatch
from reportlab.pdfgen import canvas
import io
import os

@pytest.fixture
def plagiarism_service():
    return PlagiarismService()

@pytest.fixture
def test_pdf_file():
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer)
    c.drawString(100, 750, "This is a test document with some plagiarized content.")
    c.drawString(100, 700, "The quick brown fox jumps over the lazy dog.")
    c.save()
    buffer.seek(0)
    return buffer

@pytest.fixture
def known_sources():
    return [
        KnownSource(
            text="The quick brown fox jumps over the lazy dog.",
            source="Common English Pangram",
            line_number=1
        ),
        KnownSource(
            text="This is original content that should not match.",
            source="Original Source",
            line_number=1
        ),
    ]

def test_check_plagiarism_with_exact_match(plagiarism_service, test_pdf_file, known_sources):
    plagiarism_service.known_sources = known_sources
    result = plagiarism_service.check_plagiarism(test_pdf_file)
    
    assert isinstance(result, PlagiarismResult)
    assert result.plagiarized is True
    assert len(result.matches) > 0
    
    match = next(m for m in result.matches if m.similarity_score > 0.8)
    assert match.text == "The quick brown fox jumps over the lazy dog."
    assert match.source == "Common English Pangram"

def test_check_plagiarism_with_no_match(plagiarism_service):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer)
    c.drawString(100, 750, "This is completely original content.")
    c.save()
    buffer.seek(0)
    
    result = plagiarism_service.check_plagiarism(buffer)
    
    assert isinstance(result, PlagiarismResult)
    assert result.plagiarized is False
    assert len(result.matches) == 0

def test_check_plagiarism_with_partial_match(plagiarism_service, known_sources):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer)
    c.drawString(100, 750, "The quick brown fox is running.")
    c.save()
    buffer.seek(0)
    
    plagiarism_service.known_sources = known_sources
    result = plagiarism_service.check_plagiarism(buffer)
    
    assert isinstance(result, PlagiarismResult)
    assert len(result.matches) > 0
    match = result.matches[0]
    assert 0.3 <= match.similarity_score <= 0.7

def test_check_plagiarism_with_multiple_matches(plagiarism_service):
    sources = [
        KnownSource(
            text="First test sentence for plagiarism detection.",
            source="Source 1",
            line_number=1
        ),
        KnownSource(
            text="Second test sentence about machine learning.",
            source="Source 2",
            line_number=1
        ),
    ]
    plagiarism_service.known_sources = sources
    
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer)
    c.drawString(100, 750, "First test sentence for plagiarism checking.")
    c.drawString(100, 700, "Second test sentence about artificial intelligence.")
    c.save()
    buffer.seek(0)
    
    result = plagiarism_service.check_plagiarism(buffer)
    
    assert isinstance(result, PlagiarismResult)
    assert len(result.matches) >= 2
    assert all(isinstance(m, PlagiarismMatch) for m in result.matches)
    assert any(m.source == "Source 1" for m in result.matches)
    assert any(m.source == "Source 2" for m in result.matches)

def test_check_plagiarism_with_empty_pdf(plagiarism_service):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer)
    c.save()
    buffer.seek(0)
    
    result = plagiarism_service.check_plagiarism(buffer)
    
    assert isinstance(result, PlagiarismResult)
    assert result.plagiarized is False
    assert len(result.matches) == 0

def test_check_plagiarism_with_invalid_pdf():
    service = PlagiarismService()
    buffer = io.BytesIO(b"This is not a PDF file")
    
    with pytest.raises(Exception) as exc_info:
        service.check_plagiarism(buffer)
    assert "Invalid PDF file" in str(exc_info.value)

def test_check_plagiarism_with_large_text_content(plagiarism_service):
    # Create a PDF with a large amount of text
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer)
    text = "This is a test sentence. " * 100  # Create a long text
    c.drawString(100, 750, text)
    c.save()
    buffer.seek(0)
    
    result = plagiarism_service.check_plagiarism(buffer)
    
    assert isinstance(result, PlagiarismResult)
    # Verify that the service can handle large text without errors

def test_check_plagiarism_with_special_characters(plagiarism_service):
    sources = [
        KnownSource(
            text="Test with special characters: @#$%^&*()!",
            source="Special Chars Source",
            line_number=1
        ),
    ]
    plagiarism_service.known_sources = sources
    
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer)
    c.drawString(100, 750, "Test with special characters: @#$%^&*()!")
    c.save()
    buffer.seek(0)
    
    result = plagiarism_service.check_plagiarism(buffer)
    
    assert isinstance(result, PlagiarismResult)
    assert len(result.matches) > 0
    assert result.matches[0].similarity_score > 0.8

def test_check_plagiarism_case_sensitivity(plagiarism_service):
    sources = [
        KnownSource(
            text="This Is A Test Sentence.",
            source="Case Test Source",
            line_number=1
        ),
    ]
    plagiarism_service.known_sources = sources
    
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer)
    c.drawString(100, 750, "this is a test sentence.")
    c.save()
    buffer.seek(0)
    
    result = plagiarism_service.check_plagiarism(buffer)
    
    assert isinstance(result, PlagiarismResult)
    assert len(result.matches) > 0
    assert result.matches[0].similarity_score > 0.8  # Should match despite case differences 