import { Button } from '@monorepo/ui/components/button';
import { Loader2Icon } from 'lucide-react';
import type { ComponentProps } from 'react';

export function PendingButton({
  pending,
  children,
  ...props
}: ComponentProps<typeof Button> & { pending: boolean }) {
  return (
    <Button disabled={pending} {...props}>
      {pending && (
        <Loader2Icon data-icon="inline-start" className="animate-spin" />
      )}
      {children}
    </Button>
  );
}
