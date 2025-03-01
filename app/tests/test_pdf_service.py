"""Tests for the PDF service."""

import io
import os
import pytest
from unittest.mock import Mock, patch, MagicMock
from typing import BinaryIO
from pathlib import Path

import PyPDF2
import pandas as pd
from PIL import Image
from PyPDF2 import PdfWriter, PdfReader

from app.services.pdf_service import (
    PDFService,
    PDFServiceError,
    FileSizeError,
    UnsupportedFormatError,
    KnownSource,
    CompressionLevel,
    ExportFormat,
)


@pytest.fixture
def pdf_service():
    """Create a PDF service instance for testing."""
    return PDFService()


@pytest.fixture
def valid_pdf_file():
    """Create a valid PDF file for testing."""
    output = PdfWriter()
    page = output.add_blank_page(width=612, height=792)  # Standard letter size
    
    # Create PDF in memory
    pdf_buffer = io.BytesIO()
    output.write(pdf_buffer)
    pdf_buffer.seek(0)
    
    return pdf_buffer


@pytest.fixture
def large_pdf_file():
    """Create a mock large PDF file for testing."""
    output = PdfWriter()
    page = output.add_blank_page(width=612, height=792)
    
    # Create large PDF in memory
    pdf_buffer = io.BytesIO()
    output.write(pdf_buffer)
    # Add padding to make it larger than 10MB
    pdf_buffer.write(b'0' * (11 * 1024 * 1024))
    pdf_buffer.seek(0)
    
    return pdf_buffer


@pytest.fixture
def mock_text_pdf(monkeypatch):
    """Mock PDF reader with text content."""
    class MockPage:
        def extract_text(self):
            return "Test content\nMore content"

    class MockPdfReader:
        @property
        def pages(self):
            return [MockPage()]

    def mock_pdfreader(file_obj):
        return MockPdfReader()

    monkeypatch.setattr('app.services.pdf_service.PdfReader', mock_pdfreader)
    return MockPdfReader()


@pytest.fixture
def sample_pdf():
    # Create a simple PDF with some text
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    c.drawString(100, 750, "Sample Text")
    c.save()
    buffer.seek(0)
    return buffer


@pytest.fixture
def test_pdf():
    """Create a test PDF with known content."""
    from app.tests.data.test import create_test_pdf
    import tempfile
    
    # Create a temporary file
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
        create_test_pdf(tmp.name)
        tmp.seek(0)
        yield tmp.name
        # Cleanup after test
        try:
            os.unlink(tmp.name)
        except:
            pass


