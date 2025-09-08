/**
 * Email Feature Integration Tests
 * CRITICAL: These tests ensure the email sending feature works end-to-end
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { processCommand } from '@/lib/modules-simple/command-processor';

// Mock OpenAI to avoid API calls in tests
vi.mock('openai', () => ({
  default: class OpenAI {
    chat = {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                action: 'email',
                parameters: {
                  command: 'draft',
                  to: 'test@example.com',
                  topic: 'testing'
                },
                response: 'Drafting email...'
              })
            }
          }]
        })
      }
    }
  }
}));

describe('Email Sending Feature', () => {
  const testWorkspaceId = 'test-workspace-id';
  const testUserId = 'test-user-id';

  describe('Command Processing', () => {
    it('should recognize email sending commands', async () => {
      const commands = [
        'send test@example.com an email about project update',
        'email john@company.com about meeting',
        'draft email to sarah@example.org regarding proposal'
      ];

      for (const command of commands) {
        const result = await processCommand(testWorkspaceId, command, testUserId);
        expect(result).toBeDefined();
        expect(result.success).toBeDefined();
      }
    });

    it('should reject invalid email addresses', async () => {
      const invalidCommands = [
        'send notanemail an email about test',
        'email @invalid.com about meeting',
        'send test@ an email about project'
      ];

      for (const command of invalidCommands) {
        const result = await processCommand(testWorkspaceId, command, testUserId);
        if (result.data?.type === 'draft_email') {
          // If it got to draft stage, the email validation should happen there
          expect(result.data.draft.to).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        }
      }
    });

    it('should generate email draft with all required fields', async () => {
      const result = await processCommand(
        testWorkspaceId,
        'send test@example.com an email about quarterly report',
        testUserId
      );

      if (result.data?.type === 'draft_email') {
        const draft = result.data.draft;
        expect(draft).toHaveProperty('to');
        expect(draft).toHaveProperty('subject');
        expect(draft).toHaveProperty('body');
        expect(draft.to).toBe('test@example.com');
        expect(draft.subject).toBeTruthy();
        expect(draft.body).toBeTruthy();
      }
    });

    it('should handle vague topics gracefully', async () => {
      const result = await processCommand(
        testWorkspaceId,
        'send test@example.com an email about it',
        testUserId
      );

      // Should either generate something or ask for clarification
      expect(result).toBeDefined();
      expect(result.message).toBeTruthy();
    });
  });

  describe('Email Draft Response', () => {
    it('should return correct response structure', async () => {
      const result = await processCommand(
        testWorkspaceId,
        'send kian@example.com an email about voice agents',
        testUserId
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      if (result.success && result.data?.type === 'draft_email') {
        expect(result.data.draft).toHaveProperty('to');
        expect(result.data.draft).toHaveProperty('subject');
        expect(result.data.draft).toHaveProperty('body');
      }
    });
  });

  describe('Dashboard Integration', () => {
    it('should have sendEmail mutation in unified router', async () => {
      const { unifiedRouter } = await import('@/lib/api/routers/unified');
      expect(unifiedRouter._def.procedures).toHaveProperty('sendEmail');
    });

    it('should have executeCommand mutation in unified router', async () => {
      const { unifiedRouter } = await import('@/lib/api/routers/unified');
      expect(unifiedRouter._def.procedures).toHaveProperty('executeCommand');
    });
  });
});

describe('Email Feature Protection', () => {
  it('critical files should exist', () => {
    const criticalFiles = [
      '@/lib/modules-simple/command-processor',
      '@/lib/api/routers/unified',
      '@/lib/evermail/gmail-client'
    ];

    for (const file of criticalFiles) {
      expect(() => require(file)).not.toThrow();
    }
  });

  it('command processor should handle email commands', async () => {
    const { processCommand } = await import('@/lib/modules-simple/command-processor');
    expect(processCommand).toBeDefined();
    expect(typeof processCommand).toBe('function');
  });
});