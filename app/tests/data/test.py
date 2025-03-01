from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import os

def create_test_pdf(output_path):
    """Create a test PDF with known content."""
    c = canvas.Canvas(output_path, pagesize=letter)
    
    # First page
    c.setFont("Helvetica", 12)
    c.drawString(100, 750, "This is a test PDF document")
    c.drawString(100, 700, "Line 1: Sample text for testing")
    c.drawString(100, 650, "Line 2: Text to be highlighted")
    c.drawString(100, 600, "Line 3: Text to be deleted")
    
    # Add some shapes
    c.rect(100, 500, 200, 50, fill=0)  # Rectangle
    c.circle(150, 400, 30, fill=0)     # Circle
    
    # Second page
    c.showPage()
    c.setFont("Helvetica", 12)
    c.drawString(100, 750, "This is page 2")
    c.drawString(100, 700, "More sample text")
    
    c.save()

if __name__ == "__main__":
    # Create test data directory if it doesn't exist
    os.makedirs("app/tests/data", exist_ok=True)
    
    # Create test PDF
    create_test_pdf("app/tests/data/test.pdf") 