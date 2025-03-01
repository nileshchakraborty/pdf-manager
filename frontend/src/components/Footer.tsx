import React from 'react';
import { Box, Container, Typography, Link, useTheme } from '@mui/material';

export default function Footer() {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: theme.palette.footer?.main || theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
        boxShadow: 'rgba(0, 0, 0, 0.05) 0px -2px 4px',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {currentYear} PDF Manager. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link href="#" variant="body2" color="text.secondary" underline="hover">
              Privacy Policy
            </Link>
            <Link href="#" variant="body2" color="text.secondary" underline="hover">
              Terms of Service
            </Link>
            <Link href="#" variant="body2" color="text.secondary" underline="hover">
              Contact Us
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
