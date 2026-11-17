import { queries } from '@/features/core/api';

export const sessionsQuery = () =>
  queries.profile.sessions.index.queryOptions();
