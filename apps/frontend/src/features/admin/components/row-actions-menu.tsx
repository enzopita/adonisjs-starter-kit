import { Button } from '@monorepo/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@monorepo/ui/components/dropdown-menu';
import { MoreHorizontalIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type RowAction = {
  key: string;
  label: string;
  icon: LucideIcon;
  destructive?: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

export function RowActionsMenu({
  label,
  actions,
}: {
  label: string;
  actions: RowAction[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={label} />}
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto max-w-xs">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.key}
            variant={action.destructive ? 'destructive' : 'default'}
            disabled={action.disabled}
            onClick={() => {
              action.onSelect();
            }}
            className="whitespace-nowrap"
          >
            <action.icon />
            <span className="truncate">{action.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
