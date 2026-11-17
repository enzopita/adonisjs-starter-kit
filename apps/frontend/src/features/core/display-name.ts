/** How the UI names a person: their full name, else their email, since the name is optional. */
export const displayName = (person: {
  fullName: string | null;
  email: string;
}) => person.fullName ?? person.email;
