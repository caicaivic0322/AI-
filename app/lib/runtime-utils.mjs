function hasUsableApiKey(value) {
  return Boolean(value && value.length > 10 && !value.includes('your_'));
}

export function getAiProviderOrder(env = process.env) {
  const providers = [
    ['DeepSeek', env.DEEPSEEK_API_KEY],
    ['Kimi', env.KIMI_API_KEY],
    ['MiniMax', env.MINIMAX_API_KEY],
  ];

  return providers
    .filter(([, apiKey]) => hasUsableApiKey(apiKey))
    .map(([name]) => name);
}

export function getNoAiProviderError() {
  return new Error('未配置可用的 AI 服务，请至少提供 DeepSeek、Kimi 或 MiniMax 中的一个 API Key');
}

export function formatDatabaseDriverError(error) {
  const message = error?.message || '';
  const isNativeModuleMismatch =
    error?.code === 'ERR_DLOPEN_FAILED' ||
    message.includes('NODE_MODULE_VERSION') ||
    message.includes('compiled against a different Node.js version');

  if (isNativeModuleMismatch) {
    return new Error(
      'better-sqlite3 原生模块与当前 Node.js 版本不匹配，请使用安装依赖时相同的 Node.js 版本重新运行，并执行 npm rebuild better-sqlite3'
    );
  }

  return new Error(`数据库初始化失败：${message || '未知错误'}`);
}
