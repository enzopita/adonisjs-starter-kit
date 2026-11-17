import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@monorepo/ui/components/card'
import { Field, FieldGroup, FieldLabel } from '@monorepo/ui/components/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@monorepo/ui/components/select'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queries } from '@/features/core/api'
import { TIME_ZONES, useTimeZone } from '@/features/core/datetime'
import { errorMessage } from '@/features/core/errors'
import { locale, t } from '@/features/core/i18n'
import { LOCALES, LOCALE_LABELS } from '@/features/core/locales'
import type { Locale } from '@/features/core/locales'
import { preferences } from '@/features/core/preferences'
import { profileQuery } from '@/features/users/profile'

/** The account's language and time zone, PATCHed to the server on every change. */
export function PreferencesCard() {
  const user = useSuspenseQuery(profileQuery()).data.data
  const timeZone = useTimeZone()

  const update = useMutation(
    queries.profile.profile.update.mutationOptions({
      onError: error => toast.error(errorMessage(error)),
    }),
  )

  const changeLocale = (next: string | null) => {
    if (next === null || next === (user.locale ?? locale)) return

    // SAFETY: `next` came from a SelectItem value this card built from LOCALES.
    const nextLocale = next as Locale

    update.mutate(
      { body: { locale: nextLocale } },
      {
        onSuccess: () => {
          preferences.set({ locale: nextLocale })
          window.location.reload()
        },
      },
    )
  }

  const changeTimeZone = (next: string | null) => {
    if (next === null || next === (user.timezone ?? timeZone)) return

    update.mutate(
      { body: { timezone: next } },
      {
        onSuccess: () => {
          preferences.set({ timeZone: next })
          toast.success(t('users.preferencesCard.saved'))
        },
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('users.preferencesCard.title')}</h2>
        </CardTitle>
        <CardDescription>{t('users.preferencesCard.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="preferences-locale">
              {t('users.preferencesCard.language')}
            </FieldLabel>
            <Select
              items={LOCALES.map(value => ({ value, label: LOCALE_LABELS[value] }))}
              value={user.locale ?? locale}
              onValueChange={changeLocale}
              disabled={update.isPending}
            >
              <SelectTrigger id="preferences-locale">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {LOCALES.map(value => (
                    <SelectItem key={value} value={value}>
                      {LOCALE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="preferences-time-zone">
              {t('users.preferencesCard.timeZone')}
            </FieldLabel>
            <Select
              items={TIME_ZONES}
              value={user.timezone ?? timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone}
              onValueChange={changeTimeZone}
              disabled={update.isPending}
            >
              <SelectTrigger id="preferences-time-zone" className="max-w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {TIME_ZONES.map(zone => (
                    <SelectItem key={zone.value} value={zone.value}>
                      {zone.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
