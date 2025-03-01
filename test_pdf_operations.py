import requests
import os
import json
from test_compression import login
from test_pdf import create_test_pdf

def test_edit_pdf():
    """Test PDF editing functionality."""
    print("\nTesting PDF editing...")
    
    # Create test PDF if it doesn't exist
    if not os.path.exists('test.pdf'):
        create_test_pdf()
    
    # Get access token
    access_token = login()
    if not access_token:
        print("Failed to authenticate. Cannot proceed with edit test.")
        return
    
    # URL for the edit endpoint
    url = 'http://localhost:8000/api/v1/pdf/edit'
    
    # Set up headers with authentication
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    # Open the test PDF file
    with open('test.pdf', 'rb') as f:
        # Create the files dictionary for the request
        files = {'file': ('test.pdf', f, 'application/pdf')}
        
        # Define edit operations
        operations = [
            {
                'type': 'text',
                'text': 'Added text during testing',
                'x': 100,
                'y': 100,
                'page': 0
            }
        ]
        
        # Make the request
        response = requests.post(
            url,
            files=files,
            data={'operations': json.dumps(operations)},  # Convert to JSON string
            headers=headers
        )
        
        if response.status_code == 200:
            # Save the edited file
            with open('edited.pdf', 'wb') as out:
                out.write(response.content)
            print(f"PDF edited successfully. Saved as 'edited.pdf'")
        else:
            print(f"Error: {response.status_code}")
            print(response.text)

def test_merge_pdfs():
    """Test PDF merging functionality."""
    print("\nTesting PDF merging...")
    
    # Get access token
    access_token = login()
    if not access_token:
        print("Failed to authenticate. Cannot proceed with merge test.")
        return
    
    # Create test PDFs for merging
    create_test_pdf()  # Creates test.pdf
    os.rename('test.pdf', 'test1.pdf')
    create_test_pdf()  # Creates test.pdf again
    os.rename('test.pdf', 'test2.pdf')
    
    # URL for the merge endpoint
    base_url = 'http://localhost:8000/api/v1/pdf/merge'
    
    # Set up headers with authentication
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    # Open both test PDF files
    with open('test1.pdf', 'rb') as f1, open('test2.pdf', 'rb') as f2:
        # Create the files dictionary for the request
        files = [
            ('files', ('test1.pdf', f1, 'application/pdf')),
            ('files', ('test2.pdf', f2, 'application/pdf'))
        ]
        
        # Add merge order as query parameters
        url = f"{base_url}?merge_order=0&merge_order=1"
        
        # Make the request
        response = requests.post(
            url,
            files=files,
            headers=headers
        )
        
        if response.status_code == 200:
            # Save the merged file
            with open('merged.pdf', 'wb') as out:
                out.write(response.content)
            print(f"PDFs merged successfully. Saved as 'merged.pdf'")
            
            # Print file sizes
            size1 = os.path.getsize('test1.pdf')
            size2 = os.path.getsize('test2.pdf')
            merged_size = os.path.getsize('merged.pdf')
            print(f"File 1 size: {size1 / 1024:.2f}KB")
            print(f"File 2 size: {size2 / 1024:.2f}KB")
            print(f"Merged file size: {merged_size / 1024:.2f}KB")
        else:
            print(f"Error: {response.status_code}")
            print(response.text)

def test_export_pdf():
    """Test PDF export functionality."""
    print("\nTesting PDF export...")
    
    # Create test PDF if it doesn't exist
    if not os.path.exists('test.pdf'):
        create_test_pdf()
    
    # Get access token
    access_token = login()
    if not access_token:
        print("Failed to authenticate. Cannot proceed with export test.")
        return
    
    # URL for the export endpoint
    url = 'http://localhost:8000/api/v1/pdf/export'
    
    # Set up headers with authentication
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    # Test different export formats
    formats = ['xlsx', 'png', 'jpg']
    
    for format in formats:
        print(f"\nTesting export to {format}...")
        # Open the test PDF file
        with open('test.pdf', 'rb') as f:
            # Create the files dictionary for the request
            files = {'file': ('test.pdf', f, 'application/pdf')}
            
            # Make the request
            response = requests.post(
                url,
                files=files,
                params={'export_format': format},  # Use correct parameter name
                headers=headers
            )
            
            if response.status_code == 200:
                # Save the exported file
                output_file = f'exported.{format}'
                with open(output_file, 'wb') as out:
                    out.write(response.content)
                print(f"PDF exported successfully. Saved as '{output_file}'")
            else:
                print(f"Error: {response.status_code}")
                print(response.text)

def create_test_pdf():
    """Create a test PDF file with sample text."""
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    
    # Sample text that includes some potentially matching content
    text = """
    This is a sample PDF document created for testing purposes.
    It contains some text that might be found in other sources.
    
    The following paragraph is from a common source:
    Artificial intelligence (AI) is intelligence demonstrated by machines, 
    as opposed to the natural intelligence displayed by animals and humans.
    AI research has been defined as the field of study of intelligent agents, 
    which refers to any system that perceives its environment and takes actions 
    that maximize its chance of achieving its goals.
    
    The term "artificial intelligence" was first coined by John McCarthy in 1956
    during the Dartmouth Conference, where the discipline of AI was born.
    """
    
    c = canvas.Canvas("test.pdf", pagesize=letter)
    y = 750  # Starting y position
    for line in text.split('\n'):
        if line.strip():
            c.drawString(50, y, line.strip())
            y -= 15
    c.save()

def test_plagiarism_check():
    """Test PDF plagiarism detection."""
    print("\nTesting PDF plagiarism detection...")
    
    # Check if test file exists
    if not os.path.exists("test.pdf"):
        print("Error: test.pdf not found")
        return
        
    try:
        # Get access token
        token = get_access_token()
        if not token:
            print("Error: Could not get access token")
            return
            
        # Send request
        files = {"file": open("test.pdf", "rb")}
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{BASE_URL}/api/v1/pdf/check-plagiarism",
            files=files,
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"Plagiarism check successful.")
            print(f"Overall similarity: {result['overall_similarity']:.2%}")
            print("\nMatched sources:")
            for match in result["matches"]:
                print(f"- {match['source']}: {match['similarity']:.2%} similar")
                print(f"  Preview: {match['text']}\n")
        else:
            print(f"Error: {response.status_code}")
            print(response.json())
            
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        if "files" in locals():
            files["file"].close()

def test_view_pdf():
    """Test PDF viewing functionality."""
    print("\nTesting PDF viewing...")
    
    # Create test PDF if it doesn't exist
    if not os.path.exists('test.pdf'):
        create_test_pdf()
    
    # Get access token
    access_token = login()
    if not access_token:
        print("Failed to authenticate. Cannot proceed with view test.")
        return
    
    # URL for the view endpoint
    url = 'http://localhost:8000/api/v1/pdf/view'
    
    # Set up headers with authentication
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    # Open the test PDF file
    with open('test.pdf', 'rb') as f:
        # Create the files dictionary for the request
        files = {'file': ('test.pdf', f, 'application/pdf')}
        
        # Make the request
        response = requests.post(
            url,
            files=files,
            headers=headers
        )
        
        if response.status_code == 200:
            # Save the rendered file
            with open('rendered.html', 'wb') as out:
                out.write(response.content)
            print(f"PDF rendered successfully. Saved as 'rendered.html'")
        else:
            print(f"Error: {response.status_code}")
            print(response.text)

if __name__ == '__main__':
    test_edit_pdf()
    test_merge_pdfs()
    test_export_pdf()
    test_plagiarism_check()
    test_view_pdf() 