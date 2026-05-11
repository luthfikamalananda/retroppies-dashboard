import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  Divider,
  Skeleton,
} from '@mui/material';
import { timersApi } from '../api/timers.api';
import { useUIStore } from '../stores/uiStore';
import { extractErrorMessage } from '../api/client';
import { ErrorAlert } from '../components/common/ErrorAlert';

const MAX_TIMER_SECONDS = 600;

const schema = z.object({
  payment_timer: z
    .number()
    .min(0, 'Minimal 0 detik')
    .max(MAX_TIMER_SECONDS, `Maksimal ${MAX_TIMER_SECONDS} detik`),
  photo_session_timer: z
    .number()
    .min(0, 'Minimal 0 detik')
    .max(MAX_TIMER_SECONDS, `Maksimal ${MAX_TIMER_SECONDS} detik`),
});

type FormValues = z.infer<typeof schema>;

export default function TimersPage() {
  const queryClient = useQueryClient();
  const showSnackbar = useUIStore((s) => s.showSnackbar);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['timers'],
    queryFn: timersApi.get,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: data
      ? { payment_timer: data.payment_timer, photo_session_timer: data.photo_session_timer }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => timersApi.update(values),
    onSuccess: (updated) => {
      queryClient.setQueryData(['timers'], updated);
      showSnackbar('Timer berhasil disimpan');
      reset({ payment_timer: updated.payment_timer, photo_session_timer: updated.photo_session_timer });
    },
    onError: (err) => showSnackbar(extractErrorMessage(err), 'error'),
  });

  if (isError) return <ErrorAlert onRetry={refetch} />;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Pengaturan Timer
      </Typography>

      <Card sx={{ maxWidth: 500 }}>
        <CardContent>
          {data?.reference_datetime && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Referensi Waktu (backend)
                </Typography>
                <Typography sx={{ fontWeight: 500 }}>{data.reference_datetime}</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
            </>
          )}

          <Stack
            component="form"
            onSubmit={handleSubmit((v) => mutation.mutate(v))}
            sx={{ gap: 3 }}
            noValidate
          >
            {isLoading ? (
              <>
                <Skeleton height={56} />
                <Skeleton height={56} />
              </>
            ) : (
              <>
                <TextField
                  label="Timer Pembayaran (detik)"
                  type="number"
                  fullWidth
                  error={!!errors.payment_timer}
                  helperText={
                    errors.payment_timer?.message ??
                    'Waktu tunggu pembayaran sebelum transaksi expired.'
                  }
                  slotProps={{ htmlInput: { min: 0, max: MAX_TIMER_SECONDS } }}
                  {...register('payment_timer', { valueAsNumber: true })}
                />

                <TextField
                  label="Timer Sesi Foto (detik)"
                  type="number"
                  fullWidth
                  error={!!errors.photo_session_timer}
                  helperText={
                    errors.photo_session_timer?.message ??
                    'Durasi sesi foto dalam detik.'
                  }
                  slotProps={{ htmlInput: { min: 0, max: MAX_TIMER_SECONDS } }}
                  {...register('photo_session_timer', { valueAsNumber: true })}
                />
              </>
            )}

            <Button
              type="submit"
              variant="contained"
              disabled={!isDirty || mutation.isPending || isLoading}
            >
              {mutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
