import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@monorepo/ui/components/card';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import type { TuyauError } from '@tuyau/core/client';
import { useRef } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { toast } from 'sonner';

import { queries } from '@/features/core/api';
import { PageHeader } from '@/features/core/components/page-header';
import { PendingButton } from '@/features/core/components/pending-button';
import { DATE_LONG, formatDate, useTimeZone } from '@/features/core/datetime';
import { errorMessage } from '@/features/core/errors';
import { t } from '@/features/core/i18n';
import { useIsImpersonating } from '@/features/core/session';
import { PreferencesCard } from '@/features/users/components/preferences-card';
import { UserAvatar } from '@/features/users/components/user-avatar';
import { profileQuery } from '@/features/users/profile';

/** `children` render below the profile's own cards: sections other features own. */
export function ProfilePage({ children }: { children?: ReactNode }) {
  const user = useSuspenseQuery(profileQuery()).data.data;
  const timeZone = useTimeZone();
  const impersonating = useIsImpersonating();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title={t('users.profilePage.title')}
        description={t('users.profilePage.description')}
      />
      <AvatarCard />
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t('users.profilePage.details')}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-xs sm:grid-cols-3">
            <dt className="text-muted-foreground">
              {t('users.profilePage.name')}
            </dt>
            <dd className="sm:col-span-2">{user.fullName ?? '—'}</dd>
            <dt className="text-muted-foreground">
              {t('users.profilePage.email')}
            </dt>
            <dd className="break-all sm:col-span-2">{user.email}</dd>
            <dt className="text-muted-foreground">
              {t('users.profilePage.memberSince')}
            </dt>
            <dd className="sm:col-span-2">
              {formatDate(user.createdAt, DATE_LONG, timeZone) ?? '—'}
            </dd>
          </dl>
        </CardContent>
      </Card>
      {/* Saving this card writes the viewer's own browser language/zone: hidden while an admin
          impersonates, so it never switches the admin's own browser instead of the user's. */}
      {!impersonating && <PreferencesCard />}
      {children}
    </main>
  );
}

const AVATAR_TYPES = 'image/png,image/jpeg,image/webp';

function AvatarCard() {
  const user = useSuspenseQuery(profileQuery()).data.data;
  const fileInput = useRef<HTMLInputElement>(null);

  const uploadFile = useMutation(
    queries.attachments.attachments.store.mutationOptions({
      onError: showError,
    })
  );

  const setAvatar = useMutation(
    queries.profile.avatar.update.mutationOptions({
      onSuccess: (_, { body }) =>
        toast.success(
          body.attachmentId === null
            ? t('users.profilePage.photoRemoved')
            : t('users.profilePage.photoUpdated')
        ),
      onError: showError,
    })
  );

  const pending = uploadFile.isPending || setAvatar.isPending;

  const removing =
    setAvatar.isPending && setAvatar.variables.body.attachmentId === null;

  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    uploadFile.mutate(
      { body: { file } },
      {
        onSuccess: (attachment) => {
          setAvatar.mutate({ body: { attachmentId: attachment.data.id } });
        },
        onSettled: () => {
          input.value = '';
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('users.profilePage.photo')}</h2>
        </CardTitle>
        <CardDescription>
          {t('users.profilePage.photoDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4">
          <UserAvatar
            user={user}
            alt={t('users.profilePage.yourPhoto')}
            className="size-16"
          />
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInput}
              type="file"
              accept={AVATAR_TYPES}
              aria-label={t('users.profilePage.photoFile')}
              tabIndex={-1}
              className="sr-only"
              onChange={upload}
            />
            <PendingButton
              variant="outline"
              pending={pending && !removing}
              disabled={pending}
              onClick={() => fileInput.current?.click()}
            >
              {user.avatar
                ? t('users.profilePage.replacePhoto')
                : t('users.profilePage.uploadPhoto')}
            </PendingButton>
            {user.avatar && (
              <PendingButton
                variant="ghost"
                pending={removing}
                disabled={pending}
                onClick={() => {
                  setAvatar.mutate({ body: { attachmentId: null } });
                }}
              >
                {t('users.profilePage.removePhoto')}
              </PendingButton>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function showError(error: TuyauError) {
  toast.error(errorMessage(error));
}
