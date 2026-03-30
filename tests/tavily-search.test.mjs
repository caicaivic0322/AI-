import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTavilyQueries,
  buildTavilySearchContext,
  buildEvidenceQueries,
  buildSourceNotes,
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

test('builds follow-up evidence queries for candidate schools and majors', () => {
  const queries = buildEvidenceQueries(
    {
      province: '陕西',
      subject_type: '物理类',
    },
    [
      { school: '西安邮电大学', major: '电子信息工程' },
      { school: '西安工业大学', major: '计算机科学与技术' },
    ]
  );

  assert.equal(queries.length, 6);
  assert.match(queries[0], /西安邮电大学/);
  assert.match(queries[0], /电子信息工程/);
  assert.match(queries[0], /陕西/);
  assert.match(queries[0], /录取位次/);
  assert.match(queries[1], /就业质量报告/);
  assert.match(queries[2], /招生章程/);
});

test('builds source notes with authoritative references and data gaps', () => {
  const sourceNotes = buildSourceNotes([
    {
      results: [
        {
          title: '西安邮电大学 2024 年本科招生章程',
          url: 'https://zs.xupt.edu.cn/example',
          content: '公布招生章程与专业要求。',
        },
        {
          title: '西安工业大学 2024 届毕业生就业质量报告',
          url: 'https://job.xatu.edu.cn/report',
          content: '披露毕业去向落实率和重点行业流向。',
        },
      ],
    },
  ]);

  assert.match(sourceNotes.summary, /公开来源/);
  assert.equal(sourceNotes.items.length, 2);
  assert.equal(sourceNotes.items[0].category, '招生');
  assert.equal(sourceNotes.items[1].category, '就业');
  assert.equal(Array.isArray(sourceNotes.data_gaps), true);
});
