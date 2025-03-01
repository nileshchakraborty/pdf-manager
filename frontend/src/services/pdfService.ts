import { axiosInstance } from './axiosInstance';

export enum CompressionLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  MAXIMUM = 4,
}

export interface PlagiarismResponse {
  similarity_score: number;
  matched_sources: Array<{
    source_url: string;
    similarity_score: number;
    matched_text: string;
  }>;
  error?: string;
  plagiarized: boolean;
  matches: Array<{
    source_url: string;
    similarity_score: number;
    matched_text: string;
  }>;
}

export interface EditOperation {
  type: 'text' | 'highlight' | 'delete';
  content?: string;
  position?: { x: number; y: number };
  page?: number;
  fontSize?: number;
  fontColor?: string;
  text?: string;
  color?: string;
  opacity?: number;
  region?: { x: number; y: number; width: number; height: number };
}

export interface PDFService {
  compress(file: File, level: CompressionLevel): Promise<Blob>;
  merge(files: File[]): Promise<Blob>;
  edit(file: File, operations: EditOperation[]): Promise<Blob>;
  preview(file: File, operations: EditOperation[]): Promise<Blob>;
  checkPlagiarism(file: File): Promise<PlagiarismResponse>;
  convert(file: File): Promise<Blob>;
  export(file: File, format: string): Promise<Blob>;
}

class PDFServiceImpl implements PDFService {
  private readonly API_PREFIX = '/api/v1';

  private createFormRequest(config: any = {}) {
    return {
      ...config,
      transformRequest: [(data) => data], // Prevent axios from trying to transform FormData
      headers: {
        'Accept': config.responseType === 'blob' ? 'application/pdf' : 'application/json',
        ...config.headers,
      },
    };
  }

  async compress(file: File, level: CompressionLevel): Promise<Blob> {
    // Validate file type
    if (!file.type.includes('pdf')) {
      throw new Error('Invalid file type. Please select a PDF file.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('compression_level', String(level));

    // Log request data for debugging
    console.log('Sending request with:', {
      file: file.name,
      type: file.type,
      size: file.size,
      compression_level: level
    });

    try {
      const response = await axiosInstance.post(
        `${this.API_PREFIX}/pdf/compress`,
        formData,
        {
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf, application/json',
          },
          // Don't transform FormData
          transformRequest: [(data) => data],
        }
      );

      // Check if the response is JSON (error) or PDF (success)
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        const errorText = await response.data.text();
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || 'Failed to compress PDF');
      }

      return response.data;
    } catch (error: any) {
      // Handle error response
      if (error.response?.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          const errorJson = JSON.parse(errorText);
          console.error('Server error:', errorJson);
          throw new Error(errorJson.detail || 'Failed to compress PDF');
        } catch (e) {
          console.error('Error parsing response:', e);
          throw new Error('Failed to compress PDF');
        }
      }

