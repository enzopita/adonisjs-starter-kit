type RedirectSearch = { redirect?: string };

/** Parses `?redirect=` at the URL boundary; only an in-app path is kept, so the link can't send users off-site. */
export function validateRedirectSearch(search: {
  redirect?: unknown;
}): RedirectSearch {
  const { redirect } = search;

  // oxlint-disable-next-line anti-slop/no-runtime-typeof -- the URL is the parse boundary; a single optional string needs no schema.
  return typeof redirect === 'string' &&
    redirect.startsWith('/') &&
    !redirect.startsWith('//')
    ? { redirect }
    : {};
}
