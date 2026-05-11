import React from 'react';
import { Box, Toolbar } from '@mui/material';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { GlobalSnackbar } from '../common/GlobalSnackbar';

interface AppShellProps {
    children: React.ReactNode;
}

// AppShell wraps all protected pages with sidebar + topbar.
export function AppShell({ children }: AppShellProps) {

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <Sidebar />
            <Box
                component="main"
                sx={{
                    flex: 1,
                    // ml: `${sidebarWidth}px`,
                    transition: 'margin-left 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                }}
            >
                <Topbar />
                {/* Toolbar spacer to push content below the fixed AppBar */}
                <Toolbar />
                <Box sx={{ flex: 1, p: 3 }}>{children}</Box>
            </Box>
            <GlobalSnackbar />
        </Box>
    );
}
