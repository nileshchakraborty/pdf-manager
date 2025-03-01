import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../styles/theme';

export const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);
