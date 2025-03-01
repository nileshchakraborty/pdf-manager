"""PDF operation schemas."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class BaseResponse(BaseModel):
    """Base response model."""
    success: bool = Field(..., description="Operation success status")
    message: str = Field(..., description="Response message")

class PDFMergeResponse(BaseResponse):
    """Response model for PDF merge operation."""
    content: bytes = Field(..., description="Merged PDF content")

class PlagiarismMatch(BaseModel):
    """Model for a single plagiarism match."""
    text: str = Field(..., description="The matched text")
    source: str = Field(..., description="Source of the match")
    similarity: float = Field(..., ge=0.0, le=1.0, description="Similarity score")
    line_number: int = Field(..., gt=0, description="Line number in the PDF")
    source_line: Optional[int] = Field(None, description="Line number in the source")
    threshold_used: float = Field(..., description="Threshold used for this match")
    source_type: str = Field(..., description="Type of source (academic, web, etc.)")
    text_length: int = Field(..., description="Length of matched text")

class PlagiarismResponse(BaseResponse):
    """Response model for plagiarism check operation."""
    plagiarized: bool = Field(..., description="Whether plagiarism was detected")
    matches: List[PlagiarismMatch] = Field(
        default_factory=list,
        description="List of plagiarism matches found"
    )

class PDFCompressResponse(BaseResponse):
    """Response model for PDF compression operation."""
    content: bytes = Field(..., description="Compressed PDF content")
    original_size: Optional[int] = Field(
        None,
        description="Original file size in bytes"
    )
    compressed_size: Optional[int] = Field(
        None,
        description="Compressed file size in bytes"
    )
    compression_ratio: Optional[float] = Field(
        None,
        description="Compression ratio achieved"
    )

class PDFExportResponse(BaseResponse):
    """Response model for PDF export operation."""
    content: bytes = Field(..., description="Exported file content")
    format: str = Field(
        ...,
        description="Export format (xlsx, docx, jpg, png)"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional format-specific metadata"
    )

class PDFAnalysisResponse(BaseResponse):
    """Response model for PDF analysis operation."""
    page_count: int = Field(..., description="Number of pages")
    word_count: int = Field(..., description="Total word count")
    character_count: int = Field(..., description="Total character count")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="PDF metadata"
    )
    text_content: Optional[str] = Field(
        None,
        description="Extracted text content"
    )
