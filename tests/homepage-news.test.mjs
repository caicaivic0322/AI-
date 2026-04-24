import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FALLBACK_HOMEPAGE_NEWS,
  collectSourceArticleSnapshots,
  discoverSourceLinksViaSearch,
  extractHomepageNewsHeuristically,
  getHomepageNews,
  getHomepageNewsFeed,
  pickHomepageArticleLinks,
  refreshHomepageNews,
  selectHomepageNewsItems,
} from '../app/lib/homepage-news.mjs';

test('returns fallback homepage news when cache is unavailable', async () => {
  const items = await getHomepageNews({
    readCache: async () => {
      throw new Error('missing cache');
    },
  });

  assert.equal(items.length, 3);
  assert.deepEqual(items, FALLBACK_HOMEPAGE_NEWS);
});

test('uses stale cached homepage news instead of older fallback items', async () => {
  const feed = await getHomepageNewsFeed({
    now: () => new Date('2026-04-24T10:00:00.000Z'),
    readCache: async () => ({
      updatedAt: '2026-03-27T10:00:00.000Z',
      items: [
        {
          tag: '快讯',
          title: '缓存里的最新高考快讯',
          summary: '这条内容来自已有缓存，即使超过刷新周期也应先展示，避免退回更旧兜底。',
          source: '教育部',
          url: 'https://www.moe.gov.cn/example-cache',
          publishedAt: '2026-03-27',
        },
      ],
    }),
  });

  assert.equal(feed.items.length, 3);
  assert.equal(feed.items[0].title, '缓存里的最新高考快讯');
  assert.equal(feed.meta.status, 'stale');
  assert.equal(feed.meta.source, 'cache');
});

test('refreshes homepage news from crawler results and fills gaps with fallback items', async () => {
  let storedPayload;

  const items = await refreshHomepageNews({
    now: () => new Date('2026-03-27T10:00:00.000Z'),
    crawlHomepageNews: async () => [
      {
        title: '教育部继续推进优质本科扩容',
        summary: '招生计划继续向基础学科、新兴学科和交叉学科倾斜。',
        source: '教育部',
        url: 'https://www.moe.gov.cn/example-1',
        publishedAt: '2026-03-27',
      },
    ],
    writeCache: async (payload) => {
      storedPayload = payload;
    },
  });

  assert.equal(items.length, 3);
  assert.equal(items[0].title, '教育部继续推进优质本科扩容');
  assert.equal(items[0].source, '教育部');
  assert.equal(items[0].url, 'https://www.moe.gov.cn/example-1');
  assert.equal(storedPayload.items.length, 3);
  assert.equal(storedPayload.updatedAt, '2026-03-27T10:00:00.000Z');
});

test('extracts homepage news heuristically when AI extraction is unavailable', () => {
  const items = extractHomepageNewsHeuristically({
    source: {
      source: '教育部',
      url: 'https://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/',
    },
    snapshots: [
      {
        title: '2026年全国普通高校招生考试安全工作视频会议召开 - 中华人民共和国教育部政府门户网站',
        text: '2026-04-21 来源：教育部 4月21日，教育部会同国家教育统一考试工作部际联席会议成员单位，召开2026年全国普通高校招生考试安全工作视频会议。会议要求牢牢把握高考公平底线。',
        url: 'https://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/moe_1485/202604/t20260421_1434408.html',
      },
      {
        title: '教育部、人社部部署2026年高校毕业生就业政策宣传活动',
        text: '两部门联合开展就业政策宣传，促进毕业生高质量就业。',
        url: 'https://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/s5987/202604/t20260424_1434667.html',
      },
    ],
  });

  assert.equal(items.length, 1);
  assert.equal(items[0].tag, '快讯');
  assert.equal(items[0].publishedAt, '2026-04-21');
  assert.match(items[0].title, /2026年全国普通高校招生考试安全工作视频会议召开/);
  assert.match(items[0].summary, /高考|普通高校招生考试/);
});

test('refresh filters future or unrelated extracted news before writing cache', async () => {
  let storedPayload;
  const items = await refreshHomepageNews({
    now: () => new Date('2026-04-24T10:00:00.000Z'),
    crawlHomepageNews: async () => [
      {
        tag: '填报',
        title: '2026年志愿填报规则变化解读',
        summary: '新高考省份志愿填报规则调整。',
        source: '阳光高考',
        url: 'https://gaokao.chsi.com.cn/future',
        publishedAt: '2026-05-03',
      },
      {
        tag: '政策',
        title: '高校毕业生就业政策宣传活动',
        summary: '两部门联合开展就业政策宣传。',
        source: '教育部',
        url: 'https://www.moe.gov.cn/jobs',
        publishedAt: '2026-04-24',
      },
    ],
    writeCache: async (payload) => {
      storedPayload = payload;
    },
  });

  assert.equal(items.length, 3);
  assert.equal(items[0].title, '2026高考安全工作会议召开');
  assert.deepEqual(storedPayload.items, items);
});

