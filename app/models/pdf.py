from typing import List
from pydantic import BaseModel

class KnownSource(BaseModel):
    text: str
    source: str

class PlagiarismMatch(BaseModel):
    text: str
    source: str
    similarity: float
    threshold_used: float = 0.8
    source_type: str = "text"
    text_length: int

class PlagiarismResponse(BaseModel):
    matches: List[PlagiarismMatch]
    overall_similarity: float 