class TestPDFService:
    """Test suite for PDFService."""

    def test_init(self):
        """Test service initialization."""
        service = PDFService()
        assert service.known_sources == []

    def test_validate_file_size_success(self, pdf_service, valid_pdf_file):
        """Test file size validation with valid file."""
        pdf_service._validate_file_size(valid_pdf_file)
        # Should not raise any exception

    def test_validate_file_size_error(self, pdf_service, large_pdf_file):
        """Test file size validation with oversized file."""
        with pytest.raises(FileSizeError) as exc:
            pdf_service._validate_file_size(large_pdf_file)
        assert "File size exceeds 10MB limit" in str(exc.value)

    def test_validate_format_success(self, pdf_service):
        """Test format validation with valid format."""
        pdf_service._validate_format(ExportFormat.XLSX.value)
        # Should not raise any exception

    def test_validate_format_error(self, pdf_service):
        """Test format validation with invalid format."""
        with pytest.raises(UnsupportedFormatError) as exc:
            pdf_service._validate_format('invalid')
        assert "Unsupported export format" in str(exc.value)

    def test_normalize_text(self, pdf_service):
        """Test text normalization."""
        text = "Test content with special chars: é à ñ"
        normalized = pdf_service._normalize_text(text)
        assert isinstance(normalized, str)
        assert normalized != ""

    def test_extract_text_success(self, pdf_service, valid_pdf_file, mock_text_pdf):
        """Test text extraction from PDF."""
        text = pdf_service.extract_text(valid_pdf_file)
        assert "Test content" in text
        assert "More content" in text

    def test_extract_text_empty_pdf(self, pdf_service, valid_pdf_file):
        """Test text extraction from empty PDF."""
        class MockEmptyPage:
            def extract_text(self):
                return ""

        class MockEmptyPdfReader:
            @property
            def pages(self):
                return [MockEmptyPage()]

        with patch('PyPDF2.PdfReader', return_value=MockEmptyPdfReader()):
            with pytest.raises(PDFServiceError) as exc:
                pdf_service.extract_text(valid_pdf_file)
            assert "No text could be extracted" in str(exc.value)

    def test_extract_text_with_line_numbers(self, pdf_service, valid_pdf_file, mock_text_pdf):
        """Test text extraction with line numbers."""
        text, line_numbers = pdf_service.extract_text_with_line_numbers(valid_pdf_file)
        assert text == "Test content\nMore content\n"
        assert line_numbers == [1, 2]

    def test_preprocess_text(self, pdf_service):
        """Test text preprocessing."""
        text = "Test Content! With 123 numbers and CAPS."
        processed = pdf_service.preprocess_text(text)
        assert processed == "test content with numbers and caps"

    def test_get_similarity_threshold(self, pdf_service):
        """Test similarity threshold calculation."""
        # Short text
        short_text = "Short text"
        threshold = pdf_service.get_similarity_threshold(short_text)
        assert threshold == 0.7

        # Long text
        long_text = " ".join(["word"] * 600)
        threshold = pdf_service.get_similarity_threshold(long_text)
        assert threshold == 0.3

    def test_check_plagiarism(self, pdf_service, valid_pdf_file, mock_text_pdf):
        """Test plagiarism checking."""
        # Add a known source
        pdf_service.known_sources = [
            KnownSource(text="Test content\nMore content", source="source1", line_number=1)
        ]

        result = pdf_service.check_plagiarism(valid_pdf_file)
        assert isinstance(result, dict)
        assert 'plagiarized' in result
        assert 'matches' in result
        assert 'error' in result

    def test_export_pdf_invalid_format(self, pdf_service, valid_pdf_file):
        """Test PDF export with invalid format."""
        with pytest.raises(UnsupportedFormatError) as exc:
            pdf_service.export_pdf(valid_pdf_file, 'invalid')
        assert "Unsupported export format" in str(exc.value)

    @patch('pandas.DataFrame.to_excel')
    def test_export_to_xlsx(self, mock_to_excel, pdf_service, valid_pdf_file, mock_text_pdf):
        """Test PDF export to Excel."""
        # Mock Excel writer
        mock_writer = MagicMock()
        mock_writer.__enter__.return_value = mock_writer
        mock_writer.__exit__.return_value = None

        with patch('pandas.ExcelWriter', return_value=mock_writer):
            result = pdf_service._export_to_xlsx(valid_pdf_file)
            assert isinstance(result, bytes)
            mock_to_excel.assert_called_once()

    @patch('app.services.pdf_service.convert_from_bytes')
    def test_export_to_image(self, mock_convert, pdf_service, valid_pdf_file):
        """Test PDF export to image."""
        # Mock image conversion
        mock_image = MagicMock(spec=Image.Image)
        mock_image.save = MagicMock()
        mock_convert.return_value = [mock_image]

        result = pdf_service._export_to_image(valid_pdf_file)
        assert isinstance(result, bytes)
        mock_convert.assert_called_once()

    def test_merge_pdfs(self, pdf_service, valid_pdf_file):
        """Test PDF merging."""
        files = [valid_pdf_file, valid_pdf_file]
        result = pdf_service.merge_pdfs(files)
        assert isinstance(result, bytes)

    def test_merge_pdfs_with_order(self, pdf_service, valid_pdf_file):
        """Test PDF merging with specified order."""
        files = [valid_pdf_file, valid_pdf_file]
        order = [1, 0]
        result = pdf_service.merge_pdfs(files, order)
        assert isinstance(result, bytes)

    def test_merge_pdfs_invalid_order(self, pdf_service, valid_pdf_file):
        """Test PDF merging with invalid order."""
        # Create two files to pass the minimum files check
        files = [valid_pdf_file, valid_pdf_file]
        order = [0, 1, 2]  # More order indices than files
        with pytest.raises(ValueError) as exc:
            pdf_service.merge_pdfs(files, order)
        assert "Order list length must match number of files" in str(exc.value)

    def test_merge_pdfs_minimum_files(self, pdf_service, valid_pdf_file):
        """Test PDF merging with insufficient files."""
        files = [valid_pdf_file]  # Only one file
        with pytest.raises(ValueError) as exc:
            pdf_service.merge_pdfs(files)
        assert "At least two PDF files are required for merging" in str(exc.value)

    def test_compress_pdf(self, pdf_service, valid_pdf_file):
        """Test PDF compression."""
        result = pdf_service.compress_pdf(valid_pdf_file, CompressionLevel.MEDIUM.value)
        assert isinstance(result, bytes)

    def test_compress_pdf_invalid_level(self, pdf_service, valid_pdf_file):
        """Test PDF compression with invalid level."""
        invalid_level = 999  # A level that doesn't exist in CompressionLevel enum
        with pytest.raises(ValueError, match="Invalid compression quality level"):
            pdf_service.compress_pdf(valid_pdf_file, invalid_level) 

    def test_edit_pdf_text_operation(self, pdf_service, sample_pdf):
        """Test adding text to a PDF."""
        operations = [{
            'type': 'text',
            'content': 'Test Text',
            'position': {'x': 100, 'y': 100},
            'page': 1,
            'fontSize': 12,
            'fontColor': '#000000'
        }]
        
        # Apply edit operations
        result, filename = pdf_service.edit_pdf(sample_pdf, operations)
        
        # Verify the result is valid PDF
        assert result is not None
        assert len(result) > 0
        
        # Read the resulting PDF to verify it's valid
        output = io.BytesIO(result)
        reader = PdfReader(output)
        assert len(reader.pages) > 0
        
        # Verify filename format
        assert filename.startswith('edited_') and filename.endswith('.pdf')

    def test_edit_pdf_highlight_operation(self, pdf_service, sample_pdf):
        """Test highlighting text in a PDF."""
        operations = [{
            'type': 'highlight',
            'text': 'Sample Text',
            'color': '#ffeb3b',
            'opacity': 0.5,
            'page': 1
        }]
        
        # Apply edit operations
        result, filename = pdf_service.edit_pdf(sample_pdf, operations)
        
        # Verify the result is valid PDF
        assert result is not None
        assert len(result) > 0
        
        # Read the resulting PDF to verify it's valid
        output = io.BytesIO(result)
        reader = PdfReader(output)
        assert len(reader.pages) > 0

    def test_edit_pdf_multiple_operations(self, pdf_service, sample_pdf):
        """Test applying multiple operations to a PDF."""
        operations = [
            {
                'type': 'text',
                'content': 'New Text',
                'position': {'x': 100, 'y': 100},
                'page': 1,
                'fontSize': 12,
                'fontColor': '#000000'
            },
            {
                'type': 'highlight',
                'text': 'Sample Text',
                'color': '#ffeb3b',
                'opacity': 0.5,
                'page': 1
            }
        ]
        
        # Apply edit operations
        result, filename = pdf_service.edit_pdf(sample_pdf, operations)
        
        # Verify the result is valid PDF
        assert result is not None
        assert len(result) > 0
        
        # Read the resulting PDF to verify it's valid
        output = io.BytesIO(result)
        reader = PdfReader(output)
        assert len(reader.pages) > 0

    def test_edit_pdf_invalid_operation(self, pdf_service, sample_pdf):
        """Test handling of invalid operations."""
        operations = [{
            'type': 'invalid_type',
            'content': 'Test',
            'page': 1
        }]
        
        # Verify that invalid operation raises error
        with pytest.raises(PDFServiceError):
            pdf_service.edit_pdf(sample_pdf, operations)

    def test_edit_pdf_missing_required_fields(self, pdf_service, sample_pdf):
        """Test handling of operations with missing required fields."""
        operations = [
            {
                'type': 'text',
                # Missing 'content' and 'position'
                'page': 1
            }
        ]
        
        # Verify that missing required fields raises error
        with pytest.raises(PDFServiceError):
            pdf_service.edit_pdf(sample_pdf, operations)

    def test_edit_pdf_invalid_page_number(self, pdf_service, sample_pdf):
        """Test handling of invalid page numbers."""
        operations = [{
            'type': 'text',
            'content': 'Test',
            'position': {'x': 100, 'y': 100},
            'page': 999,  # Invalid page number
            'fontSize': 12,
            'fontColor': '#000000'
        }]
        
        # Verify that invalid page number raises error
        with pytest.raises(PDFServiceError):
            pdf_service.edit_pdf(sample_pdf, operations)

    def test_edit_pdf_empty_operations(self, pdf_service, sample_pdf):
        """Test handling of empty operations list."""
        # Verify that empty operations list raises error
        with pytest.raises(PDFServiceError):
            pdf_service.edit_pdf(sample_pdf, [])

    def test_edit_pdf_invalid_input_file(self, pdf_service):
        """Test handling of invalid input file."""
        operations = [{
            'type': 'text',
            'content': 'Test',
            'position': {'x': 100, 'y': 100},
            'page': 1
        }]
        
        # Create invalid PDF file
        invalid_pdf = io.BytesIO(b"Not a PDF file")
        
        # Verify that invalid input file raises error
        with pytest.raises(PDFServiceError):
            pdf_service.edit_pdf(invalid_pdf, operations) 

    def test_edit_pdf_delete_operation(self, pdf_service, sample_pdf):
        """Test deleting content from a PDF."""
        operations = [{
            'type': 'delete',
            'region': {
                'x': 50,
                'y': 50,
                'width': 100,
                'height': 20
            },
            'page': 1
        }]
        
        # Apply edit operations
        result, filename = pdf_service.edit_pdf(sample_pdf, operations)
        
        # Verify the result is valid PDF
        assert result is not None
        assert len(result) > 0
        
        # Read the resulting PDF to verify it's valid
        output = io.BytesIO(result)
        reader = PdfReader(output)
        assert len(reader.pages) > 0

    def test_edit_pdf_multiple_operations_with_delete(self, pdf_service, sample_pdf):
        """Test applying multiple operations including delete to a PDF."""
        operations = [
            {
                'type': 'text',
                'content': 'New Text',
                'position': {'x': 100, 'y': 100},
                'page': 1,
                'fontSize': 12,
                'fontColor': '#000000'
            },
            {
                'type': 'highlight',
                'text': 'Sample Text',
                'color': '#ffeb3b',
                'opacity': 0.5,
                'page': 1
            },
            {
                'type': 'delete',
                'region': {
                    'x': 50,
                    'y': 50,
                    'width': 100,
                    'height': 20
                },
                'page': 1
            }
        ]
        
        # Apply edit operations
        result, filename = pdf_service.edit_pdf(sample_pdf, operations)
        
        # Verify the result is valid PDF
        assert result is not None
        assert len(result) > 0
        
        # Read the resulting PDF to verify it's valid
        output = io.BytesIO(result)
        reader = PdfReader(output)
        assert len(reader.pages) > 0

    def test_edit_pdf_delete_missing_region(self, pdf_service, sample_pdf):
        """Test delete operation with missing region."""
        operations = [{
            'type': 'delete',
            'page': 1
            # Missing region parameter
        }]
        
        # Verify that missing region raises error
        with pytest.raises(PDFServiceError):
            pdf_service.edit_pdf(sample_pdf, operations)

    def test_edit_pdf_delete_invalid_region(self, pdf_service, sample_pdf):
        """Test delete operation with invalid region parameters."""
        operations = [{
            'type': 'delete',
            'region': {
                'x': 'invalid',  # Invalid x coordinate
                'y': 50,
                'width': 100,
                'height': 20
            },
            'page': 1
        }]
        
        # Verify that invalid region parameters raise error
        with pytest.raises(PDFServiceError):
            pdf_service.edit_pdf(sample_pdf, operations)

    def test_edit_pdf_delete_negative_dimensions(self, pdf_service, sample_pdf):
        """Test delete operation with negative dimensions."""
        operations = [{
            'type': 'delete',
            'region': {
                'x': 50,
                'y': 50,
                'width': -100,  # Negative width
                'height': -20   # Negative height
            },
            'page': 1
        }]
        
        # Verify that negative dimensions raise error
        with pytest.raises(PDFServiceError):
            pdf_service.edit_pdf(sample_pdf, operations) 

    def test_edit_pdf_text_operation_detailed(self, pdf_service, test_pdf):
        """Test adding text to a PDF with detailed verification."""
        with open(test_pdf, 'rb') as f:
            operations = [{
                'type': 'text',
                'content': 'Added Text',
                'position': {'x': 100, 'y': 300},
                'page': 1,
                'fontSize': 12,
                'fontColor': '#000000'
            }]
            
            # Apply edit operations
            result, filename = pdf_service.edit_pdf(f, operations)
            
            # Verify the result is valid PDF
            assert result is not None
            assert len(result) > 0
            
            # Save the result for manual inspection if needed
            with open('app/tests/data/output_text.pdf', 'wb') as out:
                out.write(result)
            
            # Read the resulting PDF to verify it's valid
            output = io.BytesIO(result)
            reader = PdfReader(output)
            assert len(reader.pages) == 2  # Should still have 2 pages
            
            # Verify filename format
            assert filename.startswith('edited_') and filename.endswith('.pdf')

    def test_edit_pdf_highlight_operation_detailed(self, pdf_service, test_pdf):
        """Test highlighting text in a PDF with detailed verification."""
        with open(test_pdf, 'rb') as f:
            operations = [{
                'type': 'highlight',
                'text': 'Text to be highlighted',
                'color': '#ffeb3b',
                'opacity': 0.5,
                'page': 1
            }]
            
            # Apply edit operations
            result, filename = pdf_service.edit_pdf(f, operations)
            
            # Save the result for manual inspection
            with open('app/tests/data/output_highlight.pdf', 'wb') as out:
                out.write(result)
            
            # Verify the result is valid PDF
            assert result is not None
            assert len(result) > 0
            
            # Read the resulting PDF to verify it's valid
            output = io.BytesIO(result)
            reader = PdfReader(output)
            assert len(reader.pages) == 2  # Should still have 2 pages

    def test_edit_pdf_delete_operation_detailed(self, pdf_service, test_pdf):
        """Test deleting content from a PDF with detailed verification."""
        with open(test_pdf, 'rb') as f:
            operations = [{
                'type': 'delete',
                'region': {
                    'x': 100,
                    'y': 600,  # Position of "Line 3: Text to be deleted"
                    'width': 200,
                    'height': 20
                },
                'page': 1
            }]
            
            # Apply edit operations
            result, filename = pdf_service.edit_pdf(f, operations)
            
            # Save the result for manual inspection
            with open('app/tests/data/output_delete.pdf', 'wb') as out:
                out.write(result)
            
            # Verify the result is valid PDF
            assert result is not None
            assert len(result) > 0
            
            # Read the resulting PDF to verify it's valid
            output = io.BytesIO(result)
            reader = PdfReader(output)
            assert len(reader.pages) == 2  # Should still have 2 pages

    def test_edit_pdf_multiple_operations_detailed(self, pdf_service, test_pdf):
        """Test applying multiple operations to a PDF with detailed verification."""
        with open(test_pdf, 'rb') as f:
            operations = [
                {
                    'type': 'text',
                    'content': 'Added Text',
                    'position': {'x': 100, 'y': 300},
                    'page': 1,
                    'fontSize': 12,
                    'fontColor': '#000000'
                },
                {
                    'type': 'highlight',
                    'text': 'Text to be highlighted',
                    'color': '#ffeb3b',
                    'opacity': 0.5,
                    'page': 1
                },
                {
                    'type': 'delete',
                    'region': {
                        'x': 100,
                        'y': 600,
                        'width': 200,
                        'height': 20
                    },
                    'page': 1
                }
            ]
            
            # Apply edit operations
            result, filename = pdf_service.edit_pdf(f, operations)
            
            # Save the result for manual inspection
            with open('app/tests/data/output_multiple.pdf', 'wb') as out:
                out.write(result)
            
            # Verify the result is valid PDF
            assert result is not None
            assert len(result) > 0
            
            # Read the resulting PDF to verify it's valid
            output = io.BytesIO(result)
            reader = PdfReader(output)
            assert len(reader.pages) == 2  # Should still have 2 pages

    def test_edit_pdf_file_remains_open(self, pdf_service, test_pdf):
        """Test that files remain open during edit operations."""
        with open(test_pdf, 'rb') as f:
            operations = [
                {
                    'type': 'text',
                    'content': 'HELLO',
                    'position': {'x': 100, 'y': 100},
                    'page': 1,
                    'fontSize': 33,
                    'fontColor': '#c90d0d'
                },
                {
                    'type': 'highlight',
                    'text': 'HELLO',
                    'color': '#ffeb3b',
                    'opacity': 0.5,
                    'page': 1
                }
            ]
            
            # Apply edit operations
            result, filename = pdf_service.edit_pdf(f, operations)
            
            # Verify the file is still open and readable
            assert not f.closed, "File was closed prematurely"
            
            # Try reading from the file to ensure it's still accessible
            f.seek(0)
            content = f.read()
            assert len(content) > 0, "File content should be readable"
            
            # Verify the result is valid PDF
            assert result is not None
            assert len(result) > 0
            
            # Save the result for inspection
            with open('app/tests/data/output_file_open.pdf', 'wb') as out:
                out.write(result)
            
            # Read the resulting PDF to verify it's valid
            output = io.BytesIO(result)
            reader = PdfReader(output)
            assert len(reader.pages) == 2  # Should still have 2 pages

    def test_edit_pdf_file_cleanup(self, pdf_service, test_pdf):
        """Test that temporary files are properly cleaned up after edit operations."""
        import tempfile
        import os
        
        # Track temporary files before the operation
        temp_dir = tempfile.gettempdir()
        files_before = set(os.listdir(temp_dir))
        
        with open(test_pdf, 'rb') as f:
            operations = [
                {
                    'type': 'text',
                    'content': 'HELLO',
                    'position': {'x': 100, 'y': 100},
                    'page': 1,
                    'fontSize': 33,
                    'fontColor': '#c90d0d'
                }
            ]
            
            # Apply edit operations
            result, filename = pdf_service.edit_pdf(f, operations)
            
            # Track temporary files after the operation
            files_after = set(os.listdir(temp_dir))
            new_temp_files = files_after - files_before
            
            # Verify no temporary files are left behind
            pdf_temp_files = [f for f in new_temp_files if f.endswith('.pdf')]
            assert len(pdf_temp_files) == 0, "Temporary PDF files were not cleaned up"
            
            # Verify the result is still valid
            assert result is not None
            assert len(result) > 0
            
            # Verify the file handle is still open
            assert not f.closed, "File was closed prematurely"

    def test_edit_pdf_text_and_highlight_file_handling(self, pdf_service, test_pdf):
        """Test file handling during text and highlight operations."""
        with open(test_pdf, 'rb') as f:
            operations = [
                {
                    'type': 'text',
                    'content': 'HELLO',
                    'position': {'x': 100, 'y': 100},
                    'page': 1,
                    'fontSize': 33,
                    'fontColor': '#c90d0d'
                },
                {
                    'type': 'highlight',
                    'text': 'HELLO',
                    'color': '#ffeb3b',
                    'opacity': 0.5,
                    'page': 1
                }
            ]
            
            # Track file state before operations
            initial_position = f.tell()
            assert not f.closed, "File should be open before operations"
            
            try:
                # Apply edit operations
                result, filename = pdf_service.edit_pdf(f, operations)
                
                # Verify file state after operations
                assert not f.closed, "File was closed during operations"
                
                # Try reading from the file to ensure it's still accessible
                f.seek(0)
                content = f.read()
                assert len(content) > 0, "File should be readable after operations"
                
                # Verify the result is valid PDF
                assert result is not None
                assert len(result) > 0
                
                # Save the result for inspection
                with open('app/tests/data/output_text_highlight.pdf', 'wb') as out:
                    out.write(result)
                
                # Read the resulting PDF to verify it's valid
                output = io.BytesIO(result)
                reader = PdfReader(output)
                assert len(reader.pages) == 2  # Should still have 2 pages
                
                # Verify we can still seek in the original file
                f.seek(initial_position)
                assert f.tell() == initial_position, "File position should be restorable"
                
            except Exception as e:
                pytest.fail(f"Operation failed with error: {str(e)}")

    def test_edit_pdf_fastapi_simulation(self, pdf_service, test_pdf):
        """Test file handling in a way that simulates FastAPI's file handling."""
        # Create a BytesIO buffer to simulate FastAPI's file handling
        with open(test_pdf, 'rb') as original:
            file_content = original.read()
        
        # Simulate FastAPI's file handling where the file might be read multiple times
        file_obj = io.BytesIO(file_content)
        file_obj.name = "test.pdf"  # Simulate UploadFile name attribute
        
        operations = [
            {
                'type': 'text',
                'content': 'HELLO',
                'position': {'x': 100, 'y': 100},
                'page': 1,
                'fontSize': 33,
                'fontColor': '#c90d0d'
            },
            {
                'type': 'highlight',
                'text': 'HELLO',
                'color': '#ffeb3b',
                'opacity': 0.5,
                'page': 1
            }
        ]
        
        try:
            # First read to simulate FastAPI's form parsing
            file_obj.seek(0)
            _ = file_obj.read()
            
            # Reset for PDF service
            file_obj.seek(0)
            
            # Apply edit operations
            result, filename = pdf_service.edit_pdf(file_obj, operations)
            
            # Verify the result is valid PDF
            assert result is not None
            assert len(result) > 0
            
            # Save the result for inspection
            with open('app/tests/data/output_fastapi_sim.pdf', 'wb') as out:
                out.write(result)
            
            # Read the resulting PDF to verify it's valid
            output = io.BytesIO(result)
            reader = PdfReader(output)
            assert len(reader.pages) == 2  # Should still have 2 pages
            
            # Try to read the input file again to verify it's still accessible
            file_obj.seek(0)
            content = file_obj.read()
            assert len(content) > 0, "File should still be readable"
            
        except Exception as e:
            pytest.fail(f"Operation failed with error: {str(e)}")
        finally:
            file_obj.close()

    def test_edit_pdf_seek_closed_file(self, pdf_service, test_pdf):
        """Test handling of file that might be closed during operations."""
        # Create a BytesIO buffer that we'll close during operations
        with open(test_pdf, 'rb') as original:
            file_content = original.read()
    
        class ClosingBytesIO(io.BytesIO):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                self._closed = False
                self._seek_count = 0
    
            def read(self, *args, **kwargs):
                if self._closed:
                    raise ValueError("seek of closed file")
                return super().read(*args, **kwargs)
    
            def seek(self, *args, **kwargs):
                if self._closed:
                    raise ValueError("seek of closed file")
                self._seek_count += 1
                if self._seek_count >= 1:  # Close on first seek
                    self._closed = True
                    raise ValueError("seek of closed file")
                return super().seek(*args, **kwargs)
    
            @property
            def closed(self):
                return self._closed
    
            def close(self):
                self._closed = True
                super().close()
    
        operations = [
            {
                'type': 'text',
                'content': 'HELLO',
                'position': {'x': 100, 'y': 100},
                'page': 1,
                'fontSize': 33,
                'fontColor': '#c90d0d'
            },
            {
                'type': 'highlight',
                'text': 'HELLO',
                'color': '#ffeb3b',
                'opacity': 0.5,
                'page': 1
            }
        ]
    
        # Create a file object that will close itself on first seek
        tricky_file = ClosingBytesIO(file_content)
        tricky_file.name = "test.pdf"
    
        try:
            # This should raise an error about seeking a closed file
            with pytest.raises(PDFServiceError, match="File was closed during processing"):
                pdf_service.edit_pdf(tricky_file, operations)
        finally:
            if not tricky_file.closed:
                tricky_file.close()
 