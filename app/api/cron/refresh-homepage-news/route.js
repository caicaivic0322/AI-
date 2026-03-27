import { refreshHomepageNews } from '../../../lib/homepage-news.mjs';
import { handleRefreshHomepageNewsCronRequest } from '../../../lib/api/cron-refresh-handler.mjs';

const CRON_SECRET = process.env.CRON_SECRET || '';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  return handleRefreshHomepageNewsCronRequest(request, {
    secret: CRON_SECRET,
    refreshHomepageNews,
  });
}
