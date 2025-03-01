import { createTheme, ThemeOptions } from '@mui/material/styles';

// Extend the Palette and PaletteOptions interfaces
declare module '@mui/material/styles' {
  interface Palette {
    header: {
      main: string;
    };
    footer: {
      main: string;
    };
    module: {
      background: string;
      hover: string;
    };
  }
  interface PaletteOptions {
    header?: {
      main: string;
    };
    footer?: {
      main: string;
    };
    module?: {
      background: string;
      hover: string;
    };
  }
}

const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => {
  // Define shadow values based on mode
  const shadowColor = mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)';
  const hoverShadowColor = mode === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)';
  const defaultShadow = `0px 2px 4px ${shadowColor}`;
  const hoverShadow = `0px 4px 8px ${hoverShadowColor}`;

  return {
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#90caf9' : '#1976d2',
      },
      secondary: {
        main: mode === 'dark' ? '#f48fb1' : '#dc004e',
      },
      background: {
        default: mode === 'dark' ? '#0a0a0a' : '#f0f2f5',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
      header: {
        main: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
      footer: {
        main: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
      module: {
        background: mode === 'dark' ? '#1e1e1e' : '#ffffff',
        hover: mode === 'dark' ? '#2d2d2d' : '#f8f9fa',
      },
    },
    shadows: [
      'none',
      defaultShadow,
      hoverShadow,
      defaultShadow,
      defaultShadow,
      defaultShadow,
      defaultShadow,
      defaultShadow,
      defaultShadow,
      defaultShadow,
      defaultShadow,
      defaultShadow,
      defaultShadow,
      defaultShadow,
      defaultShadow,
      defaultShadow,
      defaultShadow,
      defaultShadow,
      defaultShadow,
      defaultShadow,
      defaultShadow,
      defaultShadow,
      defaultShadow,
      defaultShadow,
      defaultShadow,
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
            color: mode === 'dark' ? '#ffffff' : '#000000',
            borderBottom: '1px solid',
            borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
            boxShadow: defaultShadow,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: defaultShadow,
            '&:hover': {
              boxShadow: hoverShadow,
            },
            transition: 'box-shadow 0.3s ease-in-out, background-color 0.3s ease-in-out',
          },
        },
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            '@media (min-width: 600px)': {
              paddingLeft: '24px',
              paddingRight: '24px',
            },
          },
        },
      },
    },
  };
};

// Function to determine if it's night time (between 6 PM and 6 AM)
const isNightTime = () => {
  const hour = new Date().getHours();
  return hour < 6 || hour >= 18;
};

// Function to get system color scheme preference
const getSystemPreference = (): 'light' | 'dark' => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

// Get the theme mode based on system preference and time
const getThemeMode = (): 'light' | 'dark' => {
  const systemPreference = getSystemPreference();
  const isNight = isNightTime();
  return isNight ? 'dark' : systemPreference;
};

export const theme = createTheme(getDesignTokens(getThemeMode()));
