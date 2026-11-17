import type { Data } from '@monorepo/backend/data';
import { Button } from '@monorepo/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@monorepo/ui/components/dropdown-menu';
import { Link, useRouter } from '@tanstack/react-router';
import { LogOutIcon, SunMoonIcon, UserIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { ReactNode } from 'react';

import { logOut } from '@/features/core/api';
import { displayName } from '@/features/core/display-name';
import { t } from '@/features/core/i18n';
import { UserAvatar } from '@/features/users/components/user-avatar';

const THEMES = [
  { value: 'light', label: t('users.userMenu.light') },
  { value: 'dark', label: t('users.userMenu.dark') },
  { value: 'system', label: t('users.userMenu.system') },
];

/** `children` are extra menu items other features add, composed by the route. */
export function UserMenu({
  user,
  children,
}: {
  user: Data.Users.User;
  children?: ReactNode;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const onLogOut = async () => {
    await logOut();
    await router.navigate({ to: '/login' });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={t('users.userMenu.accountMenu')}
          />
        }
      >
        <UserAvatar user={user} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col">
            <span className="text-foreground truncate font-medium">
              {displayName(user)}
            </span>
            {user.fullName && <span className="truncate">{user.email}</span>}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to="/profile" />}>
          <UserIcon />
          {t('users.userMenu.profile')}
        </DropdownMenuItem>
        {children}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SunMoonIcon />
            {t('users.userMenu.theme')}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              {THEMES.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogOut}>
          <LogOutIcon />
          {t('users.userMenu.logOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
