import { useState } from 'react';
import { Dialog, DialogContent, Button, IconButton, Box, Typography, Paper } from '@mui/material';
import { Close, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { Document, Page, pdfjs } from 'react-pdf';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  open: boolean;
  onClose: () => void;
  file: File;
}

export default function PDFViewer({ open, onClose, file }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error);
    setLoading(false);
  }

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return Math.min(Math.max(1, newPageNumber), numPages || 1);
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth sx={{ borderRadius: 2 }}>
      <Box sx={{ position: 'relative' }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            zIndex: 1,
          }}
          size="small"
        >
          <Close />
        </IconButton>

        <DialogContent sx={{ p: 0 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minHeight: '80vh',
            }}
          >
            {/* Navigation Controls */}
            <Paper
              elevation={1}
              sx={{
                position: 'sticky',
                top: 0,
                width: '100%',
                bgcolor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
                p: 2,
                zIndex: 1,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  maxWidth: 500,
                  mx: 'auto',
                }}
              >
                <Button
                  onClick={() => changePage(-1)}
                  disabled={pageNumber <= 1}
                  startIcon={<NavigateBefore />}
                  variant="outlined"
                  size="small"
                >
                  Previous
                </Button>
                <Typography color="text.secondary" sx={{ mx: 2 }}>
                  Page {pageNumber} of {numPages || '?'}
                </Typography>
                <Button
                  onClick={() => changePage(1)}
                  disabled={pageNumber >= (numPages || 1)}
                  endIcon={<NavigateNext />}
                  variant="outlined"
                  size="small"
                >
                  Next
                </Button>
              </Box>
            </Paper>

            {/* PDF Content */}
            <Box
              sx={{
                flexGrow: 1,
                width: '100%',
                overflow: 'auto',
                p: 2,
              }}
            >
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <Typography color="text.secondary">Loading PDF...</Typography>
                </Box>
              )}

              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <Typography>Loading page...</Typography>
                  </Box>
                }
              >
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ boxShadow: 3 }}>
                    <Page
                      pageNumber={pageNumber}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading={null}
                      scale={1.2}
                    />
                  </Box>
                </Box>
              </Document>
            </Box>

            {/* File Info Footer */}
            <Paper
              elevation={1}
              sx={{
                position: 'sticky',
                bottom: 0,
                width: '100%',
                bgcolor: 'grey.50',
                borderTop: 1,
                borderColor: 'divider',
                p: 1.5,
              }}
            >
              <Typography color="text.secondary" variant="body2" align="center">
                {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </Typography>
            </Paper>
          </Box>
        </DialogContent>
      </Box>
    </Dialog>
  );
}
