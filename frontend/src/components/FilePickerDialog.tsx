import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { IconUpload } from '@tabler/icons-react';

interface FilePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (files: File[]) => void;
  multiple?: boolean;
}

export default function FilePickerDialog({
  open,
  onClose,
  onSelect,
  multiple = false,
}: FilePickerDialogProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      onSelect(Array.from(files));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Select PDF File{multiple ? 's' : ''}</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            border: '2px dashed #ccc',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'action.hover',
            },
          }}
          component="label"
        >
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            multiple={multiple}
          />
          <IconUpload size={48} />
          <Typography variant="h6" gutterBottom>
            Drop PDF file{multiple ? 's' : ''} here or click to select
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
