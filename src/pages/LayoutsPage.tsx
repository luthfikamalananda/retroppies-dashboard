import HomeIcon from '@mui/icons-material/Home';
import {
    Box,
    Breadcrumbs,
    Button,
    Card,
    Grid,
    Link,
    Stack,
    Typography,
} from '@mui/material';
import { NavLink, useNavigate } from 'react-router-dom';
import { type Layout } from '../api/layouts.api';
import layout1 from '../assets/layout-1.png';
import layout2 from '../assets/layout-2.png';
import layout3 from '../assets/layout-3.png';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { colors } from '../theme/colors';


function SkeletonCard() {
    return (
        <Card sx={{ display: 'flex', borderRadius: 2, border: `1px solid ${colors.border['light']}`, boxShadow: 'none', overflow: 'hidden' }}>
            <Box sx={{ width: 140, minHeight: 160, bgcolor: 'grey.200', flexShrink: 0 }} />
            <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box sx={{ height: 20, bgcolor: 'grey.200', borderRadius: 1, width: '60%' }} />
                <Box sx={{ height: 36, bgcolor: 'grey.200', borderRadius: 1, width: '50%', alignSelf: 'flex-end' }} />
            </Box>
        </Card>
    );
}

const dataHardocoded = [
    {
        id: 1,
        name: 'Layout 1',
        thumbnailUrl: layout1
    },
    {
        id: 2,
        name: 'Layout 2',
        thumbnailUrl: layout2
    },
    {
        id: 3,
        name: 'Layout 3',
        thumbnailUrl: layout3
    }
]

export default function LayoutsPage() {
    const navigate = useNavigate();

    // const { data, isLoading, isError, refetch } = useQuery({
    //     queryKey: ['layouts', user?.tenantId],
    //     // queryFn: () => layoutsApi.list({ page: 1, tenantId: user?.tenantId ?? 0, limit: 50 }),
    //     queryFn: () => layoutsApi.list(),
    //     enabled: !!user?.tenantId,
    // });

    // const layouts = data?.result ?? [];

    const layouts = dataHardocoded;
    const isLoading = false;
    const isError = false;
    const refetch = () => {};

    return (
        <Box>
            <Breadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb">
                <Link
                    component={NavLink}
                    to="/app/dashboard"
                    sx={{ display: 'flex', alignItems: 'center', color: colors.base['grey'], textDecoration: 'none' }}
                >
                    <HomeIcon sx={{ fontSize: 18 }} />
                </Link>
                {/* <Typography sx={{ color: colors.base['grey'], fontSize: 14 }}>Template &amp; Layout</Typography> */}
                <Typography sx={{ color: colors.base['black'], fontSize: 14, fontWeight: 500 }}>Layout</Typography>
            </Breadcrumbs>

            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: colors.base['black'] }}>
                    Layout
                </Typography>
            </Stack>

            {isError && <ErrorAlert onRetry={refetch} />}

            {!isLoading && layouts.length === 0 && (
                <EmptyState message="Belum ada data layout." />
            )}

            <Grid container spacing={2}>
                {(isLoading ? Array.from({ length: 4 }) : layouts).map((item, idx) => {
                    const layout = item as Layout | undefined;

                    if (isLoading || !layout) {
                        return (
                            <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                                <SkeletonCard />
                            </Grid>
                        );
                    }

                    return (
                        <Grid size={{ xs: 12, sm: 6 }} key={layout.id}>
                            <Card
                                sx={{
                                    display: 'flex',
                                    borderRadius: 2,
                                    border: `1px solid ${colors.border['light']}`,
                                    boxShadow: 'none',
                                    overflow: 'hidden',
                                    bgcolor: colors.base['white'],
                                    transition: 'box-shadow 0.15s',
                                    '&:hover': { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
                                }}
                            >
                                {/* Thumbnail */}
                                <Box
                                    sx={{
                                        width: 140,
                                        minHeight: 160,
                                        flexShrink: 0,
                                        bgcolor: colors.base['section'],
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {layout.thumbnailUrl ? (
                                        <Box
                                            component="img"
                                            src={layout.thumbnailUrl}
                                            alt={layout.name}
                                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <Box sx={{ width: '100%', height: '100%', bgcolor: colors.base['section'] }} />
                                    )}
                                </Box>

                                {/* Content */}
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
                                    <Typography sx={{ fontWeight: 600, fontSize: 15, color: colors.base['black'] }}>
                                        {layout.name}
                                    </Typography>

                                    <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 1 }}>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => navigate(`/app/layouts/${layout.id}/templates`)}
                                            sx={{
                                                bgcolor: colors.brand[500],
                                                '&:hover': { bgcolor: colors.brand[600] },
                                                textTransform: 'none',
                                                borderRadius: 1.5,
                                                fontWeight: 600,
                                                fontSize: 13,
                                                px: 2,
                                            }}
                                        >
                                            Choose Layout
                                        </Button>
                                    </Stack>
                                </Box>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
}
