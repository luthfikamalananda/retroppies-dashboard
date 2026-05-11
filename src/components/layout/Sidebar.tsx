import { NavLink, useLocation } from 'react-router-dom';
import {
    Box,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Tooltip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory2';
import PhotoIcon from '@mui/icons-material/Photo';
import TimerIcon from '@mui/icons-material/Timer';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { useUIStore } from '../../stores/uiStore';
import { usePermissions } from '../../hooks/usePermissions';
import { colors } from '../../theme/colors';
import headerLogo from '../../assets/header-logo.png';

export const SIDEBAR_WIDTH = 220;
export const SIDEBAR_COLLAPSED_WIDTH = 64;

const DASHBOARD_ITEMS = [
    { label: 'Summary', path: '/app/dashboard', icon: <DashboardIcon fontSize="small" />, permission: '*' },
    { label: 'Product', path: '/app/products', icon: <InventoryIcon fontSize="small" />, permission: 'products:read' },
    { label: 'Design Template', path: '/app/templates', icon: <PhotoIcon fontSize="small" />, permission: 'templates:read' },
    { label: 'Time', path: '/app/timers', icon: <TimerIcon fontSize="small" />, permission: 'timers:read' },
    { label: 'Voucher', path: '/app/vouchers', icon: <ConfirmationNumberIcon fontSize="small" />, permission: 'vouchers:read' },
    { label: 'Report Transaction', path: '/app/transactions', icon: <ReceiptLongIcon fontSize="small" />, permission: 'transactions:read' },
];

const SETTINGS_ITEMS = [
    { label: 'Setting User', path: '/app/accounts', icon: <ManageAccountsIcon fontSize="small" />, permission: 'accounts:read' },
];

function NavGroup({ label, collapsed }: { label: string; collapsed: boolean }) {
    if (collapsed) return <Box sx={{ height: 8 }} />;
    return (
        <Typography
            variant="caption"
            sx={{
                px: 2,
                pt: 2,
                pb: 0.5,
                display: 'block',
                color: colors.base['grey'],
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontSize: 10,
            }}
        >
            {label}
        </Typography>
    );
}

function NavItem({
    item,
    collapsed,
    isActive,
}: {
    item: { label: string; path: string; icon: React.ReactNode };
    collapsed: boolean;
    isActive: boolean;
}) {
    return (
        <Tooltip title={collapsed ? item.label : ''} placement="right">
            <ListItemButton
                component={NavLink}
                to={item.path}
                selected={isActive}
                sx={{
                    borderRadius: 1.5,
                    mb: 0.25,
                    minHeight: 40,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    px: collapsed ? 1.5 : 1.5,
                    gap: 1.25,
                    '&.Mui-selected': {
                        bgcolor: colors.brand[100],
                        color: colors.brand[500],
                        '& .MuiListItemIcon-root': { color: colors.brand[500] },
                        '&:hover': { bgcolor: colors.brand[100] },
                    },
                    '&:not(.Mui-selected)': {
                        color: colors.base['black'],
                        '& .MuiListItemIcon-root': { color: colors.base['black'] },
                        '&:hover': { bgcolor: colors.base['background-light'] },
                    },
                }}
            >
                <ListItemIcon sx={{ minWidth: 0, color: 'inherit' }}>
                    {item.icon}
                </ListItemIcon>
                {!collapsed && (
                    <ListItemText
                        primary={item.label}
                        slotProps={{
                            primary: {
                                style: {
                                    fontSize: 14,
                                    fontWeight: isActive ? 600 : 400,
                                    color: isActive ? colors.brand[500] : colors.base['black'],
                                },
                            },
                        }}
                    />
                )}
            </ListItemButton>
        </Tooltip>
    );
}

export function Sidebar() {
    const collapsed = useUIStore((s) => s.sidebarCollapsed);
    const { can } = usePermissions();
    const location = useLocation();

    const width = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

    const dashboardItems = DASHBOARD_ITEMS.filter((item) => can(item.permission));
    // const dashboardItems = DASHBOARD_ITEMS
    const settingsItems = SETTINGS_ITEMS.filter((item) => can(item.permission));
    // const settingsItems = SETTINGS_ITEMS

    return (
        <Drawer
            variant="permanent"
            sx={{
                width,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width,
                    boxSizing: 'border-box',
                    borderRight: '1px solid',
                    borderColor: colors.border['default'],
                    transition: 'width 0.2s ease',
                    overflowX: 'hidden',
                    bgcolor: colors.base['white'],
                },
            }}
        >
            {/* Logo header */}
            <Box
                sx={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    px: collapsed ? 1 : 2.5,
                    borderBottom: '1px solid',
                    borderColor: colors.border['default'],
                }}
            >
                {collapsed ? (
                    <Box
                        component="img"
                        src={headerLogo}
                        alt="Retroppies"
                        sx={{ width: 32, height: 32, objectFit: 'contain' }}
                    />
                ) : (
                    <Box
                        component="img"
                        src={headerLogo}
                        alt="The Retroppies"
                        sx={{ height: 36, objectFit: 'contain' }}
                    />
                )}
            </Box>

            {/* Dashboard group */}
            <Box sx={{ px: 1.5, flexGrow: 1 }}>
                <NavGroup label="Dashboard" collapsed={collapsed} />
                <List disablePadding>
                    {dashboardItems.map((item) => (
                        <NavItem
                            key={item.path}
                            item={item}
                            collapsed={collapsed}
                            isActive={location.pathname.startsWith(item.path)}
                        />
                    ))}
                </List>

                {/* Settings group */}
                {settingsItems.length > 0 && (
                    <>
                        <NavGroup label="Settings" collapsed={collapsed} />
                        <List disablePadding>
                            {settingsItems.map((item) => (
                                <NavItem
                                    key={item.path}
                                    item={item}
                                    collapsed={collapsed}
                                    isActive={location.pathname.startsWith(item.path)}
                                />
                            ))}
                        </List>
                    </>
                )}
            </Box>
        </Drawer>
    );
}
