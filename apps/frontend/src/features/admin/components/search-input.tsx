import { Input } from '@monorepo/ui/components/input';
import { useEffect, useState } from 'react';

const SEARCH_DELAY_MS = 300;

/**
 * A search box that applies once typing pauses, rather than refetching the list at every
 * keystroke. Remounted (`key`) when the URL's value changes, so it starts from the applied value.
 */
export function SearchInput({
  label,
  value,
  onApply,
}: {
  label: string;
  value: string | undefined;
  onApply: (search: string | undefined) => void;
}) {
  const [draft, setDraft] = useState(value ?? '');

  useEffect(() => {
    const next = draft.trim() || undefined;

    const timer = setTimeout(() => {
      if (next !== value) {
        onApply(next);
      }
    }, SEARCH_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [draft, value, onApply]);

  return (
    <Input
      type="search"
      aria-label={label}
      placeholder={label}
      className="max-w-xs"
      value={draft}
      onChange={(event) => {
        setDraft(event.target.value);
      }}
    />
  );
}
