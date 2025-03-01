import React, { useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Stack,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
  TextField,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  IconFileText,
  IconDownload,
  IconStack2,
  IconEdit,
  IconSearch,
  IconFileExport,
  IconFileImport,
  IconEye,
  IconLogout,
  IconUser,
  IconPlus,
  IconHighlight,
  IconTrash,
  IconPencil,
  IconX,
  IconTextPlus,
  IconArrowUp,
  IconArrowDown,
} from '@tabler/icons-react';
import FilePickerDialog from '../components/FilePickerDialog';
import { pdfService, CompressionLevel, PlagiarismResponse } from '../services/pdfService';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';

interface ServiceCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: 'compress' | 'merge' | 'edit' | 'plagiarism' | 'export' | 'convert' | 'view';
  disabled?: boolean;
}

const compressionMarks = [
  { value: CompressionLevel.LOW, label: 'Low' },
  { value: CompressionLevel.MEDIUM, label: 'Medium' },
  { value: CompressionLevel.HIGH, label: 'High' },
  { value: CompressionLevel.MAXIMUM, label: 'Maximum' },
];

// Add supported formats constant
const SUPPORTED_FORMATS = {
  // Office Documents
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'application/vnd.ms-powerpoint': 'PPT',
  
  // Text and HTML
  'text/plain': 'TXT',
  'text/html': 'HTML',
  'application/html': 'HTML',
  'text/htm': 'HTML',
  
  // Images
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/tiff': 'TIFF'
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);
  const [isCompressionDialogOpen, setIsCompressionDialogOpen] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>(CompressionLevel.MEDIUM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<ServiceCard['action'] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [plagiarismResults, setPlagiarismResults] = useState<PlagiarismResponse | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editOperations, setEditOperations] = useState<Array<{
    type: 'text' | 'image' | 'highlight' | 'delete';
    content?: string;
    position?: { x: number; y: number };
    page?: number;
  }>>([]);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<string>('docx');
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [convertFormat, setConvertFormat] = useState<string>('docx');
  const [isViewerDialogOpen, setIsViewerDialogOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isTextEditorOpen, setIsTextEditorOpen] = useState(false);
  const [currentTextOperation, setCurrentTextOperation] = useState<{
    content: string;
    fontSize: number;
    fontColor: string;
    position: { x: number; y: number };
    page: number;
  }>({
    content: '',
    fontSize: 12,
    fontColor: '#000000',
    position: { x: 100, y: 100 },
    page: 1
  });
  const [isHighlightEditorOpen, setIsHighlightEditorOpen] = useState(false);
  const [isDeleteEditorOpen, setIsDeleteEditorOpen] = useState(false);
  const [currentHighlightOperation, setCurrentHighlightOperation] = useState<{
    text: string;
    color: string;
    opacity: number;
    page: number;
  }>({
    text: '',
    color: '#ffeb3b',
    opacity: 0.5,
    page: 1
  });
  const [currentDeleteOperation, setCurrentDeleteOperation] = useState<{
    page: number;
    region?: { x: number; y: number; width: number; height: number };
  }>({
    page: 1
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [fileIds] = useState(() => 
    Array.from({ length: 100 }, () => Math.random().toString(36).substring(2, 11))
  );

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Update theme based on system preference and time
  React.useEffect(() => {
    // Check system theme
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      setTheme(e.matches ? 'dark' : 'light');
    };
    
    darkModeMediaQuery.addEventListener('change', updateTheme);
    updateTheme(darkModeMediaQuery);

    // Update time of day
    const updateTimeOfDay = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setTimeOfDay('morning');
      else if (hour >= 12 && hour < 17) setTimeOfDay('afternoon');
      else if (hour >= 17 && hour < 20) setTimeOfDay('evening');
      else setTimeOfDay('night');
    };

    updateTimeOfDay();
    const interval = setInterval(updateTimeOfDay, 60000); // Update every minute

    return () => {
      darkModeMediaQuery.removeEventListener('change', updateTheme);
      clearInterval(interval);
    };
  }, []);

  // Get background color based on theme and time
  const getBackgroundColor = () => {
    if (theme === 'dark') return '#1a1a1a';
    
    switch (timeOfDay) {
      case 'morning': return '#f8f9fa';
      case 'afternoon': return '#f5f5f5';
      case 'evening': return '#f0f0f0';
      case 'night': return '#e8e8e8';
      default: return '#f8f9fa';
    }
  };

  const handleFileSelect = (files: File[]) => {
    if (currentAction === 'merge') {
      setSelectedFiles(files);
    } else {
      setSelectedFile(files[0]);
    }
    setIsFilePickerOpen(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      handleFileSelect(filesArray);
    }
  };

  const handleActionClick = (action: ServiceCard['action']) => {
    setCurrentAction(action);
    
    if ((action === 'merge' && selectedFiles.length > 0) || (action !== 'merge' && selectedFile)) {
      switch (action) {
        case 'compress':
          setIsCompressionDialogOpen(true);
          break;
        case 'merge':
          handleProcessFile();
          break;
        case 'edit':
          setIsEditDialogOpen(true);
          break;
        case 'export':
          setIsExportDialogOpen(true);
          break;
        case 'convert':
          setIsConvertDialogOpen(true);
          break;
        case 'view':
          handleViewPdf();
          break;
        case 'plagiarism':
          handleProcessFile();
          break;
      }
    } else {
      setIsFilePickerOpen(true);
    }
  };

  const handleCompressionLevelChange = (_event: Event, value: number | number[]) => {
    setCompressionLevel(value as CompressionLevel);
  };

  const handleProcessFile = async () => {
    try {
      setIsProcessing(true);
      if (!selectedFile && !selectedFiles.length) {
        throw new Error('No file selected');
      }

      switch (currentAction) {
        case 'compress':
          const compressedResult = await pdfService.compress(selectedFile!, compressionLevel);
          downloadBlob(compressedResult, 'compressed.pdf');
          break;
        case 'merge':
          if (selectedFiles.length < 2) {
            throw new Error('Please select at least 2 PDF files to merge');
          }
          const mergedResult = await pdfService.merge(selectedFiles);
          downloadBlob(mergedResult, 'merged.pdf');
          break;
        case 'edit':
          const editedResult = await pdfService.edit(selectedFile!, editOperations);
          downloadBlob(editedResult, 'edited.pdf');
          break;
        case 'plagiarism':
          const plagiarismResult = await pdfService.checkPlagiarism(selectedFile!);
          setPlagiarismResults(plagiarismResult);
          setSuccess('Plagiarism check completed');
          return;
        case 'convert':
          const convertedResult = await pdfService.convert(selectedFile!);
          downloadBlob(convertedResult, 'converted.pdf');
          break;
        case 'export':
          const exportedResult = await pdfService.export(selectedFile!, exportFormat);
          downloadBlob(exportedResult, `${selectedFile!.name}.${exportFormat}`);
          break;
        default:
          throw new Error('Invalid action');
      }

      setSuccess('File processed successfully');
    } catch (err: any) {
      const errorMessage = err.message || 
        (err.response?.data?.detail) || 
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        'Failed to process PDF';
      
      setError(errorMessage);
    } finally {
      if (currentAction !== 'merge') {
        setSelectedFile(null);
      }
      setIsCompressionDialogOpen(false);
      setIsEditDialogOpen(false);
      setIsExportDialogOpen(false);
      setIsConvertDialogOpen(false);
      setIsProcessing(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const pdfServices: ServiceCard[] = [
    {
      title: 'Compress PDF',
      description: 'Reduce PDF file size while maintaining quality',
      icon: <IconDownload size={24} />,
      action: 'compress',
    },
    {
      title: 'Edit PDF',
      description: 'Add text, highlights, or delete content',
      icon: <IconEdit size={24} />,
      action: 'edit',
    },
    {
      title: 'Check Plagiarism',
      description: 'Detect potential plagiarism in your document',
      icon: <IconSearch size={24} />,
      action: 'plagiarism',
    },
    {
      title: 'Export PDF',
      description: 'Convert PDF to other formats',
      icon: <IconFileExport size={24} />,
      action: 'export',
    },
    {
      title: 'View PDF',
      description: 'View PDF in browser',
      icon: <IconEye size={24} />,
      action: 'view',
    },
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      if (acceptedFiles.length > 1) {
        setSelectedFiles(acceptedFiles);
        setCurrentAction('merge');
      } else {
        setSelectedFile(acceptedFiles[0]);
      }
      setSuccess('File(s) uploaded successfully');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: currentAction === 'merge'
  });

  const handleViewPdf = () => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPdfUrl(url);
      setIsViewerDialogOpen(true);
    }
  };

  React.useEffect(() => {
    return () => {
      // Cleanup PDF URL when component unmounts
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleAddText = () => {
    setIsTextEditorOpen(true);
  };

  const handleTextSave = () => {
    setEditOperations([...editOperations, {
      type: 'text',
      content: currentTextOperation.content,
      position: currentTextOperation.position,
      page: currentTextOperation.page,
      fontSize: currentTextOperation.fontSize,
      fontColor: currentTextOperation.fontColor
    }]);
    setIsTextEditorOpen(false);
    setCurrentTextOperation({
      content: '',
      fontSize: 12,
      fontColor: '#000000',
      position: { x: 100, y: 100 },
      page: 1
    });
  };

  const handleEditOperation = (index: number) => {
    const operation = editOperations[index];
    if (operation.type === 'text') {
      setCurrentTextOperation({
        content: operation.content || '',
        fontSize: operation.fontSize || 12,
        fontColor: operation.fontColor || '#000000',
        position: operation.position || { x: 100, y: 100 },
        page: operation.page || 1
      });
      setIsTextEditorOpen(true);
      // Remove the old operation
      const newOperations = [...editOperations];
      newOperations.splice(index, 1);
      setEditOperations(newOperations);
    }
  };

  const handleDeleteOperation = (index: number) => {
    const newOperations = [...editOperations];
    newOperations.splice(index, 1);
    setEditOperations(newOperations);
  };

  const handleAddHighlight = () => {
    setIsHighlightEditorOpen(true);
  };

  const handleHighlightSave = () => {
    setEditOperations([...editOperations, {
      type: 'highlight',
      text: currentHighlightOperation.text,
      color: currentHighlightOperation.color,
      opacity: currentHighlightOperation.opacity,
      page: currentHighlightOperation.page
    }]);
    setIsHighlightEditorOpen(false);
    setCurrentHighlightOperation({
      text: '',
      color: '#ffeb3b',
      opacity: 0.5,
      page: 1
    });
  };

  const handleAddDelete = () => {
    setIsDeleteEditorOpen(true);
  };

  const handleDeleteSave = () => {
    setEditOperations([...editOperations, {
      type: 'delete',
      page: currentDeleteOperation.page,
      region: currentDeleteOperation.region
    }]);
    setIsDeleteEditorOpen(false);
    setCurrentDeleteOperation({
      page: 1
    });
  };

  const handlePreview = async () => {
    if (!selectedFile || editOperations.length === 0) return;
    
    try {
      const previewResult = await pdfService.preview(selectedFile, editOperations);
      const url = URL.createObjectURL(previewResult);
      setPreviewUrl(url);
    } catch (err) {
      setError('Failed to generate preview');
    }
  };

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Update the generateSafeId function to be more reliable
  const generateSafeId = useCallback((file: File, index: number) => {
    return `file-${index}-${file.name.replace(/[^a-zA-Z0-9]/g, '')}`;
  }, []);

  // Update the moveFile function
  const moveFile = useCallback((fromIndex: number, toIndex: number) => {
    setSelectedFiles(prevFiles => {
      const newFiles = [...prevFiles];
      const [movedFile] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, movedFile);
      return newFiles;
    });
  }, []);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  // Update the useDropzone hook for Convert to PDF section
  const {
    getRootProps: getConvertRootProps,
    getInputProps: getConvertInputProps,
    isDragActive: isConvertDragActive
  } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        if (file.type === 'application/pdf') {
          setError('PDF files cannot be converted. Please select a supported format like DOCX, DOC, XLSX, etc.');
          return;
        }
        
        // Special handling for HTML files
        if (file.type === 'text/html' || file.type === 'application/html' || file.name.endsWith('.html') || file.name.endsWith('.htm')) {
          setSelectedFile(file);
          setCurrentAction('convert');
          setSuccess(`Selected ${file.name} for conversion to PDF`);
          return;
        }
        
        if (SUPPORTED_FORMATS[file.type as keyof typeof SUPPORTED_FORMATS]) {
          setSelectedFile(file);
          setCurrentAction('convert');
          setSuccess(`Selected ${file.name} for conversion to PDF`);
        } else {
          setError(`File type "${file.type}" is not supported. Please select a supported file type.`);
        }
      }
    },
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'text/plain': ['.txt'],
      'text/html': ['.html', '.htm'],
      'application/html': ['.html', '.htm'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/tiff': ['.tiff']
    },
    multiple: false
  });

  // Update the useDropzone hook for Merge PDFs section
  const {
    getRootProps: getMergeRootProps,
    getInputProps: getMergeInputProps,
    isDragActive: isMergeDragActive
  } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
        setCurrentAction('merge');
        setSuccess(`Added ${acceptedFiles.length} file(s) for merging`);
      }
    },
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  // Update the file removal handler
  const handleRemoveFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    if (newFiles.length === 0) {
      setCurrentAction(null);
    }
  };

  // Update the clear all handler
  const handleClearFiles = () => {
    setSelectedFiles([]);
    setCurrentAction(null);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      bgcolor: getBackgroundColor(),
      transition: 'background-color 0.3s ease'
    }}>
      {/* Header/AppBar */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{
          bgcolor: theme === 'dark' ? 'grey.900' : 'background.paper',
          borderBottom: 1,
          borderColor: theme === 'dark' ? 'grey.800' : 'grey.200',
        }}
      >
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              color: theme === 'dark' ? 'white' : 'text.primary',
              fontWeight: 600
            }}
          >
            PDF Manager
          </Typography>
          {isAuthenticated && (
            <div>
              <IconButton
                size="large"
                onClick={handleMenu}
                color="inherit"
                sx={{ color: theme === 'dark' ? 'white' : 'text.primary' }}
              >
                <IconUser />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem disabled>
                  <Typography variant="body2">{user?.email}</Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <IconLogout size={18} style={{ marginRight: 8 }} />
                  Logout
                </MenuItem>
              </Menu>
            </div>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        {/* Hero Section */}
        <Box mb={8} textAlign="center">
          <Typography 
            variant="h3" 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              color: theme === 'dark' ? 'white' : 'primary.main',
              mb: 2
            }}
          >
            PDF Manager
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: theme === 'dark' ? 'grey.400' : 'text.secondary',
              maxWidth: '600px',
              mx: 'auto'
            }}
          >
            Professional PDF tools for all your document needs
          </Typography>
        </Box>

        {/* PDF Tools Section */}
        <Box mb={8}>
          <Typography variant="h4" gutterBottom sx={{ 
            color: theme === 'dark' ? 'white' : 'text.primary',
            fontWeight: 600,
            mb: 4
          }}>
            PDF Tools
          </Typography>
          <Paper
            elevation={theme === 'dark' ? 2 : 1}
            sx={{
              p: 4,
              bgcolor: theme === 'dark' ? 'grey.900' : 'background.paper',
              borderRadius: 2,
              boxShadow: theme === 'dark' 
                ? '0 4px 20px rgba(0,0,0,0.4)' 
                : '0 4px 20px rgba(0,0,0,0.1)'
            }}
          >
            <Box
              {...getRootProps()}
              sx={{
                border: '3px dashed',
                borderColor: isDragActive ? 'primary.main' : theme === 'dark' ? 'grey.800' : 'grey.300',
                borderRadius: 3,
                p: 6,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: isDragActive ? (theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'action.hover') : 'transparent',
                transition: 'all 0.2s ease-in-out',
                mb: 4
              }}
            >
              <input {...getInputProps()} />
              <IconFileText size={64} color={isDragActive ? '#1976d2' : theme === 'dark' ? '#fff' : '#666'} />
              <Typography variant="h5" gutterBottom sx={{ 
                mt: 2, 
                fontWeight: 500,
                color: theme === 'dark' ? 'white' : 'text.primary'
              }}>
                {isDragActive ? 'Drop PDFs here' : 'Drop PDF files here or click to select'}
              </Typography>
            </Box>

            <Grid container spacing={4} sx={{ mt: 6 }}>
              {pdfServices.map((service) => (
                <Grid item xs={12} sm={6} lg={4} key={service.title}>
                  <Paper
                    elevation={theme === 'dark' ? 3 : 2}
                    sx={{
                      p: 4,
                      height: '280px',
                      display: 'flex',
                      flexDirection: 'column',
                      bgcolor: theme === 'dark' ? 'grey.800' : 'background.paper',
                      transition: 'all 0.3s ease-in-out',
                      cursor: 'pointer',
                      boxShadow: theme === 'dark'
                        ? '0 4px 12px rgba(0,0,0,0.3)'
                        : '0 4px 12px rgba(0,0,0,0.1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme === 'dark'
                          ? '0 8px 24px rgba(0,0,0,0.4)'
                          : '0 8px 24px rgba(0,0,0,0.15)'
                      }
                    }}
                    onClick={() => handleActionClick(service.action)}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 3,
                      color: theme === 'dark' ? 'white' : 'primary.main'
                    }}>
                      <Box sx={{ 
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'primary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2
                      }}>
                        {React.cloneElement(service.icon as React.ReactElement, { 
                          size: 32,
                          style: { 
                            color: theme === 'dark' ? '#fff' : 'primary.main'
                          }
                        })}
                      </Box>
                      <Typography variant="h5" sx={{ 
                        color: theme === 'dark' ? 'white' : 'text.primary',
                        fontWeight: 600
                      }}>
                        {service.title}
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: theme === 'dark' ? 'grey.400' : 'text.secondary',
                        mb: 3,
                        flexGrow: 1,
                        fontSize: '1.1rem',
                        lineHeight: 1.5
                      }}
                    >
                      {service.description}
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      disabled={!selectedFile || isProcessing}
                      sx={{
                        py: 1.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        borderRadius: 2,
                        boxShadow: theme === 'dark' 
                          ? '0 4px 12px rgba(0,0,0,0.3)' 
                          : '0 4px 12px rgba(0,0,0,0.1)',
                        '&:hover': {
                          boxShadow: theme === 'dark'
                            ? '0 6px 16px rgba(0,0,0,0.4)'
                            : '0 6px 16px rgba(0,0,0,0.15)'
                        }
                      }}
                    >
                      {service.title}
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>

        {/* Convert to PDF Section */}
        <Box mb={8}>
          <Typography variant="h4" gutterBottom sx={{ 
            color: theme === 'dark' ? 'white' : 'text.primary',
            fontWeight: 600,
            mb: 4
          }}>
            Convert to PDF
          </Typography>
          <Paper
            elevation={theme === 'dark' ? 2 : 1}
            sx={{
              p: 4,
              bgcolor: theme === 'dark' ? 'grey.900' : 'background.paper',
              borderRadius: 2,
              boxShadow: theme === 'dark' 
                ? '0 4px 20px rgba(0,0,0,0.4)' 
                : '0 4px 20px rgba(0,0,0,0.1)'
            }}
          >
            <Box
              {...getConvertRootProps()}
              sx={{
                border: '3px dashed',
                borderColor: isConvertDragActive ? 'primary.main' : theme === 'dark' ? 'grey.800' : 'grey.300',
                borderRadius: 3,
                p: 6,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: isConvertDragActive ? (theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'action.hover') : 'transparent',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'action.hover',
                }
              }}
            >
              <input {...getConvertInputProps()} />
              <IconFileImport size={64} color={isConvertDragActive ? '#1976d2' : theme === 'dark' ? '#fff' : '#666'} />
              <Typography variant="h5" gutterBottom sx={{ 
                mt: 2, 
                fontWeight: 500,
                color: theme === 'dark' ? 'white' : 'text.primary'
              }}>
                {isConvertDragActive ? 'Drop file here' : 'Drop file here or click to select'}
              </Typography>
              <Typography variant="body1" sx={{ 
                color: theme === 'dark' ? 'grey.400' : 'text.secondary',
                mt: 2
              }}>
                Convert your documents to PDF format
              </Typography>
              <Typography variant="body2" sx={{ 
                color: theme === 'dark' ? 'grey.500' : 'text.secondary',
                mt: 1
              }}>
                Supported formats: DOCX, DOC, XLSX, XLS, PPTX, PPT, TXT, HTML, HTM, JPG, PNG, TIFF
              </Typography>
              <Typography variant="body2" sx={{ 
                color: 'error.main',
                mt: 1,
                fontWeight: 500
              }}>
                Note: PDF files are not accepted for conversion
              </Typography>
            </Box>

            {selectedFile && currentAction === 'convert' && (
              <Box sx={{ mt: 4 }}>
                <Paper
                  elevation={theme === 'dark' ? 2 : 1}
                  sx={{
                    p: 3,
                    mb: 3,
                    bgcolor: theme === 'dark' ? 'grey.800' : 'grey.50',
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 2
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      flex: 1,
                      minWidth: '200px'
                    }}>
                      <Box sx={{ 
                        p: 2,
                        borderRadius: 1,
                        bgcolor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'primary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <IconFileText size={24} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ 
                          color: theme === 'dark' ? 'white' : 'text.primary',
                          fontWeight: 500,
                          wordBreak: 'break-all'
                        }}>
                          {selectedFile.name}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: theme === 'dark' ? 'grey.400' : 'text.secondary'
                        }}>
                          {SUPPORTED_FORMATS[selectedFile.type as keyof typeof SUPPORTED_FORMATS]} → PDF
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: theme === 'dark' ? 'grey.400' : 'text.secondary',
                          mt: 0.5
                        }}>
                          Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => {
                        setSelectedFile(null);
                        setCurrentAction(null);
                      }}
                      startIcon={<IconFileText size={18} />}
                      sx={{ minWidth: '120px' }}
                    >
                      Remove
                    </Button>
                  </Box>
                </Paper>

                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleProcessFile}
                  disabled={isProcessing}
                  fullWidth
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    boxShadow: theme === 'dark' 
                      ? '0 4px 12px rgba(0,0,0,0.3)' 
                      : '0 4px 12px rgba(0,0,0,0.1)',
                    '&:hover': {
                      boxShadow: theme === 'dark'
                        ? '0 6px 16px rgba(0,0,0,0.4)'
                        : '0 6px 16px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  {isProcessing ? 'Converting...' : 'Convert to PDF'}
                </Button>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Merge PDFs Section */}
        <Box mb={8}>
          <Typography variant="h4" gutterBottom sx={{ color: theme === 'dark' ? 'white' : 'text.primary' }}>
            Merge PDFs
          </Typography>
          <Paper
            elevation={theme === 'dark' ? 2 : 1}
            sx={{
              p: 4,
              bgcolor: theme === 'dark' ? 'grey.900' : 'background.paper',
              borderRadius: 2
            }}
          >
            <Box
              {...getMergeRootProps()}
              sx={{
                border: '3px dashed',
                borderColor: isMergeDragActive ? 'primary.main' : theme === 'dark' ? 'grey.800' : 'grey.300',
                borderRadius: 3,
                p: 6,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: isMergeDragActive ? (theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'action.hover') : 'transparent',
                transition: 'all 0.2s ease-in-out',
                mb: 4,
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'action.hover',
                }
              }}
            >
              <input {...getMergeInputProps()} />
              <IconStack2 size={64} color={isMergeDragActive ? '#1976d2' : theme === 'dark' ? '#fff' : '#666'} />
              <Typography variant="h5" gutterBottom sx={{ 
                mt: 2, 
                fontWeight: 500,
                color: theme === 'dark' ? 'white' : 'text.primary'
              }}>
                {isMergeDragActive ? 'Drop PDFs here' : 'Drop PDF files here or click to select'}
              </Typography>
              <Typography variant="body1" sx={{ 
                color: theme === 'dark' ? 'grey.400' : 'text.secondary',
                mt: 2
              }}>
                Add multiple PDF files to merge them into one
              </Typography>
            </Box>

            {selectedFiles.length > 0 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: theme === 'dark' ? 'white' : 'text.primary' }}>
                    Selected Files ({selectedFiles.length})
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClearFiles}
                    startIcon={<IconTrash size={18} />}
                  >
                    Clear All
                  </Button>
                </Box>
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  mb: 3
                }}>
                  {selectedFiles.map((file, index) => (
                    <Paper
                      key={index}
                      elevation={2}
                      sx={{
                        p: 2,
                        bgcolor: theme === 'dark' ? 'grey.900' : 'white',
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: theme === 'dark' ? 'grey.800' : 'grey.50'
                        }
                      }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 2
                      }}>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          bgcolor: theme === 'dark' ? 'grey.800' : 'grey.100',
                          color: theme === 'dark' ? 'grey.300' : 'grey.700'
                        }}>
                          {index + 1}
                        </Box>
                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          flex: 1,
                          gap: 2
                        }}>
                          <IconFileText 
                            size={24} 
                            style={{ 
                              color: theme === 'dark' ? '#fff' : '#666'
                            }} 
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                color: theme === 'dark' ? 'white' : 'text.primary',
                                fontWeight: 500
                              }}
                            >
                              {file.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: theme === 'dark' ? 'grey.400' : 'text.secondary'
                              }}
                            >
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              disabled={index === 0}
                              onClick={() => moveFile(index, index - 1)}
                              sx={{
                                color: theme === 'dark' ? 'grey.400' : 'grey.500',
                                '&:hover': {
                                  color: 'primary.main'
                                },
                                '&.Mui-disabled': {
                                  color: theme === 'dark' ? 'grey.800' : 'grey.300'
                                }
                              }}
                            >
                              <IconArrowUp size={18} />
                            </IconButton>
                            <IconButton
                              disabled={index === selectedFiles.length - 1}
                              onClick={() => moveFile(index, index + 1)}
                              sx={{
                                color: theme === 'dark' ? 'grey.400' : 'grey.500',
                                '&:hover': {
                                  color: 'primary.main'
                                },
                                '&.Mui-disabled': {
                                  color: theme === 'dark' ? 'grey.800' : 'grey.300'
                                }
                              }}
                            >
                              <IconArrowDown size={18} />
                            </IconButton>
                            <IconButton
                              onClick={() => handleRemoveFile(index)}
                              sx={{
                                color: theme === 'dark' ? 'grey.400' : 'grey.500',
                                '&:hover': {
                                  color: 'error.main'
                                }
                              }}
                            >
                              <IconX size={18} />
                            </IconButton>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>

                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleProcessFile}
                  disabled={isProcessing || selectedFiles.length < 2}
                  fullWidth
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    boxShadow: theme === 'dark' 
                      ? '0 4px 12px rgba(0,0,0,0.3)' 
                      : '0 4px 12px rgba(0,0,0,0.1)',
                    '&:hover': {
                      boxShadow: theme === 'dark'
                        ? '0 6px 16px rgba(0,0,0,0.4)'
                        : '0 6px 16px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  {isProcessing ? 'Merging...' : `Merge ${selectedFiles.length} PDFs`}
                </Button>
              </>
            )}
          </Paper>
        </Box>

        {/* Existing dialogs */}
        <FilePickerDialog
          open={isFilePickerOpen}
          onClose={() => setIsFilePickerOpen(false)}
          onSelect={handleFileSelect}
        />

        <Dialog
          open={isCompressionDialogOpen}
          onClose={() => setIsCompressionDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Select Compression Level</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Typography variant="body1" color="text.secondary">
                Choose the compression level for your PDF. Higher compression levels result in smaller file sizes but may reduce quality.
              </Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={compressionLevel}
                  onChange={handleCompressionLevelChange}
                  step={null}
                  marks={compressionMarks}
                  min={CompressionLevel.LOW}
                  max={CompressionLevel.MAXIMUM}
                  valueLabelDisplay="off"
                />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Compression Levels:
                </Typography>
                <Typography variant="body2" component="div" color="text.secondary">
                  • Low: Best quality, minimal compression<br />
                  • Medium: Good balance of quality and size<br />
                  • High: Smaller file size, may affect quality<br />
                  • Maximum: Smallest possible size, reduced quality
                </Typography>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsCompressionDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleProcessFile}
              variant="contained"
              disabled={isProcessing}
            >
              {isProcessing ? 'Compressing...' : 'Compress PDF'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Edit PDF</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Typography variant="body1" color="text.secondary">
                Choose the operations you want to perform on the PDF:
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  onClick={handleAddText}
                  sx={{ mr: 2, mb: 2 }}
                  startIcon={<IconTextPlus size={20} />}
                >
                  Add Text
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleAddHighlight}
                  sx={{ mr: 2, mb: 2 }}
                  startIcon={<IconHighlight size={20} />}
                >
                  Add Highlight
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleAddDelete}
                  sx={{ mb: 2 }}
                  startIcon={<IconTrash size={20} />}
                >
                  Delete Content
                </Button>
              </Box>
              {editOperations.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Pending Operations:
                  </Typography>
                  <List>
                    {editOperations.map((op, index) => (
                      <ListItem
                        key={index}
                        secondaryAction={
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => handleEditOperation(index)}
                              sx={{ mr: 1 }}
                              color="primary"
                            >
                              <IconPencil size={20} />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteOperation(index)}
                            >
                              <IconX size={20} />
                            </IconButton>
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {op.type === 'text' && <IconTextPlus size={20} />}
                              {op.type === 'highlight' && <IconHighlight size={20} />}
                              {op.type === 'delete' && <IconTrash size={20} />}
                              {`Operation ${index + 1}: ${op.type}`}
                            </Box>
                          }
                          secondary={
                            op.type === 'text' 
                              ? `"${op.content}" (Size: ${op.fontSize}px, Color: ${op.fontColor}) at (${op.position?.x}, ${op.position?.y}) on page ${op.page}`
                              : op.type === 'highlight'
                              ? `"${op.text}" (Color: ${op.color}, Opacity: ${op.opacity}) on page ${op.page}`
                              : `Delete content on page ${op.page}`
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Button
                    variant="outlined"
                    onClick={handlePreview}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Preview Changes
                  </Button>
                </Box>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setIsEditDialogOpen(false);
              setEditOperations([]);
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleProcessFile}
              variant="contained"
              disabled={isProcessing || editOperations.length === 0}
            >
              {isProcessing ? 'Processing...' : 'Apply Changes'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={isTextEditorOpen}
          onClose={() => setIsTextEditorOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Text Editor</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Box sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 2
              }}>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Text Content"
                    value={currentTextOperation.content}
                    onChange={(e) => setCurrentTextOperation({
                      ...currentTextOperation,
                      content: e.target.value
                    })}
                    placeholder="Enter your text here..."
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      type="number"
                      label="Font Size"
                      value={currentTextOperation.fontSize}
                      onChange={(e) => setCurrentTextOperation({
                        ...currentTextOperation,
                        fontSize: Number(e.target.value)
                      })}
                      InputProps={{ inputProps: { min: 8, max: 72 } }}
                    />
                    <TextField
                      type="color"
                      label="Font Color"
                      value={currentTextOperation.fontColor}
                      onChange={(e) => setCurrentTextOperation({
                        ...currentTextOperation,
                        fontColor: e.target.value
                      })}
                      sx={{ width: 100 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      type="number"
                      label="X Position"
                      value={currentTextOperation.position.x}
                      onChange={(e) => setCurrentTextOperation({
                        ...currentTextOperation,
                        position: {
                          ...currentTextOperation.position,
                          x: Number(e.target.value)
                        }
                      })}
                    />
                    <TextField
                      type="number"
                      label="Y Position"
                      value={currentTextOperation.position.y}
                      onChange={(e) => setCurrentTextOperation({
                        ...currentTextOperation,
                        position: {
                          ...currentTextOperation.position,
                          y: Number(e.target.value)
                        }
                      })}
                    />
                    <TextField
                      type="number"
                      label="Page Number"
                      value={currentTextOperation.page}
                      onChange={(e) => setCurrentTextOperation({
                        ...currentTextOperation,
                        page: Number(e.target.value)
                      })}
                      InputProps={{ inputProps: { min: 1 } }}
                    />
                  </Box>
                </Stack>
              </Box>
              <Box sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                minHeight: 100,
                position: 'relative'
              }}>
                <Typography
                  sx={{
                    position: 'absolute',
                    left: currentTextOperation.position.x,
                    top: currentTextOperation.position.y,
                    fontSize: currentTextOperation.fontSize,
                    color: currentTextOperation.fontColor,
                    transform: 'translate(-50%, -50%)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {currentTextOperation.content || 'Preview Text'}
                </Typography>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsTextEditorOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleTextSave}
              variant="contained"
              disabled={!currentTextOperation.content}
            >
              Add Text
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={isExportDialogOpen}
          onClose={() => setIsExportDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Export PDF</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Typography variant="body1" color="text.secondary">
                Choose the format to export your PDF to:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {['docx', 'xlsx', 'txt', 'html', 'png', 'jpg'].map((format) => (
                  <Button
                    key={format}
                    variant={exportFormat === format ? 'contained' : 'outlined'}
                    onClick={() => setExportFormat(format)}
                    sx={{ minWidth: '100px' }}
                  >
                    {format.toUpperCase()}
                  </Button>
                ))}
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleProcessFile}
              variant="contained"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Export'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={isConvertDialogOpen}
          onClose={() => setIsConvertDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Convert to PDF</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Typography variant="body1" color="text.secondary">
                Select the format of your input file:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {['docx', 'doc', 'txt', 'rtf', 'jpg', 'png'].map((format) => (
                  <Button
                    key={format}
                    variant={convertFormat === format ? 'contained' : 'outlined'}
                    onClick={() => setConvertFormat(format)}
                    sx={{ minWidth: '100px' }}
                  >
                    {format.toUpperCase()}
                  </Button>
                ))}
              </Box>
              <Typography variant="body2" color="text.secondary">
                Note: Make sure your file is in the selected format.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsConvertDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleProcessFile}
              variant="contained"
              disabled={isProcessing}
            >
              {isProcessing ? 'Converting...' : 'Convert to PDF'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={!!plagiarismResults}
          onClose={() => setPlagiarismResults(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Plagiarism Check Results</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Typography variant="h6" color="primary">
                Similarity Score: {plagiarismResults?.similarity_score}%
              </Typography>
              <Typography variant="subtitle1">Matched Sources:</Typography>
              <List>
                {plagiarismResults?.matched_sources?.map((source: any, index: number) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={source.url}
                      secondary={`${source.similarity}% match`}
                    />
                  </ListItem>
                ))}
              </List>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPlagiarismResults(null)}>Close</Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={isViewerDialogOpen}
          onClose={() => {
            setIsViewerDialogOpen(false);
            if (pdfUrl) {
              URL.revokeObjectURL(pdfUrl);
              setPdfUrl(null);
            }
          }}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: { minHeight: '80vh' }
          }}
        >
          <DialogTitle>View PDF</DialogTitle>
          <DialogContent>
            {pdfUrl && (
              <Box sx={{ width: '100%', height: '70vh' }}>
                <iframe
                  src={pdfUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  title="PDF Viewer"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setIsViewerDialogOpen(false);
                if (pdfUrl) {
                  URL.revokeObjectURL(pdfUrl);
                  setPdfUrl(null);
                }
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={isHighlightEditorOpen}
          onClose={() => setIsHighlightEditorOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Highlight Text</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Text to Highlight"
                value={currentHighlightOperation.text}
                onChange={(e) => setCurrentHighlightOperation({
                  ...currentHighlightOperation,
                  text: e.target.value
                })}
                placeholder="Enter the text you want to highlight..."
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  type="color"
                  label="Highlight Color"
                  value={currentHighlightOperation.color}
                  onChange={(e) => setCurrentHighlightOperation({
                    ...currentHighlightOperation,
                    color: e.target.value
                  })}
                  sx={{ width: 120 }}
                />
                <TextField
                  type="number"
                  label="Opacity"
                  value={currentHighlightOperation.opacity}
                  onChange={(e) => setCurrentHighlightOperation({
                    ...currentHighlightOperation,
                    opacity: Number(e.target.value)
                  })}
                  inputProps={{ min: 0.1, max: 1, step: 0.1 }}
                  sx={{ width: 120 }}
                />
                <TextField
                  type="number"
                  label="Page Number"
                  value={currentHighlightOperation.page}
                  onChange={(e) => setCurrentHighlightOperation({
                    ...currentHighlightOperation,
                    page: Number(e.target.value)
                  })}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Box>
              <Box sx={{
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper'
              }}>
                <Typography
                  sx={{
                    backgroundColor: currentHighlightOperation.color,
                    opacity: currentHighlightOperation.opacity,
                    display: 'inline-block',
                    p: 1,
                    borderRadius: 0.5
                  }}
                >
                  {currentHighlightOperation.text || 'Preview of highlighted text'}
                </Typography>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsHighlightEditorOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleHighlightSave}
              variant="contained"
              disabled={!currentHighlightOperation.text}
            >
              Add Highlight
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={isDeleteEditorOpen}
          onClose={() => setIsDeleteEditorOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Delete Content</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Typography variant="body1" color="text.secondary">
                Specify the page where you want to delete content:
              </Typography>
              <TextField
                type="number"
                label="Page Number"
                value={currentDeleteOperation.page}
                onChange={(e) => setCurrentDeleteOperation({
                  ...currentDeleteOperation,
                  page: Number(e.target.value)
                })}
                InputProps={{ inputProps: { min: 1 } }}
                fullWidth
              />
              <Typography variant="body2" color="text.secondary">
                Note: This operation will allow you to select and delete content on the specified page.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDeleteEditorOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteSave}
              variant="contained"
              color="error"
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={!!previewUrl}
          onClose={() => {
            if (previewUrl) {
              URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
            }
          }}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: { minHeight: '80vh' }
          }}
        >
          <DialogTitle>Preview Changes</DialogTitle>
          <DialogContent>
            {previewUrl && (
              <Box sx={{ width: '100%', height: '70vh' }}>
                <iframe
                  src={previewUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  title="PDF Preview"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                if (previewUrl) {
                  URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                }
              }}
            >
              Close Preview
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={!!error || !!success}
          autoHideDuration={6000}
          onClose={() => {
            setError(null);
            setSuccess(null);
          }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => {
            setError(null);
            setSuccess(null);
          }} severity={!!success ? 'success' : 'error'} sx={{ width: '100%' }}>
            {error || success}
          </Alert>
        </Snackbar>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          bgcolor: theme === 'dark' ? 'grey.900' : 'background.paper',
          borderTop: 1,
          borderColor: theme === 'dark' ? 'grey.800' : 'grey.200',
        }}
      >
        <Container maxWidth="lg">
          <Typography 
            variant="body2" 
            color="text.secondary" 
            align="center"
          >
            © {new Date().getFullYear()} PDF Manager. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
