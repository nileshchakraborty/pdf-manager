"""PDF operations router module."""

import io
from typing import List, Optional
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Query, Form
from fastapi.responses import Response, StreamingResponse
from app.services.pdf_service import PDFService
from app.core.config import settings
from app.schemas.pdf import (
    PlagiarismResponse,
    PDFMergeResponse,
    PDFCompressResponse,
    PDFExportResponse
)
from app.api.deps import get_current_user, get_pdf_service
import json
import os
from app.models.plagiarism import PlagiarismResult
from datetime import datetime

router = APIRouter()
pdf_service = PDFService()

def generate_output_filename(service_name: str, original_filename: str, extension: str = 'pdf') -> str:
    """
    Generate a filename with service name and timestamp.
    Format: service_name_filename_timestamp.extension
    Example: compress_document_20240220_143022.pdf
    
    Args:
        service_name: Name of the service (e.g., compress, merge, convert)
        original_filename: Original filename
        extension: File extension (default: pdf)
    """
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    # Get filename without extension and remove any spaces or special characters
    base_name = os.path.splitext(original_filename)[0]
    base_name = ''.join(c for c in base_name if c.isalnum() or c in '-_')
    
    # Ensure service name is lowercase and clean
    service_name = service_name.lower().strip()
    
    # Ensure extension is lowercase and doesn't start with a dot
    extension = extension.lower().lstrip('.')
    
    return f"{service_name}_{base_name}_{timestamp}.{extension}"

def convert_to_float(value):
    """Convert any numeric value to float."""
    try:
        return float(str(value))
    except (ValueError, TypeError):
        return value

def convert_operation_values(op: dict) -> dict:
    """Convert numeric values in operation to float."""
    converted = op.copy()
    
    # Convert position coordinates
    if 'position' in converted:
        converted['position'] = {
            'x': convert_to_float(converted['position'].get('x', 0)),
            'y': convert_to_float(converted['position'].get('y', 0))
        }
    
    # Convert region dimensions
    if 'region' in converted:
        converted['region'] = {
            'x': convert_to_float(converted['region'].get('x', 0)),
            'y': convert_to_float(converted['region'].get('y', 0)),
            'width': convert_to_float(converted['region'].get('width', 0)),
            'height': convert_to_float(converted['region'].get('height', 0))
        }
    
    # Convert other numeric values
    if 'opacity' in converted:
        converted['opacity'] = convert_to_float(converted['opacity'])
    if 'fontSize' in converted:
        converted['fontSize'] = convert_to_float(converted['fontSize'])
    if 'page' in converted:
        converted['page'] = int(convert_to_float(converted['page']))
    
    return converted

@router.post(
    "/merge",
    summary="Merge multiple PDF files",
    description="""
    Merge multiple PDF files into a single PDF.
    Files will be merged in the order they are received.
    Requires at least two PDF files.
    """,
    response_description="Returns the merged PDF file",
)
async def merge_pdfs(
    files: List[UploadFile] = File(...),
    pdf_service: PDFService = Depends(get_pdf_service),
    current_user: dict = Depends(get_current_user),
) -> StreamingResponse:
    """
    Merge multiple PDF files into one.
    
    Args:
        files: List of PDF files to merge
        pdf_service: PDFService instance
        current_user: Current authenticated user
        
    Returns:
        StreamingResponse containing the merged PDF
        
    Raises:
        HTTPException: If file validation fails or merging fails
    """
    if len(files) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least two PDF files are required for merging"
        )
    
    # Validate all files are PDFs
    for file in files:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=400,
                detail=f"File {file.filename} is not a PDF"
            )
    
    try:
        # Read all files into memory
        file_contents = []
        for file in files:
            content = await file.read()
            file_contents.append(io.BytesIO(content))
            await file.seek(0)  # Reset file pointer
        
        # Merge PDFs
        merged_pdf = pdf_service.merge_pdfs(file_contents)
        
        # Generate output filename
        output_filename = generate_output_filename("mergepdf", files[0].filename)
        
        return StreamingResponse(
            io.BytesIO(merged_pdf),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={output_filename}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error merging PDFs: {str(e)}"
        )

