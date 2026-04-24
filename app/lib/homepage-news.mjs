import fs from 'fs/promises';
import path from 'path';

const CACHE_FILE_PATH = path.join(process.cwd(), 'data', 'homepage-news.json');
const MAX_NEWS_ITEMS = 3;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const FALLBACK_UPDATED_AT = '2026-04-24T00:00:00.000+08:00';

const NEWS_SOURCES = [
  {
    source: '教育部',
    url: 'https://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/',
    focus: '高考政策、本科扩容、招生工作通知、基础学科与新兴学科布局',
    readyText: '教育部',
    articleIncludePatterns: ['/jyb_xwfb/gzdt_gzdt/', '/srcsite/A15/'],
    rawHtmlPreferred: true,
  },
  {
    source: '阳光高考',
    url: 'https://gaokao.chsi.com.cn/gkxx/zc/',
    focus: '高考招生政策、志愿填报规则、院校专业组与录取变化',
    readyText: '高考',
    articleIncludePatterns: ['/gkxx/zc/', '/news/'],
    searchDiscovery: {
      query: 'site:gaokao.chsi.com.cn 2026 高考 招生 政策 志愿填报',
      resultLimit: 3,
    },
  },
  {
    source: '中国教育在线',
    url: 'https://gaokao.eol.cn/news/',
    focus: '高校招生新闻、专业调整、就业导向、院校新增计划',
    readyText: '高考',
    articleIncludePatterns: ['/news/', '/zhengce/', '/zhuanti/'],
  },
];

export const FALLBACK_HOMEPAGE_NEWS = [
  {
    tag: '快讯',
    title: '2026高考安全工作会议召开',
    summary: '教育部会同有关部门部署2026年高考安全工作，强调公平底线、考试安全与科学选才导向。',
    source: '教育部',
    url: 'https://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/moe_1485/202604/t20260421_1434408.html',
    publishedAt: '2026-04-21',
  },
  {
    tag: '政策',
    title: '2026普通高校招生工作通知发布',
    summary: '教育部明确2026年普通高校招生工作要求，提出优化招生专业结构和规模，服务国家战略与民生需求。',
    source: '教育部',
    url: 'https://www.moe.gov.cn/srcsite/A15/moe_776/s3258/202601/t20260121_1427110.html',
    publishedAt: '2026-01-16',
  },
  {
    tag: '政策',
    title: '2026特殊类型招生工作部署',
    summary: '教育部部署2026年高校部分特殊类型招生工作，强调规范化建设、有效监督和公平公正底线。',
    source: '教育部',
    url: 'https://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/s5987/202511/t20251103_1418849.html',
    publishedAt: '2025-11-03',
  },
];

function normalizeNewsItem(item, fallbackItem) {
  return {
    tag: item?.tag || fallbackItem.tag,
    title: item?.title || fallbackItem.title,
    summary: item?.summary || fallbackItem.summary,
    source: item?.source || fallbackItem.source,
    url: item?.url || fallbackItem.url,
    publishedAt: item?.publishedAt || fallbackItem.publishedAt,
  };
}

function isValidNewsItem(item) {
  return Boolean(
    item?.title &&
    item?.summary &&
    item?.source &&
    item?.url &&
    isHomepageNewsRelevant(item.title, item.summary)
  );
}

function dedupeNewsItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.title}::${item.url}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getSourceOrder() {
  return NEWS_SOURCES.map((item) => item.source);
}

