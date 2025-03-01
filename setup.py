from setuptools import setup, find_packages

setup(
    name="pdf-manager",
    version="1.0.0",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        # FastAPI and server dependencies
        "fastapi>=0.68.0",
        "uvicorn>=0.15.0",
        "python-multipart>=0.0.5",
        "pydantic>=2.0.0",
        "pydantic-settings>=2.0.0",
        
        # PDF processing
        "PyPDF2>=3.0.0",
        "fpdf2>=2.7.6",
        "pdf2image>=1.16.3",
        "python-docx>=1.0.0",
        "openpyxl>=3.1.2",
        "xlwt>=1.3.0",
        "Pillow>=10.0.0",
        "pandas>=2.1.0",
        "reportlab>=4.0.8",
        "python-pptx>=0.6.21",
        
        # Authentication and security
        "python-jose[cryptography]>=3.3.0",
        "passlib[bcrypt]>=1.7.4",
        
        # Testing
        "pytest>=7.4.0",
        "pytest-cov>=4.1.0",
        "httpx>=0.25.0",
        
        # Database and storage
        "python-dotenv>=0.19.0",
        
        # CORS
        "starlette>=0.27.0",
        
        # Performance
        "ujson>=5.8.0",
        "orjson>=3.9.10",
        
        # Plagiarism detection
        "scikit-learn>=1.3.0",
        "numpy>=1.24.0",
        "beautifulsoup4>=4.12.0",
        "requests>=2.31.0",
        "nltk>=3.8.1",
        "langdetect>=1.0.9",
        "transformers>=4.35.0",
        "sentence-transformers>=2.2.2",
        "spacy>=3.7.0",
        "spacy-transformers>=1.3.2",
    ],
    extras_require={
        "dev": [
            "black",
            "isort",
            "mypy",
            "pylint",
            "pytest",
            "pytest-cov",
            "pre-commit",
        ],
        "test": [
            "pytest",
            "pytest-cov",
            "pytest-asyncio",
            "httpx",
        ],
    },
    python_requires=">=3.8",
)
