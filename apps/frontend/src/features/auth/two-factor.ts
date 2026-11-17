import { queries } from '@/features/core/api';

export const twoFactorQuery = () =>
  queries.profile.twoFactor.show.queryOptions();
