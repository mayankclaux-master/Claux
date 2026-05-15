/**
 * Provider Execution Registry
 * 
 * Supported providers:
 * - DataForSEO
 * - OpenAI
 * - Google Search Console
 * - Google Business Profile
 * - WordPress
 * - Shopify
 * - Webflow
 * - Ghost
 * 
 * NO execution logic duplication.
 */

export interface ProviderConfig {
  name: string;
  type: 'api' | 'webhook' | 'oauth';
  baseUrl?: string;
  requiredCredentials: string[];
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  supportsAsync: boolean;
  supportsWebhook: boolean;
}

export interface ProviderAction {
  provider: string;
  action: string;
  async: boolean;
  webhook: boolean;
  timeoutMs: number;
}

export class ProviderRegistry {
  private providers: Map<string, ProviderConfig> = new Map();
  private actions: Map<string, ProviderAction> = new Map();

  constructor() {
    this.registerDefaultProviders();
  }

  /**
   * Register provider
   */
  registerProvider(config: ProviderConfig): void {
    this.providers.set(config.name, config);
  }

  /**
   * Register action
   */
  registerAction(action: ProviderAction): void {
    this.actions.set(`${action.provider}:${action.action}`, action);
  }

  /**
   * Get provider config
   */
  getProvider(name: string): ProviderConfig | undefined {
    return this.providers.get(name);
  }

  /**
   * Get action config
   */
  getAction(provider: string, action: string): ProviderAction | undefined {
    return this.actions.get(`${provider}:${action}`);
  }

  /**
   * Check if provider supports async
   */
  supportsAsync(provider: string): boolean {
    const config = this.providers.get(provider);
    return config?.supportsAsync || false;
  }

  /**
   * Check if provider supports webhook
   */
  supportsWebhook(provider: string): boolean {
    const config = this.providers.get(provider);
    return config?.supportsWebhook || false;
  }

  /**
   * Get all providers
   */
  getAllProviders(): ProviderConfig[] {
    return Array.from(this.providers.values());
  }

  /**
   * Register default providers
   */
  private registerDefaultProviders(): void {
    // DataForSEO
    this.registerProvider({
      name: 'dataforseo',
      type: 'api',
      baseUrl: 'https://api.dataforseo.com',
      requiredCredentials: ['apiKey'],
      rateLimit: {
        requestsPerMinute: 100,
        requestsPerHour: 5000,
      },
      supportsAsync: true,
      supportsWebhook: false,
    });

    // OpenAI
    this.registerProvider({
      name: 'openai',
      type: 'api',
      baseUrl: 'https://api.openai.com/v1',
      requiredCredentials: ['apiKey'],
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 3600,
      },
      supportsAsync: false,
      supportsWebhook: false,
    });

    // Google Search Console
    this.registerProvider({
      name: 'gsc',
      type: 'oauth',
      requiredCredentials: ['accessToken', 'refreshToken'],
      rateLimit: {
        requestsPerMinute: 100,
        requestsPerHour: 10000,
      },
      supportsAsync: true,
      supportsWebhook: false,
    });

    // Google Business Profile
    this.registerProvider({
      name: 'gbp',
      type: 'oauth',
      requiredCredentials: ['accessToken', 'refreshToken'],
      rateLimit: {
        requestsPerMinute: 50,
        requestsPerHour: 5000,
      },
      supportsAsync: true,
      supportsWebhook: true,
    });

    // WordPress
    this.registerProvider({
      name: 'wordpress',
      type: 'oauth',
      requiredCredentials: ['url', 'username', 'password'],
      rateLimit: {
        requestsPerMinute: 100,
        requestsPerHour: 10000,
      },
      supportsAsync: false,
      supportsWebhook: false,
    });

    // Shopify
    this.registerProvider({
      name: 'shopify',
      type: 'oauth',
      requiredCredentials: ['storeUrl', 'accessToken'],
      rateLimit: {
        requestsPerMinute: 40,
        requestsPerHour: 2000,
      },
      supportsAsync: false,
      supportsWebhook: true,
    });

    // Webflow
    this.registerProvider({
      name: 'webflow',
      type: 'oauth',
      requiredCredentials: ['siteId', 'accessToken'],
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 3600,
      },
      supportsAsync: false,
      supportsWebhook: false,
    });

    // Ghost
    this.registerProvider({
      name: 'ghost',
      type: 'api',
      requiredCredentials: ['url', 'apiKey'],
      rateLimit: {
        requestsPerMinute: 100,
        requestsPerHour: 10000,
      },
      supportsAsync: false,
      supportsWebhook: false,
    });
  }
}

// Singleton instance
let providerRegistryInstance: ProviderRegistry | null = null;

export function getProviderRegistry(): ProviderRegistry {
  if (!providerRegistryInstance) {
    providerRegistryInstance = new ProviderRegistry();
  }
  return providerRegistryInstance;
}
