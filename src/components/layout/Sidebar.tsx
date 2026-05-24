import BadgeIcon from '@mui/icons-material/BadgeOutlined';
import BusinessIcon from '@mui/icons-material/CorporateFareOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/PersonOutlineOutlined';
import {
    Box,
    Collapse,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import headerLogo from '../../assets/header-logo.svg';
import productIcon from '../../assets/product_icon.svg';
import transactionIcon from '../../assets/report-trx_icon.svg';
import settingIcon from '../../assets/setting_icon.svg';
import summaryIcon from '../../assets/summary_icon.svg';
import templateIcon from '../../assets/template_icon.svg';
import timerIcon from '../../assets/time_icon.svg';
import voucherIcon from '../../assets/voucher_icon.svg';
import { usePermissions } from '../../hooks/usePermissions';
import { useUIStore } from '../../stores/uiStore';
import { colors } from '../../theme/colors';

export const SIDEBAR_WIDTH = 300;
export const SIDEBAR_COLLAPSED_WIDTH = 64;

const DASHBOARD_ITEMS = [
    { label: 'Summary', path: '/app/dashboard', icon: <img src={summaryIcon} alt="Summary" />, permission: '*' },
    { label: 'Product', path: '/app/products', icon: <img src={productIcon} alt="Product" />, permission: 'products:read' },
    { label: 'Design Template', path: '/app/layouts', icon: <img src={templateIcon} alt="Design Template" />, permission: 'templates:read' },
    { label: 'Time', path: '/app/timers', icon: <img src={timerIcon} alt="Time" />, permission: 'rules:read' },
    { label: 'Voucher', path: '/app/vouchers', icon: <img src={voucherIcon} alt="Voucher" />, permission: 'vouchers:read' },
    { label: 'Report Transaction', path: '/app/transactions', icon: <img src={transactionIcon} alt="Report Transaction" />, permission: 'transactions:read' },
];

// const DASHBOARD_ITEMS = [
//     { label: 'Summary', path: '/app/dashboard', icon: <img src={summaryIcon} alt="Summary" />, permission: '*' },
//     { label: 'Product', path: '/app/products', icon: <img src={productIcon} alt="Product" />, permission: '*' },
//     { label: 'Design Template', path: '/app/layouts', icon: <img src={templateIcon} alt="Design Template" />, permission: '*' },
//     { label: 'Time', path: '/app/timers', icon: <img src={timerIcon} alt="Time" />, permission: '*' },
//     { label: 'Voucher', path: '/app/vouchers', icon: <img src={voucherIcon} alt="Voucher" />, permission: '*' },
//     { label: 'Report Transaction', path: '/app/transactions', icon: <img src={transactionIcon} alt="Report Transaction" />, permission: '*' },
// ];

const SETTING_USER_ITEMS = [
    { label: 'Tenant', path: '/app/tenants', icon: <BusinessIcon fontSize="small" />, permission: 'tenants:read' },
    { label: 'User', path: '/app/users', icon: <PersonIcon fontSize="small" />, permission: 'users:read' },
    { label: 'Role', path: '/app/roles', icon: <BadgeIcon fontSize="small" />, permission: 'roles:read' },
    // { label: 'Permission', path: '/app/permissions', icon: <SecurityIcon fontSize="small" />, permission: 'permissions:read' },
];

// const SETTING_USER_ITEMS = [
//     { label: 'Tenant', path: '/app/tenants', icon: <BusinessIcon fontSize="small" />, permission: '*' },
//     { label: 'User', path: '/app/users', icon: <PersonIcon fontSize="small" />, permission: '*' },
//     { label: 'Role', path: '/app/roles', icon: <BadgeIcon fontSize="small" />, permission: '*' },
//     // { label: 'Permission', path: '/app/permissions', icon: <SecurityIcon fontSize="small" />, permission: 'permissions:read' },
// ];

const SETTINGS_ITEMS = [
    { label: 'Manage Account', path: '/app/manage-account', icon: <img src={settingIcon} alt="Manage Account" />, permission: '*' },
];



function NavGroup({ label, collapsed }: { label: string; collapsed: boolean }) {
    if (collapsed) return <Box sx={{ height: 8 }} />;
    return (
        <Typography
            sx={{
                // px: 2,
                pt: 1.5,
                pb: 1,
                display: 'block',
                color: colors.base['black'],
                fontWeight: 600,
                // letterSpacing: '0.04em',
                textTransform: 'capitalize',
                fontSize: 16,
                fontFamily: "public sans, sans-serif",
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
                                    fontWeight: isActive ? 600 : 500,
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
                        mt: 0.5,
                        minHeight: 40,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        px: 1.5,
                        gap: 1.25,
                        // p:0,
                        py: 1,
                        pr: 1,
                        color: colors.base['black'],
                        '&:hover': { bgcolor: colors.base['background-light'] },
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 0, color: 'inherit' }}>
                        <img src={settingIcon} alt="Setting User" />
                    </ListItemIcon>
                    {!collapsed && (
                        <>
                            <ListItemText
                                primary={label}
                                slotProps={{
                                    primary: {
                                        style: {
                                            fontSize: 15,
                                            fontWeight: 500,
                                            // letterSpacing: '0.04em',
                                            textTransform: 'capitalize',
                                            color: colors.base['black'],
                                            // fontFamily: "public sans, sans-serif",
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
    const systemUserItems = SETTING_USER_ITEMS.filter((item) => can(item.permission));
    const settingsItems = SETTINGS_ITEMS.filter((item) => can(item.permission));

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
                        sx={{ width: "150px", objectFit: 'contain' }}
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
                        label="Setting User"
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


                <NavGroup label="Settings" collapsed={isCollapsed} />
                {settingsItems.map((item) => (
                    <NavItem
                        key={item.path}
                        item={item}
                        collapsed={isCollapsed}
                        isActive={location.pathname.startsWith(item.path)}
                        onClick={handleNavClick}
                    />
                ))}

            </Box>
        </Drawer>
    );
}
