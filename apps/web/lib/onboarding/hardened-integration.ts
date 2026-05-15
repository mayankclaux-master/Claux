export class HardenedIntegration {
  async parseSitemap(url: string) { return { urls: [] }; }
  async validateRobotsTxt(url: string) { return { valid: true }; }
}
