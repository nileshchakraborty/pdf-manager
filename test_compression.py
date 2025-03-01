import requests
import os

def login():
    """Log in and get access token."""
    login_url = 'http://localhost:8000/api/v1/auth/token'
    form_data = {
        'username': 'testuser',
        'password': 'secret'  # This matches the hardcoded password in auth.py
    }
    
    response = requests.post(login_url, data=form_data)
    if response.status_code == 200:
        return response.json().get('access_token')
    else:
        print(f"Login failed: {response.status_code}")
        print(response.text)
        return None

def test_compression():
    # First, get the access token
    access_token = login()
    if not access_token:
        print("Failed to authenticate. Cannot proceed with compression test.")
        return
    
    # URL for the compression endpoint
    url = 'http://localhost:8000/api/v1/pdf/compress'
    
    # Set up headers with authentication
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    # Open the test PDF file
    with open('test.pdf', 'rb') as f:
        # Create the files dictionary for the request
        files = {'file': ('test.pdf', f, 'application/pdf')}
        
        # Try different compression levels
        for level in range(1, 5):
            print(f"\nTesting compression level {level}...")
            f.seek(0)  # Reset file pointer for each iteration
            
            # Make the request
            response = requests.post(
                url,
                files=files,
                params={'compression_level': level},
                headers=headers
            )
            
            if response.status_code == 200:
                # Save the compressed file
                output_file = f'compressed_level_{level}.pdf'
                with open(output_file, 'wb') as out:
                    out.write(response.content)
                
                # Get file sizes
                original_size = os.path.getsize('test.pdf')
                compressed_size = os.path.getsize(output_file)
                
                print(f"Original size: {original_size / 1024:.2f}KB")
                print(f"Compressed size: {compressed_size / 1024:.2f}KB")
                print(f"Compression ratio: {compressed_size / original_size:.2%}")
            else:
                print(f"Error: {response.status_code}")
                print(response.text)

if __name__ == '__main__':
    test_compression()