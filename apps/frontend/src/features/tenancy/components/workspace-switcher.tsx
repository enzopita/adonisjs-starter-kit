import { Button } from '@monorepo/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@monorepo/ui/components/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@monorepo/ui/components/dropdown-menu';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';

import { t } from '@/features/core/i18n';
import { CreateWorkspaceForm } from '@/features/tenancy/components/create-workspace-form';
import {
  activeTenant,
  selectWorkspace,
  tenantsQuery,
  useChosenTenantId,
} from '@/features/tenancy/workspace';

/** A focused menu item recolors every descendant's text, so the initial pins its own color. */
function WorkspaceInitial({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="bg-primary text-primary-foreground! flex size-5 shrink-0 items-center justify-center rounded-sm text-xs font-semibold uppercase"
    >
      {name.trim().charAt(0)}
    </span>
  );
}

export function WorkspaceSwitcher() {
  const { data: tenants } = useSuspenseQuery(tenantsQuery());
  const current = activeTenant(tenants.data, useChosenTenantId());
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const open = async (tenantId: string) => {
    selectWorkspace(tenantId);
    await navigate({ to: '/' });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" className="max-w-56 min-w-0" />}
        >
          {current && <WorkspaceInitial name={current.name} />}
          <span className="sr-only">
            {t('tenancy.workspaceSwitcher.workspaceLabel')}
          </span>
          <span className="truncate">
            {current?.name ?? t('tenancy.workspaceSwitcher.selectWorkspace')}
          </span>
          <ChevronsUpDownIcon
            data-icon="inline-end"
            className="text-muted-foreground"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60">
          {tenants.data.length > 0 && (
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                {t('tenancy.workspaceSwitcher.workspaces')}
              </DropdownMenuLabel>
              {tenants.data.map((tenant) => (
                <DropdownMenuItem
                  key={tenant.id}
                  onClick={() => open(tenant.id)}
                >
                  <WorkspaceInitial name={tenant.name} />
                  <span className="truncate">{tenant.name}</span>
                  {tenant.id === current?.id && (
                    <CheckIcon className="ml-auto" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}
          {tenants.data.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem onClick={() => setCreating(true)}>
            <PlusIcon />
            {t('tenancy.workspaceSwitcher.newWorkspace')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent closeLabel={t('tenancy.workspaceSwitcher.close')}>
          <DialogHeader>
            <DialogTitle>
              {t('tenancy.workspaceSwitcher.newWorkspace')}
            </DialogTitle>
            <DialogDescription>
              {t('tenancy.workspaceSwitcher.newWorkspaceDescription')}
            </DialogDescription>
          </DialogHeader>
          <CreateWorkspaceForm onCreated={() => setCreating(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
