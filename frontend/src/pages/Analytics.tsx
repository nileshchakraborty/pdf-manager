import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import { IconFiles, IconDownload, IconEdit, IconSearch } from '@tabler/icons-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  progress?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, progress }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography variant="h6" sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" color="primary">
        {value}
      </Typography>
      {progress !== undefined && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {progress}% of quota used
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

export default function Analytics() {
  const stats = [
    {
      title: 'Total Files',
      value: '125',
      icon: <IconFiles size={24} />,
      progress: 62,
    },
    {
      title: 'Downloads',
      value: '1,234',
      icon: <IconDownload size={24} />,
    },
    {
      title: 'Edits',
      value: '456',
      icon: <IconEdit size={24} />,
    },
    {
      title: 'Plagiarism Checks',
      value: '89',
      icon: <IconSearch size={24} />,
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center" color="primary">
        Analytics Dashboard
      </Typography>
      <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary">
        Overview of your PDF operations
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Coming soon: Detailed analytics and usage trends
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
