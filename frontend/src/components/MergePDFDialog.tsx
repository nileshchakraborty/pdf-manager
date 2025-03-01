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
  ListItemSecondaryAction,
  Box,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUpload from './FileUpload';

interface MergePDFDialogProps {
  open: boolean;
  onClose: () => void;
  onMerge: (files: File[]) => void;
}

export default function MergePDFDialog({ open, onClose, onMerge }: MergePDFDialogProps) {
  const [files, setFiles] = useState<File[]>([]);

  const handleFileSelect = (file: File) => {
    setFiles(prevFiles => [...prevFiles, file]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleMerge = () => {
    onMerge(files);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Merge PDFs
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
        <Box sx={{ mb: 2 }}>
          <FileUpload onFileSelect={handleFileSelect} multiple={true} />
        </Box>
        {files.length > 0 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Selected Files ({files.length})
            </Typography>
            <List>
              {files.map((file, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={file.name}
                    secondary={`${(file.size / 1024).toFixed(2)} KB`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleRemoveFile(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleMerge} variant="contained" disabled={files.length < 2}>
          Merge
        </Button>
      </DialogActions>
    </Dialog>
  );
}
