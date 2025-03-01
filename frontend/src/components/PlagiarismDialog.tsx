import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
  LinearProgress,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FileUpload from './FileUpload';

interface PlagiarismMatch {
  text: string;
  similarity: number;
  source: string;
}

interface PlagiarismResult {
  similarity: number;
  matches: PlagiarismMatch[];
}

interface PlagiarismDialogProps {
  open: boolean;
  onClose: () => void;
  onCheck: (file: File) => Promise<PlagiarismResult>;
}

export default function PlagiarismDialog({ open, onClose, onCheck }: PlagiarismDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<PlagiarismResult | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
  };

  const handleCheck = async () => {
    if (!file) return;

    setChecking(true);
    try {
      const plagiarismResult = await onCheck(file);
      setResult(plagiarismResult);
    } catch (error) {
      console.error('Error checking plagiarism:', error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Check Plagiarism
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <FileUpload onFileSelect={handleFileSelect} />
        </Box>

        {checking && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress />
            <Typography sx={{ mt: 1 }} align="center" color="text.secondary">
              Checking for plagiarism...
            </Typography>
          </Box>
        )}

        {result && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Results
            </Typography>
            <Typography color="text.secondary" paragraph>
              Overall similarity: {(result.similarity * 100).toFixed(1)}%
            </Typography>

            {result.matches.length > 0 ? (
              <List>
                {result.matches.map((match, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={match.text}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.secondary">
                            Similarity: {(match.similarity * 100).toFixed(1)}%
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2" color="text.secondary">
                            Source: {match.source}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="success.main">No significant matches found.</Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={handleCheck} variant="contained" disabled={!file || checking}>
          Check
        </Button>
      </DialogActions>
    </Dialog>
  );
}
