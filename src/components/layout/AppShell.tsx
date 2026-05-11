import React from 'react';
import { Box, Toolbar } from '@mui/material';
import { Sidebar, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './Sidebar';
import { Topbar } from './Topbar';
import { GlobalSnackbar } from '../common/GlobalSnackbar';
import { useUIStore } from '../../stores/uiStore';

interface AppShellProps {
    children: React.ReactNode;
}

// AppShell wraps all protected pages with sidebar + topbar.
export function AppShell({ children }: AppShellProps) {
    const collapsed = useUIStore((s) => s.sidebarCollapsed);
    // const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

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
