/**
 * CLAUX Runtime Architectural Boundary Enforcement
 * 
 * This ESLint configuration enforces strict clean architecture boundaries
 * to prevent semantic leakage and maintain layer isolation.
 * 
 * Canonical Hierarchy:
 * contracts → adapters → services → orchestrators → providers
 * 
 * Upper layers must NEVER import lower layers.
 */

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // =====================================================
      // IMPORT BOUNDARY RULES
      // =====================================================
      
      // Prevent contracts from importing implementation layers
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../services/*', '../orchestrators/*', '../providers/*'],
              message: 'Contracts layer must not import from implementation layers (services, orchestrators, providers). Contracts are the constitutional authority.',
              allowTypeImports: false,
            },
          ],
        },
      ],

      // Prevent adapters from importing orchestrators or providers
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../orchestrators/*', '../providers/*'],
              message: 'Adapters layer must not import from orchestrators or providers. Adapters define provider abstraction boundaries.',
              allowTypeImports: false,
            },
          ],
        },
      ],

      // Prevent services from importing providers
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../providers/*'],
              message: 'Services layer must not import from providers. Services coordinate business logic through repositories.',
              allowTypeImports: false,
            },
          ],
        },
      ],

      // Prevent orchestrators from importing providers
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../providers/*'],
              message: 'Orchestrators layer must not import from providers. Orchestrators coordinate through services.',
              allowTypeImports: false,
            },
          ],
        },
      ],

      // =====================================================
      // FORBIDDEN DEPENDENCY RULES
      // =====================================================
      
      // Prevent forbidden dependencies in contracts layer
      'no-restricted-imports': [
        'error',
        {
          name: 'contracts-forbidden-deps',
          files: ['lib/runtime/contracts/**/*.ts'],
          patterns: [
            {
              group: ['@supabase/supabase-js', '@supabase/ssr', 'bullmq', 'ioredis', 'kafkajs', 'temporalio'],
              message: 'Contracts layer must not import infrastructure dependencies (Supabase, BullMQ, Redis, Kafka, Temporal).',
            },
            {
              group: ['react', 'react-dom', 'next', '@clerk/nextjs'],
              message: 'Contracts layer must not import framework dependencies (React, Next.js, Clerk).',
            },
            {
              group: ['openai', '@anthropic-ai/sdk'],
              message: 'Contracts layer must not import AI provider SDKs (OpenAI, Anthropic).',
            },
          ],
        },
      ],

      // Prevent forbidden dependencies in adapters layer
      'no-restricted-imports': [
        'error',
        {
          name: 'adapters-forbidden-deps',
          files: ['lib/runtime/adapters/**/*.ts'],
          patterns: [
            {
              group: ['@supabase/supabase-js', '@supabase/ssr', 'bullmq', 'ioredis', 'kafkajs', 'temporalio'],
              message: 'Adapters layer must not import infrastructure dependencies. Only provider types are allowed.',
            },
            {
              group: ['react', 'react-dom', 'next', '@clerk/nextjs'],
              message: 'Adapters layer must not import framework dependencies.',
            },
            {
              group: ['openai', '@anthropic-ai/sdk'],
              message: 'Adapters layer must not import AI provider SDKs.',
            },
          ],
        },
      ],

      // =====================================================
      // LAYER ISOLATION VALIDATION
      // =====================================================
      
      // Ensure contracts only import from types
      'no-restricted-imports': [
        'error',
        {
          name: 'contracts-import-isolation',
          files: ['lib/runtime/contracts/**/*.ts'],
          patterns: [
            {
              group: ['!../types', '!./'],
              message: 'Contracts layer must only import from ../types or local contracts. No external dependencies allowed.',
            },
          ],
        },
      ],

      // Ensure adapters only import from types and local contracts
      'no-restricted-imports': [
        'error',
        {
          name: 'adapters-import-isolation',
          files: ['lib/runtime/adapters/**/*.ts'],
          patterns: [
            {
              group: ['!../types', '!./'],
              message: 'Adapters layer must only import from ../types or local adapters. No external dependencies allowed.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['lib/runtime/providers/**/*.ts'],
    rules: {
      // Allow provider implementations to import adapters
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../adapters/*'],
              message: 'Providers may only import from adapters layer. Providers implement adapter contracts.',
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
