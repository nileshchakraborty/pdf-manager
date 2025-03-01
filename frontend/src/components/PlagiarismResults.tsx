import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Collapse,
  Alert,
  AlertTitle,
  LinearProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { PlagiarismResponse } from '../services/pdfService';

interface PlagiarismResultsProps {
  results: PlagiarismResponse;
}

export default function PlagiarismResults({ results }: PlagiarismResultsProps) {
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  const handleExpandClick = (index: number) => {
    setExpandedItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!results) {
    return (
      <Box>
        <LinearProgress />
        <Typography>Loading results...</Typography>
      </Box>
    );
  }

  if (results.error) {
    return (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        {results.error}
      </Alert>
    );
  }

  const averageSimilarity =
    results.matches.reduce((acc, match) => acc + match.similarity_score, 0) /
    (results.matches.length || 1);

  return (
    <Box>
      <Alert
        severity={results.plagiarized ? 'error' : 'success'}
        sx={{ mb: 2 }}
      >
        <AlertTitle>
          {results.plagiarized
            ? 'Plagiarism Detected'
            : 'No Plagiarism Detected'}
        </AlertTitle>
        {results.matches.length > 0 && (
          <>
            <Typography>Total matches: {results.matches.length}</Typography>
            <Typography>
              Average similarity: {(averageSimilarity * 100).toFixed(1)}%
            </Typography>
          </>
        )}
      </Alert>

      {results.matches.map((match, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 1,
              }}
            >
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Match {index + 1} - {(match.similarity_score * 100).toFixed(1)}% Similar
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => handleCopyText(match.matched_text)}
                >
                  <ContentCopyIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleExpandClick(index)}
                  sx={{
                    transform: expandedItems.includes(index)
                      ? 'rotate(180deg)'
                      : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Box>
            </Box>

            <Typography variant="body1" gutterBottom>
              {match.matched_text}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Source: {match.source_url}
            </Typography>

            <Collapse in={expandedItems.includes(index)} timeout="auto">
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Additional Details:
                </Typography>
                <Typography variant="body2" component="div">
                  Similarity Score: {(match.similarity_score * 100).toFixed(1)}%
                </Typography>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
} 