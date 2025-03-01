import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Paper, Typography, Box } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  multiple?: boolean;
  accept?: Record<string, string[]>;
}

export default function FileUpload({
  onFileSelect,
  multiple = false,
  accept = {
    'application/pdf': ['.pdf'],
  },
}: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    accept,
  });

  return (
    <Paper
      {...getRootProps()}
      elevation={0}
      sx={{
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'grey.300',
        borderRadius: 2,
        p: 3,
        textAlign: 'center',
        cursor: 'pointer',
        bgcolor: isDragActive ? 'action.hover' : 'background.paper',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <input {...getInputProps()} />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <CloudUploadIcon
          sx={{
            fontSize: 48,
            color: isDragActive ? 'primary.main' : 'action.active',
          }}
        />
        <Typography variant="h6" color={isDragActive ? 'primary.main' : 'text.primary'}>
          {isDragActive ? 'Drop the files here' : 'Drag and drop files here'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          or click to select files
        </Typography>
      </Box>
    </Paper>
  );
}
