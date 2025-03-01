from dataclasses import dataclass
from typing import List, BinaryIO
import PyPDF2
from difflib import SequenceMatcher
import re

from app.models.plagiarism import PlagiarismMatch, PlagiarismResult

@dataclass
class KnownSource:
    text: str
    source: str
    line_number: int

class PlagiarismService:
    def __init__(self):
        self.known_sources: List[KnownSource] = []
        self.similarity_threshold = 0.8
        self.min_length = 10

    def normalize_text(self, text: str) -> str:
        """Normalize text for comparison by removing extra whitespace and converting to lowercase."""
        text = re.sub(r'\s+', ' ', text)
        return text.strip().lower()

    def calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity ratio between two texts using SequenceMatcher."""
        if not text1 or not text2:
            return 0.0
        
        text1 = self.normalize_text(text1)
        text2 = self.normalize_text(text2)
        
        if len(text1) < self.min_length or len(text2) < self.min_length:
            return 0.0
        
        return SequenceMatcher(None, text1, text2).ratio()

    def extract_text_from_pdf(self, pdf_file: BinaryIO) -> List[str]:
        """Extract text from PDF file and return as list of lines."""
        try:
            # Try to read the first few bytes to check if it's a valid PDF
            header = pdf_file.read(5)
            pdf_file.seek(0)  # Reset file pointer
            
            if not header.startswith(b'%PDF-'):
                raise Exception("Invalid PDF file: File does not start with PDF header")
            
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            lines = []
            
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    lines.extend(text.split('\n'))
            
            return [line.strip() for line in lines if line.strip()]
        except Exception as e:
            raise Exception(f"Invalid PDF file: {str(e)}")

    def check_plagiarism(self, pdf_file: BinaryIO) -> PlagiarismResult:
        """Check PDF content for plagiarism against known sources."""
        try:
            lines = self.extract_text_from_pdf(pdf_file)
            matches: List[PlagiarismMatch] = []
            
            for i, line in enumerate(lines, start=1):
                for source in self.known_sources:
                    similarity = self.calculate_similarity(line, source.text)
                    
                    if similarity >= self.similarity_threshold:
                        matches.append(PlagiarismMatch(
                            text=line,
                            source=source.source,
                            line_number=i,
                            source_line_number=source.line_number,
                            similarity_score=similarity
                        ))
                    elif similarity >= 0.3:  # Check for partial matches
                        # Split into smaller chunks and check for similarity
                        line_words = line.split()
                        source_words = source.text.split()
                        
                        for j in range(len(line_words) - 2):
                            chunk = ' '.join(line_words[j:j+3])
                            for k in range(len(source_words) - 2):
                                source_chunk = ' '.join(source_words[k:k+3])
                                chunk_similarity = self.calculate_similarity(chunk, source_chunk)
                                
                                if chunk_similarity >= self.similarity_threshold:
                                    matches.append(PlagiarismMatch(
                                        text=line,
                                        source=source.source,
                                        line_number=i,
                                        source_line_number=source.line_number,
                                        similarity_score=similarity
                                    ))
                                    break
            
            # Sort matches by similarity score in descending order
            matches.sort(key=lambda x: x.similarity_score, reverse=True)
            
            # Remove duplicate matches for the same line
            unique_matches = []
            seen_lines = set()
            
            for match in matches:
                if match.line_number not in seen_lines:
                    unique_matches.append(match)
                    seen_lines.add(match.line_number)
            
            return PlagiarismResult(
                plagiarized=len(unique_matches) > 0,
                matches=unique_matches
            )
            
        except Exception as e:
            raise Exception(f"Invalid PDF file: {str(e)}") 