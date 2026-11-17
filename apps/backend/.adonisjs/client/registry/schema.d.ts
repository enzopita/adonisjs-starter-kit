/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractRawResponse, ExtractResponse, Method, PathWithRegistry, PatternsByMethod, RouteWithRegistry } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'
import type { routes } from './index.ts'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'profile.profile.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/users/controllers/profile_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/users/controllers/profile_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/users/controllers/profile_controller').default['show']>>>
    }
  }
  'profile.profile.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/account/profile'
    types: {
      body: ExtractBody<InferInput<(typeof import('#users/validators/user').updateProfileValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#users/validators/user').updateProfileValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/users/controllers/profile_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/users/controllers/profile_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/users/controllers/profile_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'profile.avatar.update': {
    methods: ["PUT"]
    pattern: '/api/v1/account/avatar'
    types: {
      body: ExtractBody<InferInput<(typeof import('#users/validators/user').updateAvatarValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#users/validators/user').updateAvatarValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/users/controllers/avatar_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/users/controllers/avatar_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/users/controllers/avatar_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'attachments.attachments.store': {
    methods: ["POST"]
    pattern: '/api/v1/attachments'
    types: {
      body: ExtractBody<InferInput<(typeof import('#attachments/validators/attachment').uploadAttachmentValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#attachments/validators/attachment').uploadAttachmentValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/attachments/controllers/attachments_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/attachments/controllers/attachments_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/attachments/controllers/attachments_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'tenants.tenants.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/tenants'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/tenancy/controllers/tenants_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/tenancy/controllers/tenants_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/tenancy/controllers/tenants_controller').default['index']>>>
    }
  }
  'tenants.tenants.store': {
    methods: ["POST"]
    pattern: '/api/v1/tenants'
    types: {
      body: ExtractBody<InferInput<(typeof import('#tenancy/validators/tenant').createTenantValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#tenancy/validators/tenant').createTenantValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/tenancy/controllers/tenants_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/tenancy/controllers/tenants_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/tenancy/controllers/tenants_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'audit.audit_events.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/audit/events'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#audit/validators/audit_event').listAuditEventsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/audit/controllers/audit_events_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/audit/controllers/audit_events_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/audit/controllers/audit_events_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'audit.account_activity.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/activity'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#audit/validators/audit_event').listAccountActivityValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/audit/controllers/account_activity_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/audit/controllers/account_activity_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/audit/controllers/account_activity_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.me.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/me'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/admin/controllers/me_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/admin/controllers/me_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/admin/controllers/me_controller').default['show']>>>
    }
  }
  'admin.tenants.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/tenants'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#admin/validators/tenant').listTenantsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/admin/controllers/tenants_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/admin/controllers/tenants_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/admin/controllers/tenants_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.tenants.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/tenants/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#admin/validators/tenant').tenantParamsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/admin/controllers/tenants_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/admin/controllers/tenants_controller').default['show']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/admin/controllers/tenants_controller').default['show']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.tenants.update': {
    methods: ["PUT"]
    pattern: '/api/v1/admin/tenants/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#admin/validators/tenant').renameTenantValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#admin/validators/tenant').renameTenantValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/admin/controllers/tenants_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/admin/controllers/tenants_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/admin/controllers/tenants_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.tenant_suspensions.store': {
    methods: ["POST"]
    pattern: '/api/v1/admin/tenants/:id/suspension'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/admin/controllers/tenant_suspensions_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/admin/controllers/tenant_suspensions_controller').default['store']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/admin/controllers/tenant_suspensions_controller').default['store']>>>
    }
  }
  'admin.tenant_suspensions.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/admin/tenants/:id/suspension'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/admin/controllers/tenant_suspensions_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/admin/controllers/tenant_suspensions_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/admin/controllers/tenant_suspensions_controller').default['destroy']>>>
    }
  }
  'admin.users.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/users'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#admin/validators/user').listUsersValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/admin/controllers/users_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/admin/controllers/users_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/admin/controllers/users_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.user_suspensions.store': {
    methods: ["POST"]
    pattern: '/api/v1/admin/users/:id/suspension'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/admin/controllers/user_suspensions_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/admin/controllers/user_suspensions_controller').default['store']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/admin/controllers/user_suspensions_controller').default['store']>>>
    }
  }
  'admin.user_suspensions.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/admin/users/:id/suspension'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/admin/controllers/user_suspensions_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/admin/controllers/user_suspensions_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/admin/controllers/user_suspensions_controller').default['destroy']>>>
    }
  }
  'admin.impersonations.store': {
    methods: ["POST"]
    pattern: '/api/v1/admin/users/:id/impersonation'
    types: {
      body: ExtractBody<InferInput<(typeof import('#admin/validators/user').userParamsValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#admin/validators/user').userParamsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/admin/controllers/impersonations_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/admin/controllers/impersonations_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/admin/controllers/impersonations_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.two_factor_resets.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/admin/users/:id/two-factor'
    types: {
      body: ExtractBody<InferInput<(typeof import('#admin/validators/user').userParamsValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#admin/validators/user').userParamsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/admin/controllers/two_factor_resets_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/admin/controllers/two_factor_resets_controller').default['destroy']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/admin/controllers/two_factor_resets_controller').default['destroy']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.platform_admins.store': {
    methods: ["POST"]
    pattern: '/api/v1/admin/users/:id/platform-admin'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/admin/controllers/platform_admins_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/admin/controllers/platform_admins_controller').default['store']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/admin/controllers/platform_admins_controller').default['store']>>>
    }
  }
  'admin.platform_admins.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/admin/users/:id/platform-admin'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/admin/controllers/platform_admins_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/admin/controllers/platform_admins_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/admin/controllers/platform_admins_controller').default['destroy']>>>
    }
  }
  'health_checks.live': {
    methods: ["GET","HEAD"]
    pattern: '/health/live'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/core/controllers/health_checks_controller').default['live']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/core/controllers/health_checks_controller').default['live']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/core/controllers/health_checks_controller').default['live']>>>
    }
  }
  'health_checks.ready': {
    methods: ["GET","HEAD"]
    pattern: '/health/ready'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/core/controllers/health_checks_controller').default['ready']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/core/controllers/health_checks_controller').default['ready']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/core/controllers/health_checks_controller').default['ready']>>>
    }
  }
  'auth.new_account.store': {
    methods: ["POST"]
    pattern: '/api/v1/auth/signup'
    types: {
      body: ExtractBody<InferInput<(typeof import('#auth/validators/auth').signupValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#auth/validators/auth').signupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/auth/controllers/new_account_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/auth/controllers/new_account_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/auth/controllers/new_account_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.access_tokens.store': {
    methods: ["POST"]
    pattern: '/api/v1/auth/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#auth/validators/auth').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#auth/validators/auth').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/auth/controllers/access_tokens_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/auth/controllers/access_tokens_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/auth/controllers/access_tokens_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.two_factor_logins.store': {
    methods: ["POST"]
    pattern: '/api/v1/auth/login/two-factor'
    types: {
      body: ExtractBody<InferInput<(typeof import('#auth/validators/two_factor').twoFactorLoginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#auth/validators/two_factor').twoFactorLoginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/auth/controllers/two_factor_logins_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/auth/controllers/two_factor_logins_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/auth/controllers/two_factor_logins_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.password_resets.store': {
    methods: ["POST"]
    pattern: '/api/v1/auth/password/forgot'
    types: {
      body: ExtractBody<InferInput<(typeof import('#auth/validators/auth').forgotPasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#auth/validators/auth').forgotPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/auth/controllers/password_resets_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/auth/controllers/password_resets_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/auth/controllers/password_resets_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.password_resets.update': {
    methods: ["POST"]
    pattern: '/api/v1/auth/password/reset'
    types: {
      body: ExtractBody<InferInput<(typeof import('#auth/validators/auth').resetPasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#auth/validators/auth').resetPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/auth/controllers/password_resets_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/auth/controllers/password_resets_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/auth/controllers/password_resets_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.email_verifications.update': {
    methods: ["POST"]
    pattern: '/api/v1/auth/email/verify'
    types: {
      body: ExtractBody<InferInput<(typeof import('#auth/validators/auth').verifyEmailValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#auth/validators/auth').verifyEmailValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/auth/controllers/email_verifications_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/auth/controllers/email_verifications_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/auth/controllers/email_verifications_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'profile.access_tokens.destroy': {
    methods: ["POST"]
    pattern: '/api/v1/account/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/auth/controllers/access_tokens_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/auth/controllers/access_tokens_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/auth/controllers/access_tokens_controller').default['destroy']>>>
    }
  }
  'profile.sessions.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/sessions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/auth/controllers/sessions_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/auth/controllers/sessions_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/auth/controllers/sessions_controller').default['index']>>>
    }
  }
  'profile.sessions.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/account/sessions/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#auth/validators/session').sessionParamsValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#auth/validators/session').sessionParamsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/auth/controllers/sessions_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/auth/controllers/sessions_controller').default['destroy']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/auth/controllers/sessions_controller').default['destroy']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'profile.sessions.destroy_all': {
    methods: ["DELETE"]
    pattern: '/api/v1/account/sessions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/auth/controllers/sessions_controller').default['destroyAll']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/auth/controllers/sessions_controller').default['destroyAll']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/auth/controllers/sessions_controller').default['destroyAll']>>>
    }
  }
  'profile.email_verifications.store': {
    methods: ["POST"]
    pattern: '/api/v1/account/email/verification'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/auth/controllers/email_verifications_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/auth/controllers/email_verifications_controller').default['store']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/auth/controllers/email_verifications_controller').default['store']>>>
    }
  }
  'profile.two_factor.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/two-factor'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/auth/controllers/two_factor_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/auth/controllers/two_factor_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/auth/controllers/two_factor_controller').default['show']>>>
    }
  }
  'profile.two_factor.store': {
    methods: ["POST"]
    pattern: '/api/v1/account/two-factor'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/auth/controllers/two_factor_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/auth/controllers/two_factor_controller').default['store']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/auth/controllers/two_factor_controller').default['store']>>>
    }
  }
  'profile.two_factor.confirm': {
    methods: ["POST"]
    pattern: '/api/v1/account/two-factor/confirmation'
    types: {
      body: ExtractBody<InferInput<(typeof import('#auth/validators/two_factor').confirmTwoFactorValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#auth/validators/two_factor').confirmTwoFactorValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/auth/controllers/two_factor_controller').default['confirm']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/auth/controllers/two_factor_controller').default['confirm']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/auth/controllers/two_factor_controller').default['confirm']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'profile.two_factor.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/account/two-factor'
    types: {
      body: ExtractBody<InferInput<(typeof import('#auth/validators/two_factor').disableTwoFactorValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#auth/validators/two_factor').disableTwoFactorValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/auth/controllers/two_factor_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/auth/controllers/two_factor_controller').default['destroy']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/auth/controllers/two_factor_controller').default['destroy']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'profile.two_factor.regenerate_recovery_codes': {
    methods: ["POST"]
    pattern: '/api/v1/account/two-factor/recovery-codes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#auth/validators/two_factor').regenerateRecoveryCodesValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#auth/validators/two_factor').regenerateRecoveryCodesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/auth/controllers/two_factor_controller').default['regenerateRecoveryCodes']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/auth/controllers/two_factor_controller').default['regenerateRecoveryCodes']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/auth/controllers/two_factor_controller').default['regenerateRecoveryCodes']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'access.my_permissions.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/access/me'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/access/controllers/my_permissions_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/access/controllers/my_permissions_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/access/controllers/my_permissions_controller').default['show']>>>
    }
  }
  'access.permission_catalog.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/access/permissions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/access/controllers/permission_catalog_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/access/controllers/permission_catalog_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/access/controllers/permission_catalog_controller').default['show']>>>
    }
  }
  'access.roles.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/roles'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/access/controllers/roles_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/access/controllers/roles_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/access/controllers/roles_controller').default['index']>>>
    }
  }
  'access.roles.store': {
    methods: ["POST"]
    pattern: '/api/v1/roles'
    types: {
      body: ExtractBody<InferInput<(typeof import('#access/validators/role').createRoleValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#access/validators/role').createRoleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/access/controllers/roles_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/access/controllers/roles_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/access/controllers/roles_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'access.roles.update': {
    methods: ["PUT"]
    pattern: '/api/v1/roles/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#access/validators/role').updateRoleValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#access/validators/role').updateRoleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/access/controllers/roles_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/access/controllers/roles_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/access/controllers/roles_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'access.roles.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/roles/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#access/validators/role').roleParamsValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#access/validators/role').roleParamsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/access/controllers/roles_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/access/controllers/roles_controller').default['destroy']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/access/controllers/roles_controller').default['destroy']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'access.members.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/members'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/access/controllers/members_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/access/controllers/members_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/access/controllers/members_controller').default['index']>>>
    }
  }
  'access.member_roles.update': {
    methods: ["PUT"]
    pattern: '/api/v1/members/:userId/role'
    types: {
      body: ExtractBody<InferInput<(typeof import('#access/validators/member').assignRoleValidator)>>
      paramsTuple: [ParamValue]
      params: { userId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#access/validators/member').assignRoleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/access/controllers/member_roles_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/access/controllers/member_roles_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/access/controllers/member_roles_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'access.member_permissions.update': {
    methods: ["PUT"]
    pattern: '/api/v1/members/:userId/permissions'
    types: {
      body: ExtractBody<InferInput<(typeof import('#access/validators/member').replaceGrantsValidator)>>
      paramsTuple: [ParamValue]
      params: { userId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#access/validators/member').replaceGrantsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/access/controllers/member_permissions_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/access/controllers/member_permissions_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/access/controllers/member_permissions_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'access.invitations.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/invitations'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/access/controllers/invitations_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/access/controllers/invitations_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/access/controllers/invitations_controller').default['index']>>>
    }
  }
  'access.invitations.store': {
    methods: ["POST"]
    pattern: '/api/v1/invitations'
    types: {
      body: ExtractBody<InferInput<(typeof import('#access/validators/invitation').inviteMemberValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#access/validators/invitation').inviteMemberValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/access/controllers/invitations_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/access/controllers/invitations_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/access/controllers/invitations_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'access.invitations.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/invitations/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#access/validators/invitation').invitationParamsValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#access/validators/invitation').invitationParamsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/access/controllers/invitations_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/access/controllers/invitations_controller').default['destroy']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/access/controllers/invitations_controller').default['destroy']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'invitation_accept.store': {
    methods: ["POST"]
    pattern: '/api/v1/invitations/accept'
    types: {
      body: ExtractBody<InferInput<(typeof import('#access/validators/invitation').acceptInvitationValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#access/validators/invitation').acceptInvitationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/access/controllers/invitation_accept_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/access/controllers/invitation_accept_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/access/controllers/invitation_accept_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
}

export namespace Route {
  export type Request<Name extends keyof typeof routes> = RouteWithRegistry.Request<typeof routes, Name>
  export type Response<Name extends keyof typeof routes> = RouteWithRegistry.Response<typeof routes, Name>
  export type Params<Name extends keyof typeof routes> = RouteWithRegistry.Params<typeof routes, Name>
  export type Body<Name extends keyof typeof routes> = RouteWithRegistry.Body<typeof routes, Name>
  export type Query<Name extends keyof typeof routes> = RouteWithRegistry.Query<typeof routes, Name>
  export type Error<Name extends keyof typeof routes> = RouteWithRegistry.Error<typeof routes, Name>
}

export namespace Path {
  export type Request<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Request<typeof routes, M, P>
  export type Response<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Response<typeof routes, M, P>
  export type Params<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Params<typeof routes, M, P>
  export type Body<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Body<typeof routes, M, P>
  export type Query<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Query<typeof routes, M, P>
  export type Error<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Error<typeof routes, M, P>
}
