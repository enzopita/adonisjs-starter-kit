import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@monorepo/ui/components/dialog';

import { PagedAuditTrail } from '@/features/audit/components/paged-audit-trail';
import type {
  AuditSubject,
  PermissionLabel,
} from '@/features/audit/event-text';
import { EMBEDDED_PER_PAGE, auditEventsQuery } from '@/features/audit/queries';
import { t } from '@/features/core/i18n';

/** One record's trail. The API lets its feature's permission read it without audit.view. */
export function AuditHistoryDialog({
  subject,
  name,
  tenantId,
  permissionLabel,
  open,
  onOpenChange,
}: {
  subject: AuditSubject;
  name: string;
  tenantId: string;
  permissionLabel: PermissionLabel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeLabel={t('audit.historyDialog.close')}
        className="sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle>{t('audit.historyDialog.title', { name })}</DialogTitle>
          <DialogDescription>
            {t('audit.historyDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <PagedAuditTrail
          query={(page) =>
            auditEventsQuery(tenantId, {
              subject,
              page,
              perPage: EMBEDDED_PER_PAGE,
            })
          }
          empty={t('audit.historyDialog.empty')}
          permissionLabel={permissionLabel}
          scrollable
        />
      </DialogContent>
    </Dialog>
  );
}