@router.post(
    "/check-plagiarism",
    response_model=PlagiarismResult,
    summary="Check PDF content for plagiarism",
    description="""
    Analyze PDF content for potential plagiarism using advanced text similarity analysis.
    Supports academic and technical content, with special handling for MBA-specific material.
    Includes source detection and similarity scoring.
    """,
    response_description="Returns plagiarism analysis results",
)
async def check_plagiarism(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
) -> PlagiarismResult:
    """Check PDF content for plagiarism."""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    try:
        result = await pdf_service.check_plagiarism(file)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post(
    "/compress",
    summary="Compress PDF file",
    description="""
    Compress a PDF file to reduce its size while maintaining readability.
    Supports different compression levels for balancing size and quality.
    """,
    response_description="Returns the compressed PDF file",
)
async def compress_pdf(
    file: UploadFile = File(...),
    compression_level: int = Form(2),
    current_user: str = Depends(get_current_user)
) -> StreamingResponse:
    """Compress PDF file."""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    try:
        content = await file.read()
        compressed_pdf = pdf_service.compress_pdf(io.BytesIO(content), compression_level)
        
        # Generate output filename
        output_filename = generate_output_filename("compresspdf", file.filename)
        
        return StreamingResponse(
            io.BytesIO(compressed_pdf),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={output_filename}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/export",
    summary="Export PDF to different format",
    description="""
    Convert PDF to various formats including DOCX, XLSX, TXT, HTML, and images.
    Maintains formatting and layout during conversion.
    Supports multiple export formats with format-specific optimizations.
    """,
    response_description="Returns the converted file",
)
async def export_pdf(
    file: UploadFile = File(...),
    format: str = Form(...),
    current_user: str = Depends(get_current_user)
) -> StreamingResponse:
    """Export PDF to different format."""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    try:
        content = await file.read()
        # Validate format before processing
        if format.lower() not in ['xlsx', 'txt', 'html', 'png', 'jpg', 'jpeg']:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported format: {format}. Supported formats are: xlsx, txt, html, png, jpg, jpeg"
            )

        exported_content = pdf_service.export_pdf(io.BytesIO(content), format.lower())
        
        # Generate output filename with the target format extension
        output_filename = generate_output_filename("exportpdf", file.filename, format.lower())
        
        content_type = {
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'txt': 'text/plain',
            'html': 'text/html',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg'
        }.get(format.lower(), 'application/octet-stream')
        
        return StreamingResponse(
            io.BytesIO(exported_content),
            media_type=content_type,
            headers={
                "Content-Disposition": f"attachment; filename={output_filename}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except UnsupportedFormatError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PDFServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting PDF: {str(e)}")

@router.post(
    "/extract-text",
    summary="Extract text from PDF",
    description="""
    Extract text content from a PDF file.
    Handles various text encodings and maintains formatting.
    """,
    response_description="Returns the extracted text",
)
async def extract_text(
    file: UploadFile = File(..., description="PDF file to extract text from"),
    pdf_service: PDFService = Depends(get_pdf_service),
    current_user: dict = Depends(get_current_user),
):
    """
    Extract text from a PDF file.
    
    Args:
        file: PDF file to extract text from
        pdf_service: PDFService instance
        current_user: Current authenticated user
        
    Returns:
        JSON response containing the extracted text
        
    Raises:
        HTTPException: If file validation fails
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="File must be a PDF"
        )
    
    try:
        content = await file.read()
        text = pdf_service.extract_text(io.BytesIO(content))
        
        return {
            "success": True,
            "message": "Text extracted successfully",
            "data": text
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error extracting text: {str(e)}"
        )

@router.post(
    "/edit",
    summary="Edit PDF file",
    description="""
    Edit a PDF file with various operations like adding text, highlighting text, or deleting content.
    Supports multiple edit operations in a single request including:
    - Adding text with custom font size and color
    - Highlighting text with custom color and opacity
    - Deleting content from specific pages
    """,
    response_description="Returns the edited PDF file",
)
async def edit_pdf(
    file: UploadFile = File(..., description="PDF file to edit"),
    operations: str = Form(..., description="JSON string of edit operations"),
    pdf_service: PDFService = Depends(get_pdf_service),
    current_user: dict = Depends(get_current_user),
) -> StreamingResponse:
    """
    Edit a PDF file.
    
    Args:
        file: PDF file to edit
        operations: JSON string of edit operations (text, highlight, delete)
        pdf_service: PDFService instance
        current_user: Current authenticated user
        
    Returns:
        StreamingResponse containing the edited PDF
        
    Raises:
        HTTPException: If file validation or operations are invalid
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="File must be a PDF"
        )
    
    try:
        # Parse and validate operations
        ops = json.loads(operations)
        for op in ops:
            if op['type'] not in ['text', 'highlight', 'delete']:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid operation type: {op['type']}"
                )
            
            if op['type'] == 'text' and not all(k in op for k in ['content', 'position', 'page']):
                raise HTTPException(
                    status_code=400,
                    detail="Text operation must include content, position, and page"
                )
            
            if op['type'] == 'highlight' and not all(k in op for k in ['text', 'color', 'opacity', 'page']):
                raise HTTPException(
                    status_code=400,
                    detail="Highlight operation must include text, color, opacity, and page"
                )
            
            if op['type'] == 'delete' and 'page' not in op:
                raise HTTPException(
                    status_code=400,
                    detail="Delete operation must include page"
                )
        
        content = await file.read()
        edited_pdf = pdf_service.edit_pdf(io.BytesIO(content), ops)
        
        # Generate output filename
        output_filename = generate_output_filename("editpdf", file.filename)
        
        return StreamingResponse(
            io.BytesIO(edited_pdf),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={output_filename}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Invalid operations JSON format"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error editing PDF: {str(e)}"
        )