function parseNewsDate(value) {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function sortByFreshness(items) {
  return [...items].sort((a, b) => parseNewsDate(b.publishedAt) - parseNewsDate(a.publishedAt));
}

export function selectHomepageNewsItems(items) {
  const dedupedItems = sortByFreshness(dedupeNewsItems(items.filter(isValidNewsItem)));
  const selected = [];
  const sourceOrder = getSourceOrder();

  for (const sourceName of sourceOrder) {
    const item = dedupedItems.find((candidate) => candidate.source === sourceName);
    if (item && !selected.includes(item)) {
      selected.push(item);
    }
  }

  for (const item of dedupedItems) {
    if (selected.length >= MAX_NEWS_ITEMS) {
      break;
    }

    if (!selected.includes(item)) {
      selected.push(item);
    }
  }

  return selected.slice(0, MAX_NEWS_ITEMS);
}

function mergeWithFallback(items, now = new Date()) {
  const merged = selectHomepageNewsItems(filterUsableNewsItems(items, now));
  const filled = [...merged];

  for (const fallbackItem of FALLBACK_HOMEPAGE_NEWS) {
    if (filled.length >= MAX_NEWS_ITEMS) {
      break;
    }

    filled.push(normalizeNewsItem(null, fallbackItem));
  }

  return filled.slice(0, MAX_NEWS_ITEMS).map((item, index) =>
    normalizeNewsItem(item, FALLBACK_HOMEPAGE_NEWS[index])
  );
}

async function defaultReadCache() {
  const raw = await fs.readFile(CACHE_FILE_PATH, 'utf-8');
  return JSON.parse(raw);
}

async function defaultWriteCache(payload) {
  await fs.mkdir(path.dirname(CACHE_FILE_PATH), { recursive: true });
  await fs.writeFile(CACHE_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
}

function isFresh(updatedAt, now) {
  if (!updatedAt) {
    return false;
  }

  return now.getTime() - new Date(updatedAt).getTime() < CACHE_TTL_MS;
}

function getNextRefreshAt(updatedAt) {
  if (!updatedAt) {
    return null;
  }

  const updatedTime = new Date(updatedAt).getTime();
  if (Number.isNaN(updatedTime)) {
    return null;
  }

  return new Date(updatedTime + CACHE_TTL_MS).toISOString();
}

function createFeedMeta({ updatedAt, currentTime, source }) {
  const fresh = source === 'cache' && isFresh(updatedAt, currentTime);

  return {
    updatedAt: updatedAt || null,
    nextRefreshAt: getNextRefreshAt(updatedAt),
    source,
    status: fresh ? 'fresh' : source === 'cache' ? 'stale' : 'fallback',
    isStale: !fresh,
    ttlMs: CACHE_TTL_MS,
  };
}

function resolveNow(now) {
  return typeof now === 'function' ? now() : now;
}

function stripHtml(html = '') {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function limitText(text = '', maxLength = 74) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}…`;
}

function cleanNewsTitle(title = '') {
  return stripHtml(title)
    .replace(/[-_—|].*?(中华人民共和国教育部政府门户网站|教育部|阳光高考|中国教育在线).*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferPublishedAt(snapshot = {}) {
  const text = `${snapshot.title || ''} ${snapshot.text || ''} ${snapshot.url || ''}`;
  const dateMatch = text.match(/(20\d{2})[年/-](\d{1,2})[月/-](\d{1,2})/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const compactMatch = text.match(/(20\d{2})(\d{2})(\d{2})/);
  if (compactMatch) {
    const [, year, month, day] = compactMatch;
    return `${year}-${month}-${day}`;
  }

  return '';
}

function inferNewsTag(title = '', text = '') {
  const content = `${title} ${text}`;
  if (/志愿|填报|专业组|录取规则/.test(content)) {
    return '填报';
  }

  if (/召开|发布|公布|部署|快讯|动态/.test(content)) {
    return '快讯';
  }

  return '政策';
}

function isHomepageNewsRelevant(title = '', text = '') {
  const content = `${title} ${text}`;
  return /高考|普通高校招生|高校招生|招生考试|招生工作|招生计划|特殊类型招生|志愿填报|录取/.test(content);
}

function isFuturePublishedAt(publishedAt, now = new Date()) {
  if (!publishedAt) {
    return false;
  }

  const date = new Date(`${publishedAt}T00:00:00`);
  const current = resolveNow(now);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const currentDate = new Date(current.getFullYear(), current.getMonth(), current.getDate());
  return date.getTime() > currentDate.getTime();
}

function normalizeUrl(value, baseUrl) {
  try {
    return new URL(value || baseUrl, baseUrl).href;
  } catch {
    return baseUrl;
  }
}

function getKnownSnapshotUrls(source, snapshots = []) {
  const knownUrls = new Set([normalizeUrl(source.url, source.url)]);

  for (const snapshot of snapshots) {
    if (snapshot.url) {
      knownUrls.add(normalizeUrl(snapshot.url, source.url));
    }

    for (const link of snapshot.links || []) {
      if (link.href) {
        knownUrls.add(normalizeUrl(link.href, source.url));
      }
    }
  }

  return knownUrls;
}

function normalizeExtractedNewsItems(items = [], { source, snapshots = [], now = new Date() }) {
  const knownUrls = getKnownSnapshotUrls(source, snapshots);

  return items
    .map((item) => ({
      ...item,
      source: item.source || source.source,
      url: normalizeUrl(item.url, source.url),
    }))
    .filter((item) => knownUrls.has(item.url))
    .filter((item) => !isFuturePublishedAt(item.publishedAt, now))
    .filter(isValidNewsItem);
}

function filterUsableNewsItems(items = [], now = new Date()) {
  return items
    .filter((item) => !isFuturePublishedAt(item.publishedAt, now))
    .filter(isValidNewsItem);
}

function buildSummaryFromSnapshot(snapshot = {}) {
  const title = cleanNewsTitle(snapshot.title || '');
  const text = stripHtml(snapshot.text || '')
    .replace(title, ' ')
    .replace(/发布时间[:：]?\s*\d{4}[-年]\d{1,2}[-月]\d{1,2}日?/g, ' ')
    .replace(/来源[:：]?\s*[\u4e00-\u9fa5A-Za-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const sentences = text
    .split(/[。！？；]/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 18)
    .filter((sentence) => /高考|招生|高校|志愿|录取|专业|考试/.test(sentence));
  const summary = sentences[0] || text.slice(0, 90);

  return limitText(summary || title);
}

export function extractHomepageNewsHeuristically({ source, snapshots = [] }) {
  return snapshots
    .map((snapshot) => {
      const title = cleanNewsTitle(snapshot.title || '');
      const content = `${title} ${snapshot.text || ''}`;
      if (!title || !isHomepageNewsRelevant(title, content)) {
        return null;
      }

      return {
        tag: inferNewsTag(title, snapshot.text),
        title: limitText(title, 28),
        summary: buildSummaryFromSnapshot(snapshot),
        source: source.source,
        url: snapshot.url || source.url,
        publishedAt: inferPublishedAt(snapshot),
      };
    })
    .filter(isValidNewsItem);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPageReady(page, source) {
  try {
    await page.waitForFunction(() => document.readyState === 'complete', { timeout: 12000 });
  } catch {}

  if (source.readyText) {
    try {
      await page.waitForFunction(
        (text) => (document.body?.innerText || '').includes(text),
        { timeout: 8000 },
        source.readyText
      );
    } catch {}
  }

  try {
    await page.waitForFunction(
      () => Boolean(document.body?.innerText && document.body.innerText.trim().length > 120),
      { timeout: 8000 }
    );
  } catch {}
}

async function readPageSnapshot(page) {
  return page.evaluate(() => {
    const text = (document.body?.innerText || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 12000);
    const links = Array.from(document.querySelectorAll('a'))
      .map((anchor) => ({
        text: (anchor.textContent || '').replace(/\s+/g, ' ').trim(),
        href: anchor.href,
      }))
      .filter((item) => item.text.length >= 8 && item.href.startsWith('http'))
      .slice(0, 60);
    const title = document.title || '';

    return { text, links, title };
  });
}

function isRetryableContextError(error) {
  return [
    'Execution context was destroyed',
    'Cannot find context with specified id',
    'Protocol error',
  ].some((message) => error.message.includes(message));
}

async function getStablePageSnapshot(page, source) {
  let lastError;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await waitForPageReady(page, source);
      return await readPageSnapshot(page);
    } catch (error) {
      lastError = error;
      if (!isRetryableContextError(error)) {
        throw error;
      }
      await delay(600 * (attempt + 1));
    }
  }

  throw lastError;
}

async function createCrawlerApp(createCrawlerApp) {
  if (createCrawlerApp) {
    return createCrawlerApp();
  }

  const { createCrawl } = await import('x-crawl');
  return createCrawl({
    maxRetry: 2,
    intervalTime: { min: 800, max: 1600 },
  });
}

async function crawlPageSnapshot(targetUrl, source, dependencies = {}) {
  const crawlApp = await createCrawlerApp(dependencies.createCrawlerApp);
  const crawlResult = await crawlApp.crawlPage(targetUrl);
  const itemResult = Array.isArray(crawlResult) ? crawlResult[0] : crawlResult;
  const { page, browser } = itemResult.data;

  try {
    const snapshot = await getStablePageSnapshot(page, source);
    return {
      ...snapshot,
      url: targetUrl,
      source: source.source,
    };
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

export function pickHomepageArticleLinks(source, links = []) {
  const patterns = source.articleIncludePatterns || [];
  const sourceHost = new URL(source.url).host;
  const candidates = links
    .filter((item) => item?.href && item?.text)
    .filter((item) => {
      const url = item.href;
      if (!url.startsWith('http')) {
        return false;
      }

      const host = new URL(url).host;
      if (host !== sourceHost) {
        return false;
      }

      if (item.text.length < 6) {
        return false;
      }

      return patterns.some((pattern) => url.includes(pattern));
    })
    .map((item) => item.href);

  return [...new Set(candidates)].slice(0, MAX_NEWS_ITEMS);
}

function extractLinksFromHtml(source, html = '') {
  const matches = [...html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const links = matches.map((match) => ({
    href: match[1],
    text: match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  }));

  return pickHomepageArticleLinks(
    source,
    links.map((item) => ({
      ...item,
      href: item.href.startsWith('http') ? item.href : new URL(item.href, source.url).href,
    }))
  );
}

function extractTitleFromHtml(html = '') {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return titleMatch ? stripHtml(titleMatch[1]) : '';
}

function buildRawHtmlSnapshot(source, targetUrl, html = '') {
  return {
    title: extractTitleFromHtml(html),
    text: stripHtml(html).slice(0, 12000),
    links: [...html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
      .map((match) => ({
        href: match[1].startsWith('http') ? match[1] : new URL(match[1], targetUrl).href,
        text: stripHtml(match[2]),
      }))
      .filter((item) => item.text.length >= 6),
    url: targetUrl,
    source: source.source,
  };
}

export async function discoverSourceLinksViaSearch(source, dependencies = {}) {
  if (!source.searchDiscovery) {
    return [];
  }

  const {
    fetchHtmlSearch = async (query) => {
      const response = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });

      if (!response.ok) {
        throw new Error(`HTML search fallback failed: ${response.status}`);
      }

      return response.text();
    },
    searchWeb = async (query) => {
      const apiKey = process.env.TAVILY_API_KEY;
      if (!apiKey) {
        return [];
      }

      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          max_results: source.searchDiscovery.resultLimit || MAX_NEWS_ITEMS,
          search_depth: 'advanced',
        }),
      });

      if (!response.ok) {
        throw new Error(`Search discovery failed: ${response.status}`);
      }

      const payload = await response.json();
      return payload.results || [];
    },
  } = dependencies;

  let discoveredLinks = [];

  try {
    const results = await searchWeb(source.searchDiscovery.query);
    discoveredLinks = results
      .map((item) => item.url || item.href)
      .filter(Boolean);

    if (source.url) {
      return pickHomepageArticleLinks(source, results.map((item) => ({
        href: item.url || item.href,
        text: item.title || item.content || '',
      })));
    }
  } catch {
    const html = await fetchHtmlSearch(source.searchDiscovery.query);
    discoveredLinks = [...html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
      .map((match) => ({
        href: match[1],
        text: stripHtml(match[2]),
      }))
      .map((item) => ({
        ...item,
        href: item.href.startsWith('http') ? item.href : '',
      }))
      .filter((item) => item.href);
  }

  if (!source.url) {
    return [...new Set(discoveredLinks)].slice(0, source.searchDiscovery.resultLimit || MAX_NEWS_ITEMS);
  }

  return pickHomepageArticleLinks(source, discoveredLinks.map((item) => ({
    href: typeof item === 'string' ? item : item.href,
    text: typeof item === 'string' ? source.focus : item.text,
  })));
}

export async function collectSourceArticleSnapshots(source, dependencies = {}) {
  const {
    crawlSnapshot = (targetUrl) => crawlPageSnapshot(targetUrl, source, dependencies),
    fetchSourceHtml = async (targetUrl) => {
      const response = await fetch(targetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      return response.text();
    },
  } = dependencies;
  let entrySnapshot;
  try {
    entrySnapshot = await crawlSnapshot(source.url);
  } catch (error) {
    try {
      entrySnapshot = buildRawHtmlSnapshot(source, source.url, await fetchSourceHtml(source.url));
    } catch {
      throw error;
    }
  }

  let articleLinks = pickHomepageArticleLinks(source, entrySnapshot.links);

  if (articleLinks.length === 0 && entrySnapshot.text.length < 120) {
    try {
      articleLinks = extractLinksFromHtml(source, await fetchSourceHtml(source.url));
    } catch (error) {
      console.warn(`Homepage raw html fallback failed for ${source.source}:`, error.message);
    }
  }

  if (articleLinks.length === 0 && source.searchDiscovery) {
    try {
      articleLinks = await discoverSourceLinksViaSearch(source, dependencies);
    } catch (error) {
      console.warn(`Homepage search discovery failed for ${source.source}:`, error.message);
    }
  }

  if (articleLinks.length === 0) {
    return [entrySnapshot];
  }

  const articleSnapshots = [];
  for (const articleUrl of articleLinks) {
    try {
      articleSnapshots.push(await crawlSnapshot(articleUrl));
    } catch (error) {
      try {
        articleSnapshots.push(buildRawHtmlSnapshot(source, articleUrl, await fetchSourceHtml(articleUrl)));
      } catch {
        console.warn(`Homepage detail crawl failed for ${source.source}:`, error.message);
      }
    }
  }

  return articleSnapshots.length > 0 ? articleSnapshots : [entrySnapshot];
}

async function extractNewsFromSnapshots({ source, snapshots, fetchImpl = fetch }) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return extractHomepageNewsHeuristically({ source, snapshots });
  }

  try {
    const response = await fetchImpl('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: '你是高考资讯编辑。请从资讯详情页或栏目页内容中提取最多 3 条适合放在首页的最新高考政策或高校招考快讯，只输出 JSON。',
          },
          {
            role: 'user',
            content: JSON.stringify({
              instruction: '返回 { "items": [{ "tag": "政策/填报/快讯", "title": "", "summary": "", "url": "", "publishedAt": "YYYY-MM-DD 或空字符串", "source": "" }] }。summary 控制在 60 字以内，优先选择与 2026 高考政策、招生计划、专业调整、高校招办动态相关的信息；优先详情页，不足时再使用栏目页。',
              source,
              articlePages: snapshots.map((snapshot) => ({
                url: snapshot.url,
                title: snapshot.title,
                text: snapshot.text,
                candidateLinks: snapshot.links,
              })),
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek extract failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{"items":[]}';
    const parsed = JSON.parse(content);

    return normalizeExtractedNewsItems(parsed.items || [], { source, snapshots });
  } catch (error) {
    console.warn(`Homepage AI extraction failed for ${source.source}, using heuristic fallback:`, error.message);
    return extractHomepageNewsHeuristically({ source, snapshots });
  }
}

export async function crawlHomepageNewsWithXCrawl(dependencies = {}) {
  const { fetchImpl = fetch } = dependencies;
  const newsItems = [];

  for (const source of NEWS_SOURCES) {
    try {
      const snapshots = await collectSourceArticleSnapshots(source, dependencies);
      const extracted = await extractNewsFromSnapshots({ source, snapshots, fetchImpl });
      newsItems.push(...extracted);
    } catch (error) {
      console.warn(`Homepage news crawl failed for ${source.source}:`, error.message);
    }
  }

  return newsItems;
}

export async function getHomepageNews(dependencies = {}) {
  const feed = await getHomepageNewsFeed(dependencies);
  return feed.items;
}

export async function getHomepageNewsFeed(dependencies = {}) {
  const {
    now = new Date(),
    readCache = defaultReadCache,
  } = dependencies;
  const currentTime = resolveNow(now);

  try {
    const payload = await readCache();
    if (Array.isArray(payload?.items) && payload.items.length > 0) {
      return {
        items: mergeWithFallback(payload.items, currentTime),
        meta: createFeedMeta({
          updatedAt: payload.updatedAt,
          currentTime,
          source: 'cache',
        }),
      };
    }
  } catch {}

  return {
    items: FALLBACK_HOMEPAGE_NEWS,
    meta: createFeedMeta({
      updatedAt: FALLBACK_UPDATED_AT,
      currentTime,
      source: 'fallback',
    }),
  };
}

export async function refreshHomepageNews(dependencies = {}) {
  const {
    now = new Date(),
    crawlHomepageNews = crawlHomepageNewsWithXCrawl,
    writeCache = defaultWriteCache,
  } = dependencies;
  const currentTime = resolveNow(now);

  const rawItems = await crawlHomepageNews();
  const items = mergeWithFallback(rawItems, currentTime);
  const payload = {
    updatedAt: currentTime.toISOString(),
    items,
  };

  await writeCache(payload);

  return items;
}
