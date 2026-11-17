import { buttonVariants } from '@monorepo/ui/components/button';
import { Link } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';

import type { FileRoutesByTo } from '@/routeTree.gen';

export type SideNavItem = {
  to: keyof FileRoutesByTo;
  label: string;
  icon: LucideIcon;
};

export function SideNav({
  label,
  items,
}: {
  label: string;
  items: readonly SideNavItem[];
}) {
  return (
    <nav
      aria-label={label}
      className="-mx-1 flex shrink-0 gap-1 overflow-x-auto px-1 md:w-48 md:flex-col"
    >
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: true, includeSearch: false }}
          className={buttonVariants({
            variant: 'ghost',
            className: 'justify-start',
          })}
          activeProps={{ className: 'bg-muted text-foreground' }}
        >
          <item.icon data-icon="inline-start" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
