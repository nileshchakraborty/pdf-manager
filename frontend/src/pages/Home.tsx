import React, { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  Divider,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Description as FileIcon,
  CompressOutlined as CompressIcon,
  MergeOutlined as MergeIcon,
  EditOutlined as EditIcon,
} from '@mui/icons-material';
import FilePickerDialog from '../components/FilePickerDialog';
import { pdfService, CompressionLevel } from '../services/pdfService';

export default function Home() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
      handleUpload(files[0]);
    }
    setIsDialogOpen(false);
  };

  const handleAction = async (action: 'compress' | 'merge' | 'edit') => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    try {
      let result: Blob;
      switch (action) {
        case 'compress':
          result = await pdfService.compress(selectedFile, CompressionLevel.MEDIUM);
          break;
        case 'merge':
          result = await pdfService.merge([selectedFile]);
          break;
        case 'edit':
          result = await pdfService.edit(selectedFile, []);
          break;
      }
      
      const url = URL.createObjectURL(result);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${action}-${selectedFile.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess('File processed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      // Add your upload logic here
      setSuccess('File uploaded successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom align="center" color="primary">
          PDF Manager
        </Typography>
        <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary">
          Professional PDF tools for all your document needs
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <FileIcon sx={{ fontSize: 48 }} />
            <Typography variant="h6" gutterBottom>
              Drop PDF file here or click to select
            </Typography>
            <Button variant="contained" color="primary" onClick={() => setIsDialogOpen(true)}>
              Select PDF File
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Divider>
            <Typography variant="h5">PDF Tools</Typography>
          </Divider>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <CompressIcon />
              <Typography variant="h6">Compress PDF</Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Optimize your PDF file size while maintaining quality
            </Typography>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              disabled={!selectedFile || isProcessing}
              onClick={() => handleAction('compress')}
            >
              Compress PDF
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <MergeIcon />
              <Typography variant="h6">Merge PDFs</Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Combine multiple PDF files into a single document
            </Typography>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              disabled={!selectedFile || isProcessing}
              onClick={() => handleAction('merge')}
            >
              Merge PDFs
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <EditIcon />
              <Typography variant="h6">Edit PDF</Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Add text, images, or make other modifications to your PDF
            </Typography>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              disabled={!selectedFile || isProcessing}
              onClick={() => handleAction('edit')}
            >
              Edit PDF
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <FilePickerDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSelect={handleFileSelect}
        multiple={false}
      />

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
}
