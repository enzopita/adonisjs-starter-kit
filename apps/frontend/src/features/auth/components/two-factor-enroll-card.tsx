import { Button } from '@monorepo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@monorepo/ui/components/card';
import { Field, FieldLabel } from '@monorepo/ui/components/field';
import { Input } from '@monorepo/ui/components/input';
import { useMutation } from '@tanstack/react-query';
import { CopyIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useId } from 'react';
import { toast } from 'sonner';

import { queries } from '@/features/core/api';
import { useAppForm, withFormErrors } from '@/features/core/form';
import { t } from '@/features/core/i18n';

/** The pending secret from `POST /account/two-factor`: a QR code, its text, and a code to confirm. */
export function TwoFactorEnrollCard({
  secret,
  uri,
  onConfirmed,
  onCancel,
}: {
  secret: string;
  uri: string;
  onConfirmed: (recoveryCodes: string[]) => void;
  onCancel: () => void;
}) {
  const confirm = useMutation(
    queries.profile.twoFactor.confirm.mutationOptions()
  );

  const secretId = useId();

  const form = useAppForm({
    defaultValues: { password: '', code: '' },
    onSubmit: async ({ value, formApi }) => {
      const confirmed = await withFormErrors(
        formApi,
        confirm.mutateAsync({ body: value })
      );

      if (confirmed) {
        onConfirmed(confirmed.data.recoveryCodes);
      }
    },
  });

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      toast.success(t('auth.twoFactorCard.secretCopied'));
    } catch {
      toast.error(t('core.errors.fallback'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('auth.twoFactorCard.enrollTitle')}</h2>
        </CardTitle>
        <CardDescription>
          {t('auth.twoFactorCard.enrollDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex justify-center rounded-md bg-white p-4">
            <QRCodeSVG value={uri} size={176} />
          </div>
          <Field>
            <FieldLabel htmlFor={secretId}>
              {t('auth.twoFactorCard.manualSecret')}
            </FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                id={secretId}
                readOnly
                value={secret}
                onFocus={(event) => {
                  event.target.select();
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  void copySecret();
                }}
                aria-label={t('auth.twoFactorCard.copy')}
              >
                <CopyIcon />
              </Button>
            </div>
          </Field>
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
              <div className="flex gap-2">
                <form.SubmitButton>
                  {t('auth.twoFactorCard.confirm')}
                </form.SubmitButton>
                <Button type="button" variant="ghost" onClick={onCancel}>
                  {t('auth.twoFactorCard.cancel')}
                </Button>
              </div>
            </form.Form>
          </form.AppForm>
        </div>
      </CardContent>
    </Card>
  );
}
