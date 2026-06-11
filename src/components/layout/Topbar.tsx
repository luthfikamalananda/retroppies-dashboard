import ExitToAppOutlinedIcon from '@mui/icons-material/ExitToAppOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import headerButton from '../../assets/header-button.svg';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { colors } from '../../theme/colors';
import { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_WIDTH } from './Sidebar';

export function Topbar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const openMobileSidebar = useUIStore((s) => s.openMobileSidebar);
  const { user, clearUser } = useAuthStore();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        left: isMobile ? 0 : sidebarWidth,
        width: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`,
        transition: 'left 0.2s ease, width 0.2s ease',
        bgcolor: colors.base['white'],
        borderBottom: '1px solid',
        borderColor: colors.border['default'],
        color: colors.base['black'],
      }}
    >
      <Toolbar sx={{ gap: 1, minHeight: 64 }}>
        {/* Sidebar toggle — using header-button.svg asset */}
        <IconButton
          onClick={isMobile ? openMobileSidebar : toggleSidebar}
          size="small"
          sx={{ color: colors.base['black'], p: 0.75 }}
        >
          <Box
            component="img"
            src={headerButton}
            alt="toggle sidebar"
            sx={{ width: 18, height: 18, transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
          />
        </IconButton>

        <Box sx={{ flex: 1 }} />

        {/* User avatar + name + dropdown */}
        <Button
          onClick={(e) => setAnchorEl(e.currentTarget)}
          disableRipple
          sx={{
            textTransform: 'none',
            color: colors.base['black'],
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 0.5,
            '&:hover': { bgcolor: 'transparent' },
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: colors.brand[200],
              color: colors.brand[600],
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {user?.username?.[0]?.toUpperCase() ?? 'U'}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 500, color: colors.base['black'], display: { xs: 'none', sm: 'block' } }}>
            {user?.username ?? 'Admin'}
          </Typography>
          <KeyboardArrowDownIcon sx={{ fontSize: 18, color: colors.base['grey'] }} />
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{ paper: { sx: { mt: 1, minWidth: 200, borderRadius: 2 } } }}
        >
          <Box sx={{ px: 2, py: 1.25 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: colors.base['black'] }}>
              {user?.username}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.base['grey'] }}>
            {user?.roleName && user?.roleName} {user?.tenantName && `- ${user.tenantName}`}
            {user?.isSuperadmin && 'Superadmin'}
            </Typography>
          </Box>
          <Divider />
          <NavLink to="/app/manage-account" style={{ textDecoration: 'none' }}>
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
              }}
              sx={{ color: colors.base['black'], fontSize: 14 }}
            >
              <Stack direction={'row'} sx={{ alignItems: "center", gap: 1 }}>
                <SettingsOutlinedIcon sx={{ fontSize: 16, color: colors.base['black'], fontWeight: 500 }} />
                <Typography sx={{ color: colors.base['black'], fontSize: 14, fontWeight: 500 }}>
                  Manage Account
                </Typography>
              </Stack>
            </MenuItem>
          </NavLink>
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              clearUser();
            }}

          >
            <Stack direction={'row'} sx={{ alignItems: "center", gap: 1 }}>
              <ExitToAppOutlinedIcon sx={{ fontSize: 16, color: colors.brand[500], fontWeight: 500 }} />
              <Typography sx={{ color: colors.brand[500], fontSize: 14, fontWeight: 500 }}>
                Log Out
              </Typography>
            </Stack>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
