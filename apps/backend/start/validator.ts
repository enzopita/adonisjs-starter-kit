import { VineDate } from '@vinejs/vine';
import { DateTime } from 'luxon';

declare module '@vinejs/vine/types' {
  interface VineGlobalTransforms {
    date: DateTime;
  }
}

/** Validated dates come out as Luxon DateTime, the type Lucid models expect. */
VineDate.transform((value) => DateTime.fromJSDate(value));
