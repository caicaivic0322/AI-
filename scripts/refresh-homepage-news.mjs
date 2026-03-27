import nextEnv from '@next/env';
import { refreshHomepageNews } from '../app/lib/homepage-news.mjs';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

try {
  const items = await refreshHomepageNews();
  console.log(`Homepage news refreshed: ${items.length} items`);
  items.forEach((item, index) => {
    console.log(`${index + 1}. ${item.title} | ${item.source}`);
  });
} catch (error) {
  console.error('Homepage news refresh failed:', error);
  process.exit(1);
}
