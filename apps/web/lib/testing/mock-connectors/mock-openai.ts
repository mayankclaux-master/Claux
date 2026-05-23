/**
 * Mock OpenAI Connector
 * 
 * Mock implementation of OpenAI API for testing.
 * Provides deterministic LLM responses for content generation and analysis.
 */

import { MockConnectorBase, MockConnectorConfig, MockResponse } from './mock-connector-base';

export interface MockChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface MockChatCompletion {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: MockChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface MockEmbedding {
  object: string;
  embedding: number[];
  index: number;
}

/**
 * Mock OpenAI connector
 */
export class MockOpenAIConnector extends MockConnectorBase {
  private responseTemplates: Map<string, string> = new Map();

  constructor(config?: Partial<MockConnectorConfig>) {
    super(config);
    this.generateResponseTemplates();
  }

  /**
   * Generate seeded response templates
   */
  private generateResponseTemplates(): void {
    this.responseTemplates.set('content', `
# SEO-Optimized Article

## Introduction
This is a comprehensive article about the topic. It covers all the important aspects and provides valuable insights for readers.

## Key Points
- First important point with detailed explanation
- Second key point with supporting evidence
- Third critical point with examples

## Conclusion
The article concludes with a summary of the main points and actionable takeaways for the reader.
    `);

    this.responseTemplates.set('analysis', `
# Analysis Report

## Overview
This analysis provides a detailed examination of the subject matter with data-driven insights.

## Findings
1. Key finding 1 with supporting data
2. Key finding 2 with metrics
3. Key finding 3 with recommendations

## Recommendations
Based on the analysis, here are the recommended actions to improve performance.
    `);

    this.responseTemplates.set('summary', `
# Executive Summary

This document provides a concise summary of the main findings and recommendations from the detailed analysis.

## Key Takeaways
- Primary insight from the analysis
- Secondary observation
- Tertiary finding

## Next Steps
1. Action item 1
2. Action item 2
3. Action item 3
    `);
  }

  /**
   * Get chat completion
   */
  async chatCompletion(params: {
    model: string;
    messages: MockChatMessage[];
    temperature?: number;
    maxTokens?: number;
  }): Promise<MockResponse<MockChatCompletion>> {
    return this.simulateRequest(() => {
      const lastMessage = params.messages[params.messages.length - 1];
      const template = this.getTemplateForMessage(lastMessage.content);

      return {
        id: `chatcmpl-${this.random().toString(36).substring(7)}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: params.model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: template,
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: this.estimateTokens(params.messages.map(m => m.content).join(' ')),
          completion_tokens: this.estimateTokens(template),
          total_tokens: this.estimateTokens(params.messages.map(m => m.content).join(' ')) + this.estimateTokens(template),
        },
      };
    });
  }

  /**
   * Get embedding
   */
  async getEmbedding(params: {
    model: string;
    input: string;
  }): Promise<MockResponse<{
    object: string;
    data: MockEmbedding[];
    model: string;
    usage: { prompt_tokens: number; total_tokens: number };
  }>> {
    return this.simulateRequest(() => ({
      object: 'list',
      data: [
        {
          object: 'embedding',
          embedding: this.generateEmbeddingVector(),
          index: 0,
        },
      ],
      model: params.model,
      usage: {
        prompt_tokens: this.estimateTokens(params.input),
        total_tokens: this.estimateTokens(params.input),
      },
    }));
  }

  /**
   * Get template for message
   */
  private getTemplateForMessage(content: string): string {
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('content') || lowerContent.includes('article') || lowerContent.includes('blog')) {
      return this.responseTemplates.get('content') || this.responseTemplates.get('summary')!;
    }

    if (lowerContent.includes('analysis') || lowerContent.includes('audit') || lowerContent.includes('report')) {
      return this.responseTemplates.get('analysis') || this.responseTemplates.get('summary')!;
    }

    return this.responseTemplates.get('summary')!;
  }

  /**
   * Generate embedding vector
   */
  private generateEmbeddingVector(): number[] {
    return Array.from({ length: 1536 }, () => (this.random() * 2 - 1));
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
