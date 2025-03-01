# PDF Manager

A web application for managing and manipulating PDF files.

## Features

- Convert various file formats to PDF (DOCX, XLSX, HTML, TXT)
- Compress PDF files
- Merge multiple PDFs
- Edit PDFs (add text, highlight, delete content)
- Export PDFs to different formats
- Check for plagiarism
- View PDFs in browser

## System Requirements

### Core Requirements

- Python 3.8 or higher
- Node.js 16 or higher
- npm 8 or higher

### File Conversion Dependencies

For file conversion functionality, you need to install the following system packages:

#### macOS

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install LibreOffice (for DOCX/XLSX conversion)
brew install libreoffice

# Install unoconv
brew install unoconv

# Install WeasyPrint dependencies
brew install cairo pango gdk-pixbuf libffi
```

#### Linux (Ubuntu/Debian)

```bash
# Install LibreOffice and unoconv
sudo apt-get update
sudo apt-get install -y libreoffice unoconv

# Install WeasyPrint dependencies
sudo apt-get install -y python3-cffi python3-brotli libpango-1.0-0 libharfbuzz0b libpangoft2-1.0-0
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pdf-manager.git
cd pdf-manager
```

2. Set up the backend:
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

3. Set up the frontend:
```bash
cd frontend
npm install
```

4. Create a `.env` file in the root directory:
```
VITE_TOKEN_KEY=pdf_manager_auth_token
VITE_TOKEN_EXPIRY=86400
```

## Running the Application

1. Start the backend server:
```bash
# From the root directory
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

2. Start the frontend development server:
```bash
# From the frontend directory
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## API Documentation

Once the backend server is running, you can access the API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
