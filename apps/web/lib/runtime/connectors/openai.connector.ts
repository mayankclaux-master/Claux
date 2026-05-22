/**
 * OpenAI Runtime Connector
 * 
 * Canonical connector for OpenAI API execution.
 * Implements real auth, real request preparation, real response parsing, real error handling.
 * 
 * CRITICAL: This is the ONLY connector that may call OpenAI API.
 */

import type { UUID } from '../types/common.types';
import { BaseConnector, BaseConnectorConfig } from './base.connector';
import type { OpenAIResponseData } from '../contracts/provider-response.contract';
import {
  ProviderError,
  AuthenticationError,
  RateLimitError,
  ExecutionTimeoutError,
  NetworkError,
  ProviderErrorCode,
} from '../contracts/provider-error.contract';

/**
 * OpenAI connector configuration
 */
export interface OpenAIConnectorConfig extends BaseConnectorConfig {
  readonly model?: string;
  readonly maxTokens?: number;
  readonly temperature?: number;
}

/**
 * OpenAI runtime connector
 */
export class OpenAIConnector extends BaseConnector {
  private readonly defaultModel = 'gpt-4';
  private readonly defaultMaxTokens = 2000;
  private readonly defaultTemperature = 0.7;

  constructor(config: OpenAIConnectorConfig) {
    super(config, 'openai');
  }

  /**
   * Prepare request for OpenAI API
   */
  protected prepareRequest(
    operation: string,
    payload: Record<string, unknown>,
    credentials: Record<string, unknown>
  ): Record<string, unknown> {
    const apiKey = credentials.apiKey as string;
    
    if (!apiKey) {
      throw new AuthenticationError(
        'OpenAI API key is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        operation
      );
    }

    const prompt = payload.prompt as string;
    const model = payload.model as string || this.defaultModel;
    const maxTokens = (payload.maxTokens as number) || this.defaultMaxTokens;
    const temperature = (payload.temperature as number) || this.defaultTemperature;

    if (!prompt) {
      throw new ProviderError(
        ProviderErrorCode.MISSING_REQUIRED_FIELD,
        'Prompt is required',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        operation,
        { field: 'prompt' }
      );
    }

    return {
      url: 'https://api.openai.com/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature,
      },
      timeout: 30000, // 30 seconds
    };
  }

  /**
   * Execute OpenAI API call
   */
  protected async executeProvider(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    const url = request.url as string;
    const headers = request.headers as Record<string, string>;
    const body = request.body as Record<string, unknown>;
    const timeout = request.timeout as number;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new AuthenticationError(
            errorData.error?.message || 'Authentication failed',
            this.tenantId,
            this.executionId,
            this.taskId,
            this.provider,
            'executeProvider',
            { status: response.status, error: errorData }
          );
        }

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          throw new RateLimitError(
            errorData.error?.message || 'Rate limit exceeded',
            this.tenantId,
            this.executionId,
            this.taskId,
            this.provider,
            'executeProvider',
            retryAfter ? parseInt(retryAfter, 10) * 1000 : undefined,
            { status: response.status, error: errorData }
          );
        }

        throw new ProviderError(
          ProviderErrorCode.PROVIDER_ERROR,
          errorData.error?.message || `OpenAI API error: ${response.status}`,
          this.tenantId,
          this.executionId,
          this.taskId,
          this.provider,
          'executeProvider',
          { status: response.status, error: errorData }
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof AuthenticationError || error instanceof RateLimitError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ExecutionTimeoutError(
          'OpenAI API request timed out',
          this.tenantId,
          this.executionId,
          this.taskId,
          this.provider,
          'executeProvider'
        );
      }

      if (error instanceof Error) {
        throw new NetworkError(
          `Network error: ${error.message}`,
          this.tenantId,
          this.executionId,
          this.taskId,
          this.provider,
          'executeProvider',
          { originalError: error.message }
        );
      }

      throw new ProviderError(
        ProviderErrorCode.PROVIDER_ERROR,
        'Unknown error executing OpenAI API',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'executeProvider',
        { error: String(error) }
      );
    }
  }

  /**
   * Parse OpenAI API response
   */
  protected parseResponse<T>(response: Record<string, unknown>): T {
    if (!response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
      throw new ProviderError(
        ProviderErrorCode.INVALID_RESPONSE,
        'Invalid OpenAI API response: no choices returned',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'parseResponse',
        { response }
      );
    }

    const choice = response.choices[0] as Record<string, unknown>;
    const message = choice.message as Record<string, unknown>;
    const content = message.content as string;

    if (!content) {
      throw new ProviderError(
        ProviderErrorCode.INVALID_RESPONSE,
        'Invalid OpenAI API response: no content in message',
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        'parseResponse',
        { response }
      );
    }

    const usage = response.usage as Record<string, unknown> | undefined;
    const tokensUsed = usage?.total_tokens as number | undefined || 0;

    const result: OpenAIResponseData = {
      content,
      model: response.model as string,
      tokensUsed,
    };

    return result as T;
  }

  /**
   * Handle error
   */
  protected handleError(error: unknown, operation: string): ProviderError {
    if (error instanceof ProviderError) {
      return error;
    }

    if (error instanceof Error) {
      return new ProviderError(
        ProviderErrorCode.PROVIDER_ERROR,
        error.message,
        this.tenantId,
        this.executionId,
        this.taskId,
        this.provider,
        operation,
        { originalError: error.name }
      );
    }

    return new ProviderError(
      ProviderErrorCode.PROVIDER_ERROR,
      'Unknown error',
      this.tenantId,
      this.executionId,
      this.taskId,
      this.provider,
      operation,
      { error: String(error) }
    );
  }

  /**
   * Extract tokens from response
   */
  protected extractTokens(response: Record<string, unknown> | null) {
    if (!response) return undefined;
    
    const usage = response.usage as Record<string, unknown> | undefined;
    if (!usage) return undefined;

    return {
      promptTokens: usage.prompt_tokens as number || 0,
      completionTokens: usage.completion_tokens as number || 0,
      totalTokens: usage.total_tokens as number || 0,
    };
  }

  /**
   * Extract cost from response
   */
  protected extractCost(response: Record<string, unknown> | null) {
    if (!response) return undefined;
    
    const usage = response.usage as Record<string, unknown> | undefined;
    if (!usage) return undefined;

    // OpenAI pricing (as of 2024)
    // GPT-4: $0.03 / 1K prompt tokens, $0.06 / 1K completion tokens
    const promptTokens = usage.prompt_tokens as number || 0;
    const completionTokens = usage.completion_tokens as number || 0;
    const promptCost = (promptTokens / 1000) * 0.03;
    const completionCost = (completionTokens / 1000) * 0.06;
    const totalCost = promptCost + completionCost;

    return {
      currency: 'USD',
      amount: totalCost,
    };
  }
}
