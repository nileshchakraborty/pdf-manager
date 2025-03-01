import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import Button from './Button';
import { theme } from '../../../utils/theme';

const renderWithTheme = (component: React.ReactElement) => {
  render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('Button', () => {
  it('renders with default props', () => {
    renderWithTheme(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    renderWithTheme(<Button size="small">Small</Button>);
    const smallButton = screen.getByText('Small');
    expect(smallButton).toBeInTheDocument();
    expect(smallButton).toHaveClass('MuiButton-sizeSmall');

    renderWithTheme(<Button size="medium">Medium</Button>);
    const mediumButton = screen.getByText('Medium');
    expect(mediumButton).toBeInTheDocument();
    expect(mediumButton).toHaveClass('MuiButton-sizeMedium');

    renderWithTheme(<Button size="large">Large</Button>);
    const largeButton = screen.getByText('Large');
    expect(largeButton).toBeInTheDocument();
    expect(largeButton).toHaveClass('MuiButton-sizeLarge');
  });

  it('renders with different variants', () => {
    renderWithTheme(<Button variant="contained">Contained</Button>);
    const containedButton = screen.getByText('Contained');
    expect(containedButton).toBeInTheDocument();
    expect(containedButton).toHaveClass('MuiButton-contained');

    renderWithTheme(<Button variant="outlined">Outlined</Button>);
    const outlinedButton = screen.getByText('Outlined');
    expect(outlinedButton).toBeInTheDocument();
    expect(outlinedButton).toHaveClass('MuiButton-outlined');

    renderWithTheme(<Button variant="text">Text</Button>);
    const textButton = screen.getByText('Text');
    expect(textButton).toBeInTheDocument();
    expect(textButton).toHaveClass('MuiButton-text');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    renderWithTheme(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled prop is true', () => {
    const handleClick = jest.fn();
    renderWithTheme(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );
    const button = screen.getByText('Disabled');
    expect(button).toHaveAttribute('disabled');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders as full width when specified', () => {
    renderWithTheme(<Button fullWidth>Full Width</Button>);
    expect(screen.getByText('Full Width')).toHaveStyle({ width: '100%' });
  });
});
