import { render, RenderOptions } from '@testing-library/react';
import { TestWrapper } from './TestWrapper';

const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: TestWrapper, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };
