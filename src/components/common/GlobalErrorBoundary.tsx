import React, { Component, type ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // TODO: send to Sentry or error logging service
    console.error('[ErrorBoundary]', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.href = '/app/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: 2,
            p: 3,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Oops, terjadi kesalahan
          </Typography>
          <Typography color="text.secondary" sx={{ textAlign: 'center', maxWidth: 400 }}>
            {this.state.errorMessage || 'Aplikasi mengalami error yang tidak terduga.'}
          </Typography>
          <Button variant="contained" onClick={this.handleReset}>
            Kembali ke Dashboard
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