      // Log the error for debugging
      console.error('Request failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });

      throw new Error(error.response?.data?.detail || error.message || 'Failed to compress PDF');
    }
  }

  async merge(files: File[]): Promise<Blob> {
    if (files.length < 2) {
      throw new Error('At least two PDF files are required for merging');
    }

    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('files', file);
    });

    try {
      const response = await axiosInstance.post(
        `${this.API_PREFIX}/pdf/merge`,
        formData,
        {
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf, application/json',
          },
          transformRequest: [(data) => data],
        }
      );

      // Check if the response is JSON (error) or PDF (success)
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        const errorText = await response.data.text();
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || 'Failed to merge PDFs');
      }

      return response.data;
    } catch (error: any) {
      // Handle error response
      if (error.response?.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          const errorJson = JSON.parse(errorText);
          console.error('Server error:', errorJson);
          throw new Error(errorJson.detail || 'Failed to merge PDFs');
        } catch (e) {
          console.error('Error parsing response:', e);
          throw new Error('Failed to merge PDFs');
        }
      }
      throw new Error(error.response?.data?.detail || error.message || 'Failed to merge PDFs');
    }
  }

  async edit(file: File, operations: EditOperation[]): Promise<Blob> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('operations', JSON.stringify(operations));

    try {
      const response = await axiosInstance.post(
        `${this.API_PREFIX}/pdf/edit`,
        formData,
        this.createFormRequest({ responseType: 'blob' })
      );
      return response.data;
    } catch (error: any) {
      console.error('Edit error:', error?.response?.data || error);
      throw error;
    }
  }

  async preview(file: File, operations: EditOperation[]): Promise<Blob> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('operations', JSON.stringify(operations));

    try {
      const response = await axiosInstance.post(
        `${this.API_PREFIX}/pdf/preview`,
        formData,
        {
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf, application/json',
          },
          transformRequest: [(data) => data],
        }
      );

      // Check if the response is JSON (error) or PDF (success)
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        const errorText = await response.data.text();
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || 'Failed to preview PDF');
      }

      return response.data;
    } catch (error: any) {
      // Handle error response
      if (error.response?.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          const errorJson = JSON.parse(errorText);
          console.error('Server error:', errorJson);
          throw new Error(errorJson.detail || 'Failed to preview PDF');
        } catch (e) {
          console.error('Error parsing response:', e);
          throw new Error('Failed to preview PDF');
        }
      }
      throw new Error(error.response?.data?.detail || error.message || 'Failed to preview PDF');
    }
  }

  async checkPlagiarism(file: File): Promise<PlagiarismResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axiosInstance.post(
        `${this.API_PREFIX}/pdf/check-plagiarism`,
        formData,
        this.createFormRequest()
      );
      return response.data;
    } catch (error: any) {
      console.error('Plagiarism check error:', error?.response?.data || error);
      throw error;
    }
  }

  async convert(file: File): Promise<Blob> {
    const formData = new FormData();
    formData.append('file', file);

    // Check if file is already a PDF
    if (file.type === 'application/pdf') {
      throw new Error('File is already a PDF. Please select a different format to convert.');
    }

    // Log request data for debugging
    console.log('Converting file:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    try {
      const response = await axiosInstance.post(
        `${this.API_PREFIX}/pdf/convert`,
        formData,
        {
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf, application/json',
            'Content-Type': 'multipart/form-data',
          },
          transformRequest: [(data) => data],
        }
      );

      // Check if the response is JSON (error) or PDF (success)
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        const errorText = await response.data.text();
        const errorJson = JSON.parse(errorText);
        console.error('Conversion failed:', errorJson);
        throw new Error(errorJson.detail || 'Failed to convert file to PDF');
      }

      return response.data;
    } catch (error: any) {
      // Handle error response
      if (error.response?.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          const errorJson = JSON.parse(errorText);
          console.error('Server error:', errorJson);
          throw new Error(errorJson.detail || 'Failed to convert file to PDF');
        } catch (e) {
          console.error('Error parsing response:', e);
          throw new Error('Failed to convert file to PDF');
        }
      }

      // Log the error for debugging
      console.error('Request failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });

      throw new Error(error.response?.data?.detail || error.message || 'Failed to convert file to PDF');
    }
  }

  async export(file: File, format: string = 'docx'): Promise<Blob> {
    if (!file.type.includes('pdf')) {
      throw new Error('Invalid file type. Please select a PDF file.');
    }

    // Validate format
    const supportedFormats = ['xlsx', 'txt', 'html', 'png', 'jpg', 'jpeg'];
    if (!supportedFormats.includes(format.toLowerCase())) {
      throw new Error(`Unsupported format: ${format}. Supported formats are: ${supportedFormats.join(', ')}`);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format.toLowerCase());

    try {
      const response = await axiosInstance.post(
        `${this.API_PREFIX}/pdf/export`,
        formData,
        {
          responseType: 'blob',
          headers: {
            'Accept': '*/*',  // Accept any content type since response varies by format
          },
          // Don't transform FormData
          transformRequest: [(data) => data],
        }
      );

      // Check if the response is JSON (error) or file (success)
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        const errorText = await response.data.text();
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || 'Failed to export PDF');
      }

      return response.data;
    } catch (error: any) {
      // Handle error response
      if (error.response?.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          const errorJson = JSON.parse(errorText);
          console.error('Server error:', errorJson);
          throw new Error(errorJson.detail || 'Failed to export PDF');
        } catch (e) {
          console.error('Error parsing response:', e);
          throw new Error('Failed to export PDF');
        }
      }

      console.error('Export error:', error.response?.data || error);
      throw new Error(error.response?.data?.detail || error.message || 'Failed to export PDF');
    }
  }
}

export const pdfService = new PDFServiceImpl();
