import { Alert, AlertDescription } from '@monorepo/ui/components/alert'
import { Field, FieldDescription, FieldError, FieldLabel } from '@monorepo/ui/components/field'
import { Input } from '@monorepo/ui/components/input'
import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import type { AnyFormApi } from '@tanstack/react-form'
import { CircleAlertIcon } from 'lucide-react'
import { useId } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { PendingButton } from '@/features/core/components/pending-button'
import { formErrors, isTuyauError } from '@/features/core/errors'

const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts()

type TextFieldProps = Omit<
  ComponentProps<typeof Input>,
  'id' | 'name' | 'value' | 'onChange' | 'onBlur'
> & {
  label: string
  description?: ReactNode
}

function TextField({ label, description, ...props }: TextFieldProps) {
  const field = useFieldContext<string>()
  const id = useId()
  // SAFETY: every error this app puts on a field is a message string (see withFormErrors).
  const error = field.state.meta.errors[0] as string | undefined

  return (
    <Field data-invalid={error !== undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        name={field.name}
        value={field.state.value}
        onChange={event => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={error !== undefined}
        {...props}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{error}</FieldError>
    </Field>
  )
}

function Form({ className, children }: { className?: string; children: ReactNode }) {
  const form = useFormContext()

  return (
    <form
      className={className}
      onSubmit={event => {
        event.preventDefault()
        // The last submit's server errors would otherwise keep the form invalid, and TanStack
        // Form skips onSubmit for an invalid form.
        form.setErrorMap({ onSubmit: { fields: {} } })
        void form.handleSubmit()
      }}
    >
      {children}
    </form>
  )
}

function FormAlert() {
  const form = useFormContext()

  return (
    <form.Subscribe selector={state => String(state.errorMap.onSubmit ?? '')}>
      {error =>
        error ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null
      }
    </form.Subscribe>
  )
}

function SubmitButton(props: Omit<ComponentProps<typeof PendingButton>, 'pending' | 'type'>) {
  const form = useFormContext()

  return (
    <form.Subscribe selector={state => state.isSubmitting}>
      {isSubmitting => <PendingButton type="submit" pending={isSubmitting} {...props} />}
    </form.Subscribe>
  )
}

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField },
  formComponents: { Form, FormAlert, SubmitButton },
})

/**
 * Awaits a form's write and, when the API refuses it, shows why on the form: per field for a 422,
 * in the form's alert otherwise. Resolves to null on failure; the next submit clears the errors.
 */
export async function withFormErrors<Result>(
  formApi: AnyFormApi,
  write: Promise<Result>,
): Promise<Result | null> {
  try {
    return await write
  } catch (error) {
    if (!isTuyauError(error)) throw error

    formApi.setErrorMap({ onSubmit: formErrors(error) })

    return null
  }
}
