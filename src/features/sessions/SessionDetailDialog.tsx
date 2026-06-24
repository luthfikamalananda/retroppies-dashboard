import {
    Dialog,
    DialogContent,
    DialogTitle,
    Tabs,
    Tab,
    Box,
    Grid,
} from '@mui/material';
import { useState } from 'react';

interface Props {
    open: boolean;
    session: any;
    onClose: () => void;
}

export function SessionDetailDialog({
    open,
    session,
    onClose,
}: Props) {
    const [tab, setTab] = useState(0);

    if (!session) return null;

    const rawPhotos = [
        session.photo2Url,
        session.photo3Url,
        session.photo4Url,
        session.photo5Url,
    ];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
        >
            <DialogTitle>
                {session.sessionCode}
            </DialogTitle>

            <DialogContent>
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    sx={{ mb: 3 }}
                >
                    <Tab label="RAW Photo" />
                    <Tab label="Photo Frame" />
                    <Tab label="GIF" />
                    <Tab label="Video" />
                </Tabs>

                {tab === 0 && (
                    <Grid container spacing={2}>
                        {rawPhotos.map((url) => (
                            <Grid size={{ xs: 12, md: 6 }} key={url}>
                                <Box
                                    component="img"
                                    src={url}
                                    sx={{
                                        width: '100%',
                                        borderRadius: 2,
                                    }}
                                />
                            </Grid>
                        ))}
                    </Grid>
                )}

                {tab === 1 && (
                    <Box
                        component="img"
                        src={session.photo1Url}
                        sx={{
                            width: '100%',
                            borderRadius: 2,
                        }}
                    />
                )}

                {tab === 2 && (
                    <Box
                        component="img"
                        src={session.gifUrl}
                        sx={{
                            width: '100%',
                            borderRadius: 2,
                        }}
                    />
                )}

                {tab === 3 && (
                    <video
                        controls
                        style={{
                            width: '100%',
                            borderRadius: 12,
                        }}
                    >
                        <source
                            src={session.videoUrl}
                            type="video/mp4"
                        />
                    </video>
                )}
            </DialogContent>
        </Dialog>
    );
}