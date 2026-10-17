import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.avatar.update': { paramsTuple?: []; params?: {} }
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'attachments.attachments.store': { paramsTuple?: []; params?: {} }
    'tenants.tenants.index': { paramsTuple?: []; params?: {} }
    'tenants.tenants.store': { paramsTuple?: []; params?: {} }
    'access.my_permissions.show': { paramsTuple?: []; params?: {} }
    'access.permission_catalog.show': { paramsTuple?: []; params?: {} }
    'access.roles.index': { paramsTuple?: []; params?: {} }
    'access.roles.store': { paramsTuple?: []; params?: {} }
    'access.roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'access.roles.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'access.members.index': { paramsTuple?: []; params?: {} }
    'access.member_roles.update': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
    'access.member_permissions.update': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
    'access.invitations.index': { paramsTuple?: []; params?: {} }
    'access.invitations.store': { paramsTuple?: []; params?: {} }
    'access.invitations.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'invitation_accept.store': { paramsTuple?: []; params?: {} }
    'audit.audit_events.index': { paramsTuple?: []; params?: {} }
    'health_checks.live': { paramsTuple?: []; params?: {} }
    'health_checks.ready': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'tenants.tenants.index': { paramsTuple?: []; params?: {} }
    'access.my_permissions.show': { paramsTuple?: []; params?: {} }
    'access.permission_catalog.show': { paramsTuple?: []; params?: {} }
    'access.roles.index': { paramsTuple?: []; params?: {} }
    'access.members.index': { paramsTuple?: []; params?: {} }
    'access.invitations.index': { paramsTuple?: []; params?: {} }
    'audit.audit_events.index': { paramsTuple?: []; params?: {} }
    'health_checks.live': { paramsTuple?: []; params?: {} }
    'health_checks.ready': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'tenants.tenants.index': { paramsTuple?: []; params?: {} }
    'access.my_permissions.show': { paramsTuple?: []; params?: {} }
    'access.permission_catalog.show': { paramsTuple?: []; params?: {} }
    'access.roles.index': { paramsTuple?: []; params?: {} }
    'access.members.index': { paramsTuple?: []; params?: {} }
    'access.invitations.index': { paramsTuple?: []; params?: {} }
    'audit.audit_events.index': { paramsTuple?: []; params?: {} }
    'health_checks.live': { paramsTuple?: []; params?: {} }
    'health_checks.ready': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'profile.avatar.update': { paramsTuple?: []; params?: {} }
    'access.roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'access.member_roles.update': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
    'access.member_permissions.update': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
  }
  POST: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'attachments.attachments.store': { paramsTuple?: []; params?: {} }
    'tenants.tenants.store': { paramsTuple?: []; params?: {} }
    'access.roles.store': { paramsTuple?: []; params?: {} }
    'access.invitations.store': { paramsTuple?: []; params?: {} }
    'invitation_accept.store': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'access.roles.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'access.invitations.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}