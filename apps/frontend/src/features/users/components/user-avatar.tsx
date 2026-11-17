import type { Data } from '@monorepo/backend/data';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@monorepo/ui/components/avatar';
import type { ComponentProps } from 'react';

type AvatarUser = Pick<Data.Users.User, 'initials' | 'avatar'>;

export function UserAvatar({
  user,
  alt = '',
  ...props
}: ComponentProps<typeof Avatar> & { user: AvatarUser; alt?: string }) {
  return (
    <Avatar {...props}>
      {user.avatar && <AvatarImage src={user.avatar.url} alt={alt} />}
      <AvatarFallback>{user.initials}</AvatarFallback>
    </Avatar>
  );
}