@router.post(
    "/preview",
    summary="Preview PDF edits",
    description="""
    Generate a preview of PDF edits without saving changes.
    Supports the same operations as the edit endpoint:
    - Text additions with custom font size and color
    - Text highlighting with custom color and opacity
    - Content deletion from specific pages
    """,
    response_description="Returns a preview of the edited PDF file",
)
async def preview_pdf(
    file: UploadFile = File(..., description="PDF file to preview edits for"),
    operations: str = Form(..., description="JSON string of edit operations"),
    pdf_service: PDFService = Depends(get_pdf_service),
    current_user: dict = Depends(get_current_user),
) -> StreamingResponse:
    """
    Preview PDF edits.
    
    Args:
        file: PDF file to preview edits for
        operations: JSON string of edit operations (text, highlight, delete)
        pdf_service: PDFService instance
        current_user: Current authenticated user
        
    Returns:
        StreamingResponse containing the preview PDF
        
    Raises:
        HTTPException: If file validation or operations are invalid
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="File must be a PDF"
        )
    
    try:
        # Parse operations JSON
        try:
            ops = json.loads(operations)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=400,
                detail="Invalid operations JSON format"
            )
        
        # Validate operations structure
        if not isinstance(ops, list):
            raise HTTPException(
                status_code=400,
                detail="Operations must be a list"
            )
        
        # Validate and convert each operation
        converted_ops = []
        for op in ops:
            if not isinstance(op, dict):
                raise HTTPException(
                    status_code=400,
                    detail="Each operation must be an object"
                )
            
            if 'type' not in op:
                raise HTTPException(
                    status_code=400,
                    detail="Each operation must have a 'type' field"
                )
            
            if op['type'] not in ['text', 'highlight', 'delete']:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid operation type: {op['type']}"
                )
            
            if op['type'] == 'text':
                required_fields = ['content', 'position', 'page']
                missing_fields = [f for f in required_fields if f not in op]
                if missing_fields:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Text operation missing required fields: {', '.join(missing_fields)}"
                    )
            
            if op['type'] == 'highlight':
                required_fields = ['text', 'color', 'opacity', 'page']
                missing_fields = [f for f in required_fields if f not in op]
                if missing_fields:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Highlight operation missing required fields: {', '.join(missing_fields)}"
                    )
            
            if op['type'] == 'delete' and 'page' not in op:
                raise HTTPException(
                    status_code=400,
                    detail="Delete operation must include page"
                )
            
            # Convert decimal values to float
            converted_ops.append(convert_operation_values(op))
        
        # Read file content
        try:
            content = await file.read()
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error reading file: {str(e)}"
            )
        
        # Generate preview with converted operations
        try:
            preview_pdf = pdf_service.preview_pdf(io.BytesIO(content), converted_ops)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error generating preview: {str(e)}"
            )
        
        # Generate output filename
        output_filename = generate_output_filename("previewpdf", file.filename)
        
        return StreamingResponse(
            io.BytesIO(preview_pdf),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={output_filename}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating preview: {str(e)}"
        )

@router.post(
    "/view",
    summary="View PDF file",
    description="Stream a PDF file for viewing in the browser",
    response_description="Returns the PDF file as a stream",
)
async def view_pdf(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
) -> StreamingResponse:
    """View PDF file."""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    try:
        pdf_content = await pdf_service.view(file)
        return StreamingResponse(
            io.BytesIO(pdf_content),
            media_type="application/pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post(
    "/convert",
    summary="Convert file to PDF",
    description="""
    Convert various file formats to PDF.
    Supports formats like DOCX, DOC, XLSX, XLS, PPTX, PPT, TXT, HTML, HTM, JPG, PNG, TIFF.
    Maintains formatting and layout during conversion.
    """,
    response_description="Returns the converted PDF file",
)
async def convert_to_pdf(
    file: UploadFile = File(..., description="File to convert to PDF"),
    pdf_service: PDFService = Depends(get_pdf_service),
    current_user: dict = Depends(get_current_user),
) -> StreamingResponse:
    """
    Convert a file to PDF format.
    
    Args:
        file: File to convert to PDF
        pdf_service: PDFService instance
        current_user: Current authenticated user
        
    Returns:
        StreamingResponse containing the converted PDF
        
    Raises:
        HTTPException: If file validation or conversion fails
    """
    # Get file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    # Check if file format is supported
    supported_formats = [
        '.docx', '.doc',           # Word documents
        '.xlsx', '.xls',           # Excel spreadsheets
        '.pptx', '.ppt',           # PowerPoint presentations
        '.html', '.htm',           # HTML documents
        '.txt',                    # Text files
        '.jpg', '.jpeg',           # JPEG images
        '.png',                    # PNG images
        '.tiff'                    # TIFF images
    ]
    
    if file_ext not in supported_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: {file_ext}. Supported formats are: {', '.join(supported_formats)}"
        )
    
    try:
        content = await file.read()
        converted_pdf = pdf_service.convert_to_pdf(io.BytesIO(content), file_ext[1:])  # Remove the dot from extension
        
        # Generate output filename
        output_filename = generate_output_filename("convertpdf", file.filename)
        
        return StreamingResponse(
            io.BytesIO(converted_pdf),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={output_filename}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error converting file to PDF: {str(e)}"
        ) 