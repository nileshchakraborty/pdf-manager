import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlagiarismResults } from '../PlagiarismResults';

const mockResults = {
  plagiarized: true,
  matches: [
    {
      text: 'Test text',
      source: 'Test source',
      line_number: 1,
      source_line_number: 2,
      similarity_score: 0.8
    }
  ],
  error: null
};

describe('PlagiarismResults', () => {
  it('renders plagiarism alert when content is plagiarized', () => {
    render(<PlagiarismResults results={mockResults} />);
    
    expect(screen.getByRole('alert')).toHaveTextContent(/Plagiarism detected/i);
  });

  it('displays match details', () => {
    render(<PlagiarismResults results={mockResults} />);
    
    expect(screen.getByText(mockResults.matches[0].text)).toBeInTheDocument();
    expect(screen.getByText(`Source: ${mockResults.matches[0].source}`)).toBeInTheDocument();
  });

  it('allows expanding and collapsing match details', () => {
    render(<PlagiarismResults results={mockResults} />);
    
    // Initially, line numbers should not be visible
    const lineNumberText = `Line number: ${mockResults.matches[0].line_number}`;
    expect(screen.queryByText(lineNumberText)).not.toBeInTheDocument();
    
    // Click expand button
    const expandButton = screen.getByRole('button', { name: /show details/i });
    fireEvent.click(expandButton);
    
    // After expanding, line numbers should be visible
    expect(screen.getByText(lineNumberText)).toBeInTheDocument();
    
    // Click collapse button
    const collapseButton = screen.getByRole('button', { name: /hide details/i });
    fireEvent.click(collapseButton);
    
    // After collapsing, line numbers should not be visible
    expect(screen.queryByText(lineNumberText)).not.toBeInTheDocument();
  });

  it('displays summary statistics', () => {
    render(<PlagiarismResults results={mockResults} />);
    
    expect(screen.getByText(/total matches: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/average similarity: 80/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<PlagiarismResults results={null} isLoading={true} />);
    
    expect(screen.getByText(/checking for plagiarism/i)).toBeInTheDocument();
  });

  it('handles error state', () => {
    const errorResults = {
      ...mockResults,
      error: 'Test error message'
    };
    
    render(<PlagiarismResults results={errorResults} />);
    
    expect(screen.getByRole('alert')).toHaveTextContent(/error/i);
    expect(screen.getByText(/test error message/i)).toBeInTheDocument();
  });
}); 