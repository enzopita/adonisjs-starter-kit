import { Link } from '@tanstack/react-router';
import { BoxIcon } from 'lucide-react';

export function AppMark() {
  return (
    <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
      <span className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
        <BoxIcon className="size-3.5" />
      </span>
      {/* oxlint-disable-next-line i18n/no-untranslated-text -- product name, not translated */}
      Starter
    </Link>
  );
}
