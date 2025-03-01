from dataclasses import dataclass
from typing import List, Optional

@dataclass
class PlagiarismMatch:
    text: str
    source: str
    line_number: int
    source_line_number: int
    similarity_score: float

@dataclass
class PlagiarismResult:
    plagiarized: bool
    matches: List[PlagiarismMatch]
    error: Optional[str] = None 