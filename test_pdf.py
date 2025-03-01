from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Image
from PIL import Image as PILImage
import numpy as np

def create_test_image(filename, size=(800, 600)):
    """Create a test image with random colors."""
    # Create a random colorful image
    img_array = np.random.randint(0, 255, (size[1], size[0], 3), dtype=np.uint8)
    img = PILImage.fromarray(img_array)
    img.save(filename)
    return filename

def create_test_pdf():
    # Create a test image first
    image_file = create_test_image('test_image.png')
    
    # Create the PDF
    c = canvas.Canvas('test.pdf', pagesize=letter)
    
    # Add some text
    c.setFont("Helvetica", 24)
    c.drawString(100, 750, 'Test PDF for compression')
    
    c.setFont("Helvetica", 12)
    c.drawString(100, 700, 'This is a sample PDF file to test the compression functionality.')
    c.drawString(100, 680, 'It includes text and images to make it more realistic.')
    
    # Add multiple copies of the image to increase file size
    for i in range(3):
        y_position = 500 - (i * 200)
        c.drawImage(image_file, 100, y_position, width=400, height=150)
        
    # Add some more text
    c.setFont("Helvetica", 10)
    for i in range(20):
        y_position = 450 - (i * 20)
        if y_position > 50:  # Keep text within page bounds
            c.drawString(100, y_position, f'Line {i+1}: This is some sample text to increase the file size.')
    
    c.save()

if __name__ == '__main__':
    create_test_pdf()
    print("Test PDF file created successfully.") 