import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import { IconDownload, IconTrash, IconEdit, IconEye } from '@tabler/icons-react';

interface FileData {
  id: string;
  name: string;
  size: string;
  lastModified: string;
  type: string;
}

const mockFiles: FileData[] = [
  {
    id: '1',
    name: 'document1.pdf',
    size: '2.5 MB',
    lastModified: '2024-01-20',
    type: 'PDF',
  },
  {
    id: '2',
    name: 'report.pdf',
    size: '1.8 MB',
    lastModified: '2024-01-19',
    type: 'PDF',
  },
];

export default function MyFiles() {
  const handleDownload = (id: string) => {
    console.log('Download file:', id);
  };

  const handleDelete = (id: string) => {
    console.log('Delete file:', id);
  };

  const handleEdit = (id: string) => {
    console.log('Edit file:', id);
  };

  const handleView = (id: string) => {
    console.log('View file:', id);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center" color="primary">
        My Files
      </Typography>
      <Paper sx={{ width: '100%', overflow: 'hidden', mt: 3 }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Last Modified</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockFiles.map(file => (
                <TableRow key={file.id} hover>
                  <TableCell>{file.name}</TableCell>
                  <TableCell>{file.size}</TableCell>
                  <TableCell>{file.lastModified}</TableCell>
                  <TableCell>{file.type}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <Tooltip title="View">
                        <IconButton onClick={() => handleView(file.id)} size="small">
                          <IconEye size={20} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton onClick={() => handleDownload(file.id)} size="small">
                          <IconDownload size={20} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleEdit(file.id)} size="small">
                          <IconEdit size={20} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          onClick={() => handleDelete(file.id)}
                          size="small"
                          color="error"
                        >
                          <IconTrash size={20} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}
