import { randomBytes, createHash } from 'crypto';
import { db } from '@/lib/db';
import { apiKeys, apiKeyLogs } from '@/lib/db/schema/api-keys';
import { eq, and } from 'drizzle-orm';

// API key format: evg_live_[32 random characters] or evg_test_[32 random characters]
export function generateApiKey(isLive: boolean = true): string {
  const prefix = isLive ? 'evg_live_' : 'evg_test_';
  const randomPart = randomBytes(16).toString('hex');
  return `${prefix}${randomPart}`;
}

// Hash API key for storage
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

// Validate API key format
export function isValidApiKeyFormat(key: string): boolean {
  const pattern = /^evg_(live|test)_[a-f0-9]{32}$/;
  return pattern.test(key);
}

// Mask API key for display (show first 8 and last 4 characters)
export function maskApiKey(key: string): string {
  if (key.length <= 12) return key;
  const start = key.substring(0, 12);
  const end = key.substring(key.length - 4);
  return `${start}...${end}`;
}

// Create a new API key
export async function createApiKey({
  companyId,
  userId,
  name,
  scopes = [],
  expiresAt,
  metadata = {},
}: {
  companyId: string;
  userId: string;
  name: string;
  scopes?: string[];
  expiresAt?: Date;
  metadata?: Record<string, any>;
}) {
  const key = generateApiKey();
  const hashedKey = hashApiKey(key);
  const maskedKey = maskApiKey(key);

  const [apiKey] = await db.insert(apiKeys).values({
    companyId,
    userId,
    name,
    key: maskedKey, // Store masked version
    hashedKey,
    scopes,
    expiresAt,
    metadata,
  }).returning();

  // Return the full key only on creation
  return {
    ...apiKey,
    fullKey: key, // This is only returned once
  };
}

// Validate and retrieve API key details
export async function validateApiKey(key: string): Promise<{
  valid: boolean;
  apiKey?: typeof apiKeys.$inferSelect;
  error?: string;
}> {
  if (!isValidApiKeyFormat(key)) {
    return { valid: false, error: 'Invalid API key format' };
  }

  const hashedKey = hashApiKey(key);
  
  const [apiKey] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.hashedKey, hashedKey))
    .limit(1);

  if (!apiKey) {
    return { valid: false, error: 'API key not found' };
  }

  if (!apiKey.isActive) {
    return { valid: false, error: 'API key is inactive' };
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }

  // Update last used timestamp
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id));

  return { valid: true, apiKey };
}

// Log API key usage
export async function logApiKeyUsage({
  apiKeyId,
  endpoint,
  method,
  statusCode,
  ipAddress,
  userAgent,
  requestBody,
  responseTime,
  error,
}: {
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode?: string;
  ipAddress?: string;
  userAgent?: string;
  requestBody?: any;
  responseTime?: string;
  error?: string;
}) {
  await db.insert(apiKeyLogs).values({
    apiKeyId,
    endpoint,
    method,
    statusCode,
    ipAddress,
    userAgent,
    requestBody,
    responseTime,
    error,
  });
}

// Revoke an API key
export async function revokeApiKey(keyId: string, companyId: string) {
  await db
    .update(apiKeys)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.companyId, companyId)));
}

// List API keys for a company
export async function listApiKeys(companyId: string) {
  return await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.companyId, companyId))
    .orderBy(apiKeys.createdAt);
}

// Check if API key has required scope
export function hasScope(apiKey: typeof apiKeys.$inferSelect, requiredScope: string): boolean {
  const scopes = apiKey.scopes as string[];
  return scopes.includes('*') || scopes.includes(requiredScope);
}