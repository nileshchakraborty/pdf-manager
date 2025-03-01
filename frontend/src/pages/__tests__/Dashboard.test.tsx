import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Dashboard from '../Dashboard';
import { AuthProvider } from '../../contexts/AuthContext';
import { pdfService, CompressionLevel } from '../../services/pdfService';
import '@testing-library/jest-dom';

// Mock the auth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
  }),
}));

// Mock the PDF service
jest.mock('../../services/pdfService', () => ({
  pdfService: {
    compress: jest.fn(),
    merge: jest.fn(),
    edit: jest.fn(),
    checkPlagiarism: jest.fn(),
    convert: jest.fn(),
    export: jest.fn(),
  },
  CompressionLevel: {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    MAXIMUM: 4,
  },
}));

// Create theme for testing
const theme = createTheme();

describe('Dashboard', () => {
  const mockPdfService = pdfService as jest.Mocked<typeof pdfService>;
  const mockCreateObjectURL = jest.fn(() => 'mock-url');
  const mockRevokeObjectURL = jest.fn();
  const mockClick = jest.fn();
  let mockLink: { click: jest.Mock; href: string; download: string };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock URL methods
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock download link creation
    mockLink = {
      click: mockClick,
      href: '',
      download: '',
    };

    // Mock document methods
    document.createElement = jest.fn().mockImplementation((tagName) => {
      if (tagName === 'a') {
        return mockLink as unknown as HTMLElement;
      }
      const element = document.createElement(tagName);
      if (tagName === 'input') {
        Object.defineProperty(element, 'files', {
          value: [],
          writable: true,
        });
      }
      return element;
    });

    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider theme={theme}>
            <Dashboard />
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  const selectFile = async () => {
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('file-input');
    await act(async () => {
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: true,
      });
      fireEvent.change(input);
    });
    return file;
  };

  it('compresses PDF successfully', async () => {
    const mockBlob = new Blob(['compressed'], { type: 'application/pdf' });
    mockPdfService.compress.mockResolvedValueOnce(mockBlob);
    
    renderDashboard();
    const file = await selectFile();
    
    const compressButton = screen.getByRole('button', { name: /compress pdf/i });
    await act(async () => {
      fireEvent.click(compressButton);
    });

    // Wait for compression dialog to appear and click compress
    const compressionDialog = await screen.findByRole('dialog');
    expect(compressionDialog).toBeInTheDocument();
    
    const confirmButton = screen.getByRole('button', { name: /compress/i });
    await act(async () => {
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(mockPdfService.compress).toHaveBeenCalledWith(file, CompressionLevel.MEDIUM);
    });

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-url');
      expect(screen.queryByText(/failed to process pdf/i)).not.toBeInTheDocument();
    });
  });

  it('merges PDFs successfully', async () => {
    const mockBlob = new Blob(['merged'], { type: 'application/pdf' });
    mockPdfService.merge.mockResolvedValueOnce(mockBlob);
    
    renderDashboard();
    const file = await selectFile();
    
    const mergeButton = screen.getByRole('button', { name: /merge pdfs/i });
    await act(async () => {
      fireEvent.click(mergeButton);
    });

    await waitFor(() => {
      expect(mockPdfService.merge).toHaveBeenCalledWith([file]);
    });

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-url');
      expect(screen.queryByText(/failed to process pdf/i)).not.toBeInTheDocument();
    });
  });

  it('displays error message on service failure', async () => {
    mockPdfService.compress.mockRejectedValueOnce(new Error('Service error'));
    
    renderDashboard();
    const file = await selectFile();
    
    const compressButton = screen.getByRole('button', { name: /compress pdf/i });
    await act(async () => {
      fireEvent.click(compressButton);
    });

    // Wait for compression dialog to appear and click compress
    const compressionDialog = await screen.findByRole('dialog');
    expect(compressionDialog).toBeInTheDocument();
    
    const confirmButton = screen.getByRole('button', { name: /compress/i });
    await act(async () => {
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to process pdf/i);
    });
  });
});
