import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@monorepo/ui/components/alert-dialog';
import type { ReactNode } from 'react';

import { PendingButton } from '@/features/core/components/pending-button';
import { t } from '@/features/core/i18n';

/** A destructive action behind a confirm step; stays open on failure so the caller's error shows. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = t('core.confirmDialog.delete'),
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmLabel?: string;
  pending: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            {t('core.confirmDialog.cancel')}
          </AlertDialogCancel>
          <PendingButton
            variant="destructive"
            pending={pending}
            onClick={onConfirm}
          >
            {confirmLabel}
          </PendingButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
