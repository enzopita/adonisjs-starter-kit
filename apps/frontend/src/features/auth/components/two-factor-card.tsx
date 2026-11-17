import { Alert, AlertDescription } from '@monorepo/ui/components/alert';
import { Badge } from '@monorepo/ui/components/badge';
import { Button } from '@monorepo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@monorepo/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@monorepo/ui/components/dialog';
import { Skeleton } from '@monorepo/ui/components/skeleton';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CircleAlertIcon, ShieldCheckIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { TwoFactorEnrollCard } from '@/features/auth/components/two-factor-enroll-card';
import { TwoFactorRecoveryCodesCard } from '@/features/auth/components/two-factor-recovery-codes-card';
import { twoFactorQuery } from '@/features/auth/two-factor';
import { queries } from '@/features/core/api';
import { PendingButton } from '@/features/core/components/pending-button';
import { errorMessage } from '@/features/core/errors';
import { useAppForm, withFormErrors } from '@/features/core/form';
import { t } from '@/features/core/i18n';

type Enrollment = { secret: string; uri: string };

/** Shown once, right after confirming or regenerating; only confirming also signs out other sessions. */
type RevealedRecoveryCodes = { codes: string[]; warnOtherSessions: boolean };

/** Two-factor status and its enroll, disable and regenerate flows, for the profile page. */
export function TwoFactorCard() {
  const status = useQuery(twoFactorQuery());
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [recoveryCodes, setRecoveryCodes] =
    useState<RevealedRecoveryCodes | null>(null);
  const [disableOpen, setDisableOpen] = useState(false);
  const [regenerateOpen, setRegenerateOpen] = useState(false);

  const start = useMutation(
    queries.profile.twoFactor.store.mutationOptions({
      onSuccess: ({ data }) => setEnrollment(data),
      onError: (error) => toast.error(errorMessage(error)),
    })
  );

  if (recoveryCodes) {
    return (
      <TwoFactorRecoveryCodesCard
        codes={recoveryCodes.codes}
        warnOtherSessions={recoveryCodes.warnOtherSessions}
        onDone={() => setRecoveryCodes(null)}
      />
    );
  }

  if (enrollment) {
    return (
      <TwoFactorEnrollCard
        secret={enrollment.secret}
        uri={enrollment.uri}
        onConfirmed={(codes) => {
          setEnrollment(null);
          setRecoveryCodes({ codes, warnOtherSessions: true });
        }}
        onCancel={() => setEnrollment(null)}
      />
    );
  }

  return (
    <Card id="two-factor">
      <CardHeader>
        <CardTitle>
          <h2>{t('auth.twoFactorCard.title')}</h2>
        </CardTitle>
        <CardDescription>{t('auth.twoFactorCard.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {status.isPending && <Skeleton className="h-10" />}

        {status.isError && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{errorMessage(status.error)}</AlertDescription>
          </Alert>
        )}

        {status.isSuccess &&
          (status.data.data.enabled ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  <ShieldCheckIcon data-icon="inline-start" />
                  {t('auth.twoFactorCard.enabled')}
                </Badge>
                <span className="text-muted-foreground text-xs">
                  {t('auth.twoFactorCard.recoveryCodesLeft', {
                    count: status.data.data.recoveryCodesLeft,
                  })}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRegenerateOpen(true)}
                >
                  {t('auth.twoFactorCard.regenerate')}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setDisableOpen(true)}
                >
                  {t('auth.twoFactorCard.disable')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-muted-foreground text-xs">
                {t('auth.twoFactorCard.offExplanation')}
              </p>
              <div>
                <PendingButton
                  pending={start.isPending}
                  onClick={() => start.mutate({})}
                >
                  {t('auth.twoFactorCard.enable')}
                </PendingButton>
              </div>
            </div>
          ))}

        {disableOpen && (
          <DisableTwoFactorDialog open onOpenChange={setDisableOpen} />
        )}
        {regenerateOpen && (
          <RegenerateRecoveryCodesDialog
            open
            onOpenChange={setRegenerateOpen}
            onRegenerated={(codes) => {
              setRegenerateOpen(false);
              setRecoveryCodes({ codes, warnOtherSessions: false });
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

function DisableTwoFactorDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const disable = useMutation(
    queries.profile.twoFactor.destroy.mutationOptions()
  );
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  const form = useAppForm({
    defaultValues: { password: '', code: '', recoveryCode: '' },
    onSubmit: async ({ value, formApi }) => {
      const body = useRecoveryCode
        ? { password: value.password, recoveryCode: value.recoveryCode }
        : { password: value.password, code: value.code };

      const disabled = await withFormErrors(
        formApi,
        disable.mutateAsync({ body })
      );

      if (!disabled) return;

      onOpenChange(false);
      toast.success(t('auth.twoFactorCard.disabled'));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('auth.twoFactorCard.close')}>
        <DialogHeader>
          <DialogTitle>{t('auth.twoFactorCard.disableTitle')}</DialogTitle>
          <DialogDescription>
            {t('auth.twoFactorCard.disableDescription')}
          </DialogDescription>
        </DialogHeader>
        <form.AppForm>
          <form.Form className="flex flex-col gap-4">
            <form.FormAlert />
            <form.AppField name="password">
              {(field) => (
                <field.TextField
                  label={t('auth.twoFactorCard.password')}
                  type="password"
                  autoComplete="current-password"
                  required
                />
              )}
            </form.AppField>
            {useRecoveryCode ? (
              <form.AppField name="recoveryCode">
                {(field) => (
                  <field.TextField
                    label={t('auth.twoFactorCard.recoveryCode')}
                    autoComplete="off"
                    required
                  />
                )}
              </form.AppField>
            ) : (
              <form.AppField name="code">
                {(field) => (
                  <field.TextField
                    label={t('auth.twoFactorCard.code')}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    required
                  />
                )}
              </form.AppField>
            )}
            <button
              type="button"
              onClick={() => setUseRecoveryCode((value) => !value)}
              className="text-muted-foreground self-start text-xs underline underline-offset-4"
            >
              {useRecoveryCode
                ? t('auth.twoFactorCard.useCode')
                : t('auth.twoFactorCard.useRecoveryCode')}
            </button>
            <DialogFooter>
              <form.SubmitButton variant="destructive">
                {t('auth.twoFactorCard.disable')}
              </form.SubmitButton>
            </DialogFooter>
          </form.Form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}

function RegenerateRecoveryCodesDialog({
  open,
  onOpenChange,
  onRegenerated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegenerated: (recoveryCodes: string[]) => void;
}) {
  const regenerate = useMutation(
    queries.profile.twoFactor.regenerateRecoveryCodes.mutationOptions()
  );

  const form = useAppForm({
    defaultValues: { password: '', code: '' },
    onSubmit: async ({ value, formApi }) => {
      const regenerated = await withFormErrors(
        formApi,
        regenerate.mutateAsync({ body: value })
      );

      if (regenerated) onRegenerated(regenerated.data.recoveryCodes);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('auth.twoFactorCard.close')}>
        <DialogHeader>
          <DialogTitle>{t('auth.twoFactorCard.regenerateTitle')}</DialogTitle>
          <DialogDescription>
            {t('auth.twoFactorCard.regenerateDescription')}
          </DialogDescription>
        </DialogHeader>
        <form.AppForm>
          <form.Form className="flex flex-col gap-4">
            <form.FormAlert />
            <form.AppField name="password">
              {(field) => (
                <field.TextField
                  label={t('auth.twoFactorCard.password')}
                  type="password"
                  autoComplete="current-password"
                  required
                />
              )}
            </form.AppField>
            <form.AppField name="code">
              {(field) => (
                <field.TextField
                  label={t('auth.twoFactorCard.code')}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  required
                />
              )}
            </form.AppField>
            <DialogFooter>
              <form.SubmitButton>
                {t('auth.twoFactorCard.regenerate')}
              </form.SubmitButton>
            </DialogFooter>
          </form.Form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}
