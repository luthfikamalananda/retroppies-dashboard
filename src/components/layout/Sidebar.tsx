import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    Box,
    Collapse,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Tooltip,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory2';
import PhotoIcon from '@mui/icons-material/Photo';
import TimerIcon from '@mui/icons-material/Timer';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import SecurityIcon from '@mui/icons-material/Security';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useUIStore } from '../../stores/uiStore';
import { usePermissions } from '../../hooks/usePermissions';
import { colors } from '../../theme/colors';
import headerLogo from '../../assets/header-logo.png';

export const SIDEBAR_WIDTH = 220;
export const SIDEBAR_COLLAPSED_WIDTH = 64;

const DASHBOARD_ITEMS = [
    { label: 'Summary', path: '/app/dashboard', icon: <DashboardIcon fontSize="small" />, permission: '*' },
    { label: 'Product', path: '/app/products', icon: <InventoryIcon fontSize="small" />, permission: 'products:read' },
    { label: 'Design Template', path: '/app/layouts', icon: <PhotoIcon fontSize="small" />, permission: 'templates:read' },
    { label: 'Time', path: '/app/timers', icon: <TimerIcon fontSize="small" />, permission: 'rules:read' },
    { label: 'Voucher', path: '/app/vouchers', icon: <ConfirmationNumberIcon fontSize="small" />, permission: 'vouchers:read' },
    { label: 'Report Transaction', path: '/app/transactions', icon: <ReceiptLongIcon fontSize="small" />, permission: 'transactions:read' },
];

const SYSTEM_USER_ITEMS = [
    { label: 'Tenant', path: '/app/tenants', icon: <BusinessIcon fontSize="small" />, permission: 'tenants:read' },
    { label: 'User', path: '/app/users', icon: <PersonIcon fontSize="small" />, permission: 'users:read' },
    { label: 'Role', path: '/app/roles', icon: <BadgeIcon fontSize="small" />, permission: 'roles:read' },
    { label: 'Permission', path: '/app/permissions', icon: <SecurityIcon fontSize="small" />, permission: 'permissions:read' },
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
    onClick,
}: {
    item: { label: string; path: string; icon: React.ReactNode };
    collapsed: boolean;
    isActive: boolean;
    onClick?: () => void;
}) {
    return (
        <Tooltip title={collapsed ? item.label : ''} placement="right">
            <ListItemButton
                component={NavLink}
                to={item.path}
                selected={isActive}
                onClick={onClick}
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

function NavGroupCollapsible({
    label,
    collapsed,
    expanded,
    onToggle,
    children,
}: {
    label: string;
    collapsed: boolean;
    expanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <>
            <Tooltip title={collapsed ? label : ''} placement="right">
                <ListItemButton
                    onClick={onToggle}
                    sx={{
                        borderRadius: 1.5,
                        mb: 0.25,
                        minHeight: 40,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        px: 1.5,
                        gap: 1.25,
                        color: colors.base['grey'],
                        '&:hover': { bgcolor: colors.base['background-light'] },
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 0, color: 'inherit' }}>
                        <PeopleAltIcon fontSize="small" />
                    </ListItemIcon>
                    {!collapsed && (
                        <>
                            <ListItemText
                                primary={label}
                                slotProps={{
                                    primary: {
                                        style: {
                                            fontSize: 12,
                                            fontWeight: 600,
                                            letterSpacing: '0.04em',
                                            textTransform: 'uppercase',
                                            color: colors.base['grey'],
                                        },
                                    },
                                }}
                            />
                            {expanded ? (
                                <ExpandLessIcon fontSize="small" sx={{ color: colors.base['grey'] }} />
                            ) : (
                                <ExpandMoreIcon fontSize="small" sx={{ color: colors.base['grey'] }} />
                            )}
                        </>
                    )}
                </ListItemButton>
            </Tooltip>
            <Collapse in={collapsed || expanded} timeout="auto" unmountOnExit>
                {children}
            </Collapse>
        </>
    );
}

export function Sidebar() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const collapsed = useUIStore((s) => s.sidebarCollapsed);
    const mobileOpen = useUIStore((s) => s.sidebarMobileOpen);
    const closeMobileSidebar = useUIStore((s) => s.closeMobileSidebar);
    const { can } = usePermissions();
    const location = useLocation();
    const [systemUserExpanded, setSystemUserExpanded] = useState(true);

    const width = isMobile ? SIDEBAR_WIDTH : (collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH);
    const isCollapsed = isMobile ? false : collapsed;
    const handleNavClick = isMobile ? closeMobileSidebar : undefined;

    const dashboardItems = DASHBOARD_ITEMS.filter((item) => can(item.permission));
    // const dashboardItems = DASHBOARD_ITEMS
    const systemUserItems = SYSTEM_USER_ITEMS.filter((item) => can(item.permission));
    const settingsItems = SETTINGS_ITEMS.filter((item) => can(item.permission));
    // const settingsItems = SETTINGS_ITEMS

    return (
        <Drawer
            variant={isMobile ? 'temporary' : 'permanent'}
            open={isMobile ? mobileOpen : true}
            onClose={isMobile ? closeMobileSidebar : undefined}
            ModalProps={{ keepMounted: true }}
            sx={{
                width: isMobile ? 0 : width,
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
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    px: isCollapsed ? 1 : 2.5,
                    borderBottom: '1px solid',
                    borderColor: colors.border['default'],
                }}
            >
                {isCollapsed ? (
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
                <NavGroup label="Dashboard" collapsed={isCollapsed} />
                <List disablePadding>
                    {dashboardItems.map((item) => (
                        <NavItem
                            key={item.path}
                            item={item}
                            collapsed={isCollapsed}
                            isActive={location.pathname.startsWith(item.path)}
                            onClick={handleNavClick}
                        />
                    ))}
                </List>

                {/* Settings User group */}
                {systemUserItems.length > 0 && (
                    <NavGroupCollapsible
                        label="Settings User"
                        collapsed={isCollapsed}
                        expanded={systemUserExpanded}
                        onToggle={() => setSystemUserExpanded((prev) => !prev)}
                    >
                        <List disablePadding>
                            {systemUserItems.map((item) => (
                                <Box key={item.path} sx={{ pl: isCollapsed ? 0 : 1.5 }}>
                                    <NavItem
                                        item={item}
                                        collapsed={isCollapsed}
                                        isActive={location.pathname.startsWith(item.path)}
                                        onClick={handleNavClick}
                                    />
                                </Box>
                            ))}
                        </List>
                    </NavGroupCollapsible>
                )}

                {/* Settings group */}
                {settingsItems.length > 0 && (
                    <>
                        <NavGroup label="Settings" collapsed={isCollapsed} />
                        <List disablePadding>
                            {settingsItems.map((item) => (
                                <NavItem
                                    key={item.path}
                                    item={item}
                                    collapsed={isCollapsed}
                                    isActive={location.pathname.startsWith(item.path)}
                                    onClick={handleNavClick}
                                />
                            ))}
                        </List>
                    </>
                )}
            </Box>
        </Drawer>
    );
}
