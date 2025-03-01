from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form, Response
from typing import List
from app.services.pdf_service import PDFService
from app.api.deps import get_current_user
from fastapi.responses import StreamingResponse
import io
import json
from math import ceil

router = APIRouter()
pdf_service = PDFService()

@router.get("/view")
async def view_pdf(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    content = await file.read()
    return StreamingResponse(
        io.BytesIO(content),
        media_type="application/pdf"
    )

@router.post("/edit")
async def edit_pdf(
    file: UploadFile = File(...),
    operations: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    content = await file.read()
    operations_list = json.loads(operations)
    edited = pdf_service.edit_pdf(io.BytesIO(content), operations_list)
    return StreamingResponse(
        io.BytesIO(edited),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=edited_{file.filename}"}
    )

@router.post("/export")
async def export_pdf(
    file: UploadFile = File(...),
    export_format: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    content = await file.read()
    
    # Map frontend format names to internal format names
    format_mapping = {
        "doc": "doc",
        "docx": "docx",
        "xls": "xls",
        "xlsx": "xlsx",
        "ppt": "ppt",
        "pptx": "pptx",
        "jpg": "jpg",
        "jpeg": "jpeg",
        "png": "png",
        "txt": "txt"
    }
    
    internal_format = format_mapping.get(export_format.lower())
    if not internal_format:
        raise HTTPException(status_code=400, detail=f"Unsupported export format: {export_format}")
    
    exported = pdf_service.export_pdf(io.BytesIO(content), internal_format)
    
    media_types = {
        "doc": "application/msword",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "xls": "application/vnd.ms-excel",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "ppt": "application/vnd.ms-powerpoint",
        "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "txt": "text/plain"
    }
    
    # Map internal formats to correct file extensions
    file_extensions = {
        "doc": "doc",
        "docx": "docx",
        "xls": "xls",
        "xlsx": "xlsx",
        "ppt": "ppt",
        "pptx": "pptx",
        "jpg": "jpg",
        "jpeg": "jpeg",
        "png": "png",
        "txt": "txt"
    }
    
    return StreamingResponse(
        io.BytesIO(exported),
        media_type=media_types[internal_format],
        headers={
            "Content-Disposition": f"attachment; filename=exported.{file_extensions[internal_format]}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@router.post("/merge")
async def merge_pdfs(
    files: List[UploadFile] = File(...),
    merge_order: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        # Parse merge_order from JSON string to list
        order = json.loads(merge_order)
        if not isinstance(order, list):
            raise HTTPException(status_code=400, detail="merge_order must be a list")
        
        # Read all files
        file_contents = []
        for file in files:
            content = await file.read()
            file_contents.append(io.BytesIO(content))
        
        # Validate order indices
        if any(i >= len(files) for i in order):
            raise HTTPException(
                status_code=400, 
                detail="merge_order contains invalid indices"
            )
        
        merged = pdf_service.merge_pdfs(file_contents, order)
        
        return StreamingResponse(
            io.BytesIO(merged),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=merged.pdf",
                "Access-Control-Expose-Headers": "Content-Disposition",
            }
        )
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400, 
            detail="Invalid merge_order format"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.options("/compress")
async def compress_pdf_options():
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
            "Access-Control-Allow-Credentials": "true",
        }
    )

@router.post("/compress")
async def compress_pdf(
    file: UploadFile = File(...),
    compression_level: int = Form(...),
    current_user: dict = Depends(get_current_user)
):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    try:
        content = await file.read()
        # Map compression level from frontend (1-10) to backend (1-3)
        mapped_level = max(1, min(3, ceil(compression_level / 3)))
        compressed = pdf_service.compress_pdf(io.BytesIO(content), mapped_level)
        
        return StreamingResponse(
            io.BytesIO(compressed),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=compressed_{file.filename}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error compressing PDF: {str(e)}"
        )

@router.post("/plagiarism")
async def check_plagiarism(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    content = await file.read()
    result = pdf_service.check_plagiarism(io.BytesIO(content))
    return result

# Implement other endpoints similarly 