import { Alert, AlertDescription } from '@monorepo/ui/components/alert';
import { Button } from '@monorepo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@monorepo/ui/components/card';
import { CopyIcon, DownloadIcon, TriangleAlertIcon } from 'lucide-react';
import { toast } from 'sonner';

import { t } from '@/features/core/i18n';

/**
 * The ten recovery codes, readable only this once. Shown after enrolling and after regenerating;
 * only enrolling also signs every other session out, so the caller says whether to warn about it.
 */
export function TwoFactorRecoveryCodesCard({
  codes,
  warnOtherSessions,
  onDone,
}: {
  codes: string[];
  warnOtherSessions: boolean;
  onDone: () => void;
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      toast.success(t('auth.twoFactorCard.recoveryCodesCopied'));
    } catch {
      toast.error(t('core.errors.fallback'));
    }
  };

  const download = () => {
    const url = URL.createObjectURL(
      new Blob([`${codes.join('\n')}\n`], { type: 'text/plain' })
    );

    const link = document.createElement('a');

    link.href = url;
    link.download = 'recovery-codes.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('auth.twoFactorCard.recoveryCodesTitle')}</h2>
        </CardTitle>
        <CardDescription>
          {t('auth.twoFactorCard.recoveryCodesDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <ol className="bg-muted grid grid-cols-2 gap-2 rounded-md p-3 font-mono text-xs">
            {codes.map((code) => (
              <li key={code}>{code}</li>
            ))}
          </ol>
          {warnOtherSessions && (
            <Alert>
              <TriangleAlertIcon />
              <AlertDescription>
                {t('auth.twoFactorCard.otherSessionsSignedOut')}
              </AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void copy();
              }}
            >
              <CopyIcon data-icon="inline-start" />
              {t('auth.twoFactorCard.copy')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={download}
            >
              <DownloadIcon data-icon="inline-start" />
              {t('auth.twoFactorCard.download')}
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button type="button" onClick={onDone}>
          {t('auth.twoFactorCard.savedCodes')}
        </Button>
      </CardFooter>
    </Card>
  );
}
