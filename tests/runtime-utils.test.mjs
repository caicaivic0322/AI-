import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getAiProviderOrder,
  getNoAiProviderError,
  formatDatabaseDriverError,
} from '../app/lib/runtime-utils.mjs';

test('returns providers in DeepSeek → Kimi → MiniMax order while skipping missing keys', () => {
  assert.deepEqual(
    getAiProviderOrder({
      DEEPSEEK_API_KEY: 'deepseek-valid-key',
      MINIMAX_API_KEY: 'minimax-valid-key',
    }),
    ['DeepSeek', 'MiniMax']
  );
});

test('returns a clear error when no AI providers are configured', () => {
  assert.equal(
    getNoAiProviderError().message,
    '未配置可用的 AI 服务，请至少提供 DeepSeek、Kimi 或 MiniMax 中的一个 API Key'
  );
});

test('formats better-sqlite3 native module mismatch errors into an actionable message', () => {
  const formatted = formatDatabaseDriverError({
    code: 'ERR_DLOPEN_FAILED',
    message: 'The module was compiled against a different Node.js version using NODE_MODULE_VERSION 131.',
  });

  assert.match(formatted.message, /better-sqlite3/);
  assert.match(formatted.message, /npm rebuild better-sqlite3/);
  assert.match(formatted.message, /Node\.js 版本/);
});
