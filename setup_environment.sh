conda create -n pdf_manager python=3.11
conda activate pdf_manager
pip install fastapi uvicorn python-jose[cryptography] python-multipart PyPDF2 pdf2image python-docx openpyxl Pillow pytest 