test('picks candidate article links from stable source pages', () => {
  const links = pickHomepageArticleLinks(
    {
      source: '阳光高考',
      url: 'https://gaokao.chsi.com.cn/',
      articleIncludePatterns: ['/gkxx/zc/', '/news/'],
    },
    [
      { text: '2026 年普通高校招生工作通知', href: 'https://gaokao.chsi.com.cn/gkxx/zc/202603/20260327/1.html' },
      { text: '首页', href: 'https://gaokao.chsi.com.cn/' },
      { text: '招生章程查询', href: 'https://gaokao.chsi.com.cn/gkxx/zszc/' },
      { text: '高校新增专业解读', href: 'https://gaokao.chsi.com.cn/news/202603/t20260327_1.shtml' },
      { text: '高校新增专业解读', href: 'https://gaokao.chsi.com.cn/news/202603/t20260327_1.shtml' },
    ]
  );

  assert.deepEqual(links, [
    'https://gaokao.chsi.com.cn/gkxx/zc/202603/20260327/1.html',
    'https://gaokao.chsi.com.cn/news/202603/t20260327_1.shtml',
  ]);
});

test('collects detail snapshots after crawling an entry page', async () => {
  const calls = [];
  const snapshots = await collectSourceArticleSnapshots(
    {
      source: '教育部',
      url: 'https://www.moe.gov.cn/jyb_xwfb/',
      articleIncludePatterns: ['/jyb_xwfb/'],
    },
    {
      crawlSnapshot: async (targetUrl) => {
        calls.push(targetUrl);
        if (targetUrl === 'https://www.moe.gov.cn/jyb_xwfb/') {
          return {
            text: '列表页',
            links: [
              { text: '教育部部署2026年招生工作', href: 'https://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/202603/t20260327_1.html' },
              { text: '关于扩容优质本科', href: 'https://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/202603/t20260327_2.html' },
            ],
          };
        }

        return {
          text: `详情页:${targetUrl}`,
          links: [],
        };
      },
    }
  );

  assert.deepEqual(calls, [
    'https://www.moe.gov.cn/jyb_xwfb/',
    'https://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/202603/t20260327_1.html',
    'https://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/202603/t20260327_2.html',
  ]);
  assert.equal(snapshots.length, 2);
  assert.match(snapshots[0].text, /详情页/);
});

test('falls back to raw html link discovery when entry snapshot is empty', async () => {
  const calls = [];
  const snapshots = await collectSourceArticleSnapshots(
    {
      source: '中国教育在线',
      url: 'https://gaokao.eol.cn/news/',
      articleIncludePatterns: ['/news/'],
    },
    {
      crawlSnapshot: async (targetUrl) => {
        calls.push(targetUrl);
        if (targetUrl === 'https://gaokao.eol.cn/news/') {
          return { text: '', links: [], title: '', url: targetUrl };
        }

        return { text: `详情页:${targetUrl}`, links: [], title: '详情', url: targetUrl };
      },
      fetchSourceHtml: async () => `
        <html><body>
          <a href="https://gaokao.eol.cn/news/202603/t20260327_1.shtml">2026 高校招生新变化</a>
          <a href="https://gaokao.eol.cn/news/202603/t20260327_2.shtml">新专业与扩招方向解读</a>
        </body></html>
      `,
    }
  );

  assert.deepEqual(calls, [
    'https://gaokao.eol.cn/news/',
    'https://gaokao.eol.cn/news/202603/t20260327_1.shtml',
    'https://gaokao.eol.cn/news/202603/t20260327_2.shtml',
  ]);
  assert.equal(snapshots.length, 2);
});

