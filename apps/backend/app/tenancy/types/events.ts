export interface TenantCreated {
  tenantId: string;
  creatorId: string;
  /** The creator's locale, for anything the tenant starts with that people read. */
  locale: string;
}

declare module '@adonisjs/core/types' {
  interface EventsList {
    'tenancy:tenant_created': TenantCreated;
  }
}
