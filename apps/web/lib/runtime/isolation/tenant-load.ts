export class TenantLoadIsolation {
  async checkTenantLoad(tenantId: string) { return { allowed: true }; }
  async enforceFairness() { return; }
}