test('falls back to raw html detail extraction when article crawl fails', async () => {
  const calls = [];
  const snapshots = await collectSourceArticleSnapshots(
    {
      source: '教育部',
      url: 'https://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/',
      articleIncludePatterns: ['/jyb_xwfb/gzdt_gzdt/'],
    },
    {
      crawlSnapshot: async (targetUrl) => {
        calls.push(targetUrl);
        if (targetUrl.endsWith('/gzdt_gzdt/')) {
          return {
            text: '栏目页',
            links: [
              {
                text: '教育部部署2026年高招工作',
                href: 'https://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/202603/t20260327_1.html',
              },
            ],
            title: '栏目页',
            url: targetUrl,
          };
        }

        throw new Error('detail crawl failed');
      },
      fetchSourceHtml: async (targetUrl) => {
        if (targetUrl.includes('t20260327_1')) {
          return `
            <html>
              <head><title>教育部部署2026年高招工作</title></head>
              <body>
                <div class="article">
                  <p>教育部部署2026年普通高校招生工作。</p>
                  <p>继续扩大优质本科供给。</p>
                </div>
              </body>
            </html>
          `;
        }
        return '';
      },
    }
  );

  assert.deepEqual(calls, [
    'https://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/',
    'https://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/202603/t20260327_1.html',
  ]);
  assert.equal(snapshots.length, 1);
  assert.match(snapshots[0].title, /教育部部署2026年高招工作/);
  assert.match(snapshots[0].text, /继续扩大优质本科供给/);
});

test('discovers site links through search when source is configured for search-first discovery', async () => {
  const links = await discoverSourceLinksViaSearch(
    {
      source: '阳光高考',
      searchDiscovery: {
        query: 'site:gaokao.chsi.com.cn 2026 高考 招生 政策',
        resultLimit: 3,
      },
    },
    {
      searchWeb: async (query) => {
        assert.match(query, /site:gaokao\.chsi\.com\.cn/);
        return [
          { url: 'https://gaokao.chsi.com.cn/gkxx/zc/202603/20260327/1.html' },
          { url: 'https://gaokao.chsi.com.cn/gkxx/zc/202603/20260327/2.html' },
          { url: 'https://gaokao.chsi.com.cn/news/202603/3.html' },
        ];
      },
    }
  );

  assert.deepEqual(links, [
    'https://gaokao.chsi.com.cn/gkxx/zc/202603/20260327/1.html',
    'https://gaokao.chsi.com.cn/gkxx/zc/202603/20260327/2.html',
    'https://gaokao.chsi.com.cn/news/202603/3.html',
  ]);
});

test('falls back to html search parsing when api-based search discovery fails', async () => {
  const links = await discoverSourceLinksViaSearch(
    {
      source: '阳光高考',
      url: 'https://gaokao.chsi.com.cn/gkxx/zc/',
      articleIncludePatterns: ['/gkxx/zc/', '/news/'],
      searchDiscovery: {
        query: 'site:gaokao.chsi.com.cn 2026 高考 招生 政策',
        resultLimit: 2,
      },
    },
    {
      searchWeb: async () => {
        throw new Error('401');
      },
      fetchHtmlSearch: async () => `
        <html><body>
          <a href="https://gaokao.chsi.com.cn/gkxx/zc/202603/20260327/1.html">2026 高招政策</a>
          <a href="https://gaokao.chsi.com.cn/news/202603/2.html">2026 招生快讯</a>
        </body></html>
      `,
    }
  );

  assert.deepEqual(links, [
    'https://gaokao.chsi.com.cn/gkxx/zc/202603/20260327/1.html',
    'https://gaokao.chsi.com.cn/news/202603/2.html',
  ]);
});

test('selects homepage news with source quota before filling remaining slots', () => {
  const selected = selectHomepageNewsItems([
    {
      tag: '政策',
      title: '教育部高考招生通知',
      summary: '教育部发布普通高校招生工作安排。',
      source: '教育部',
      url: 'https://www.moe.gov.cn/1',
      publishedAt: '2026-03-27',
    },
    {
      tag: '政策',
      title: '阳光高考政策',
      summary: '阳光高考发布志愿填报政策说明。',
      source: '阳光高考',
      url: 'https://gaokao.chsi.com.cn/1',
      publishedAt: '2026-03-27',
    },
    {
      tag: '快讯',
      title: '中教在线招生快讯',
      summary: '中国教育在线发布高校招生快讯。',
      source: '中国教育在线',
      url: 'https://gaokao.eol.cn/1',
      publishedAt: '2026-03-27',
    },
    {
      tag: '快讯',
      title: '中教在线招生快讯2',
      summary: '中国教育在线发布高考招生快讯。',
      source: '中国教育在线',
      url: 'https://gaokao.eol.cn/2',
      publishedAt: '2026-03-27',
    },
  ]);

  assert.deepEqual(selected.map((item) => item.source), ['教育部', '阳光高考', '中国教育在线']);
});
