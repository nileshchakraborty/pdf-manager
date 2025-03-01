from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import os

def create_sample_pdfs():
    # Create uploads directory if it doesn't exist
    uploads_dir = "uploads"
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)

    # 1. Create a text-heavy PDF for compression and plagiarism testing
    doc = SimpleDocTemplate(
        os.path.join(uploads_dir, "sample_text.pdf"),
        pagesize=letter
    )
    styles = getSampleStyleSheet()
    story = []

    # Add title
    story.append(Paragraph("Sample Text Document", styles['Heading1']))
    story.append(Spacer(1, 12))

    # Add paragraphs of text
    lorem_ipsum = """
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
    incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
    exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
    """
    
    for i in range(200):
        story.append(Paragraph(f"Section {i+1}", styles['Heading2']))
        story.append(Paragraph(lorem_ipsum * 3, styles['Normal']))
        story.append(Spacer(1, 12))

    doc.build(story)

    # 2. Create a PDF with images for testing compression
    doc = SimpleDocTemplate(
        os.path.join(uploads_dir, "sample_images.pdf"),
        pagesize=A4
    )
    story = []

    # Add title
    story.append(Paragraph("Sample Document with Images", styles['Heading1']))
    story.append(Spacer(1, 12))

    # Create and add some colored shapes as images
    c = canvas.Canvas(os.path.join(uploads_dir, "temp.pdf"))
    for i in range(5):
        c.setFillColor(colors.red if i % 2 == 0 else colors.blue)
        c.rect(100, 100 + i*100, 300, 80, fill=True)
        c.setFillColor(colors.black)
        c.drawString(150, 140 + i*100, f"Sample Shape {i+1}")
    c.save()

    # Add some text and the image
    story.append(Paragraph("This document contains various images and shapes for testing compression.", styles['Normal']))
    story.append(Spacer(1, 12))
    
    doc.build(story)

    # 3. Create a multi-page PDF for testing merge and edit features
    doc = SimpleDocTemplate(
        os.path.join(uploads_dir, "sample_multipage.pdf"),
        pagesize=letter
    )
    story = []

    # Create multiple pages with different content
    for i in range(5):
        story.append(Paragraph(f"Page {i+1}", styles['Heading1']))
        story.append(Spacer(1, 12))
        story.append(Paragraph(f"This is page {i+1} of the multi-page document.", styles['Normal']))
        story.append(Paragraph(lorem_ipsum, styles['Normal']))
        story.append(Spacer(1, 12))
        
        # Add some unique content to each page
        if i % 2 == 0:
            story.append(Paragraph("This page contains some special content.", styles['Heading2']))
        else:
            story.append(Paragraph("This page has different content.", styles['Heading2']))

    doc.build(story)

    print("Test PDFs created successfully in the 'uploads' directory:")
    print("1. sample_text.pdf - Text-heavy document for compression and plagiarism testing")
    print("2. sample_images.pdf - Document with images for testing compression")
    print("3. sample_multipage.pdf - Multi-page document for testing merge and edit features")

if __name__ == "__main__":
    create_sample_pdfs() 