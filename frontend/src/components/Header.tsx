import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { IconHome, IconFiles, IconChartBar, IconLogin, IconLogout } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { label: 'Home', path: '/', icon: <IconHome size={20} /> },
    { label: 'My Files', path: '/files', icon: <IconFiles size={20} /> },
    { label: 'Analytics', path: '/analytics', icon: <IconChartBar size={20} /> },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: theme => theme.palette.header?.main || theme.palette.background.paper,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'flex' }, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            PDF Manager
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {isAuthenticated &&
              navigationItems.map(item => (
                <Button
                  key={item.path}
                  color="inherit"
                  onClick={() => navigate(item.path)}
                  sx={{
                    backgroundColor: isActive(item.path) ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.08)',
                    },
                  }}
                  startIcon={item.icon}
                >
                  {item.label}
                </Button>
              ))}
            {isAuthenticated ? (
              <Button color="inherit" onClick={handleLogout} startIcon={<IconLogout size={20} />}>
                Logout
              </Button>
            ) : (
              <Button
                color="inherit"
                onClick={() => navigate('/login')}
                startIcon={<IconLogin size={20} />}
              >
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
