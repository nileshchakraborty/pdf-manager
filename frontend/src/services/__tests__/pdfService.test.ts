import { pdfService, CompressionLevel } from '../pdfService';
import axiosInstance from '../axiosInstance';

jest.mock('../axiosInstance', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

describe('PDFService', () => {
  const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;
  const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
  const mockBlob = new Blob(['test'], { type: 'application/pdf' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('compress', () => {
    it('compresses PDF file successfully', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: mockBlob });

      const result = await pdfService.compress(mockFile, CompressionLevel.MEDIUM);

      expect(mockAxios.post).toHaveBeenCalledWith(
        '/pdf/compress',
        expect.any(FormData),
        expect.objectContaining({ responseType: 'blob' })
      );
      expect(result).toBe(mockBlob);
    });

    it('handles compression errors', async () => {
      const error = new Error('Compression failed');
      mockAxios.post.mockRejectedValueOnce(error);

      await expect(pdfService.compress(mockFile, CompressionLevel.MEDIUM)).rejects.toThrow('Compression failed');
    });
  });

  describe('merge', () => {
    it('merges PDF files successfully', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: mockBlob });

      const result = await pdfService.merge([mockFile]);

      expect(mockAxios.post).toHaveBeenCalledWith(
        '/pdf/merge',
        expect.any(FormData),
        expect.objectContaining({ responseType: 'blob' })
      );
      expect(result).toBe(mockBlob);
    });

    it('handles merge errors', async () => {
      const error = new Error('Merge failed');
      mockAxios.post.mockRejectedValueOnce(error);

      await expect(pdfService.merge([mockFile])).rejects.toThrow('Merge failed');
    });
  });

  describe('checkPlagiarism', () => {
    const mockResponse = {
      similarity_score: 0.85,
      matched_sources: [
        { source: 'test.pdf', score: 0.85 }
      ]
    };

    it('checks plagiarism successfully', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await pdfService.checkPlagiarism(mockFile);

      expect(mockAxios.post).toHaveBeenCalledWith(
        '/pdf/check-plagiarism',
        expect.any(FormData)
      );
      expect(result).toEqual(mockResponse);
    });

    it('handles plagiarism check errors', async () => {
      const error = new Error('Plagiarism check failed');
      mockAxios.post.mockRejectedValueOnce(error);

      await expect(pdfService.checkPlagiarism(mockFile)).rejects.toThrow('Plagiarism check failed');
    });
  });
});
