import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTavilyQueries,
  buildTavilySearchContext,
} from '../app/lib/tavily-utils.mjs';

test('builds tavily queries with authoritative education sources', () => {
  const queries = buildTavilyQueries({
    province: '浙江',
    subject_type: '物理类',
    score: '650',
    rank: '8000',
    target_city: '杭州',
    school_preference: '985',
    interests: ['计算机/互联网', '人工智能'],
  });

  assert.equal(queries.length, 2);
  assert.match(queries[0], /site:moe\.gov\.cn/);
  assert.match(queries[0], /site:gaokao\.cn/);
  assert.match(queries[1], /site:edu\.cn/);
  assert.match(queries[1], /杭州/);
});

test('formats tavily results with source titles and urls', () => {
  const context = buildTavilySearchContext([
    {
      answer: '教育部已发布 2026 高招工作通知。',
      results: [
        {
          title: '教育部关于做好2026年普通高校招生工作的通知',
          url: 'https://www.moe.gov.cn/example',
          content: '继续扩大优质本科供给，优化专业布局。',
        },
      ],
    },
  ]);

  assert.match(context, /AI 检索摘要/);
  assert.match(context, /来源 \[教育部关于做好2026年普通高校招生工作的通知\]/);
  assert.match(context, /链接: https:\/\/www\.moe\.gov\.cn\/example/);
  assert.match(context, /继续扩大优质本科供给/);
});
