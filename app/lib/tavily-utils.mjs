const POLICY_SOURCE_HINT = '(site:moe.gov.cn OR site:gaokao.cn OR site:eol.cn)';
const NEWS_SOURCE_HINT = '(site:edu.cn OR site:gaokao.cn OR site:eol.cn)';
const EVIDENCE_SOURCE_HINT = '(site:gaokao.cn OR site:eol.cn OR site:gov.cn OR site:edu.cn OR site:*.edu.cn)';

export function buildTavilyQueries(formData) {
  return [
    `${POLICY_SOURCE_HINT} 最新 ${formData.province} ${formData.subject_type} ${formData.score}分 位次${formData.rank} 高考政策 录取线 志愿填报`,
    `${NEWS_SOURCE_HINT} ${formData.target_city ? `${formData.target_city} ` : ''}${formData.school_preference || '大学'} ${(
      formData.interests || []
    ).slice(0, 2).join(' ')} 高校招生新闻 专业调整 就业趋势`,
  ];
}

export function buildEvidenceQueries(formData, plans = []) {
  return (plans || [])
    .filter((plan) => plan?.school && plan?.major)
    .slice(0, 3)
    .flatMap((plan) => ([
      `${EVIDENCE_SOURCE_HINT} ${plan.school} ${plan.major} ${formData.province || ''} 录取位次 分数线 招生计划`,
      `${EVIDENCE_SOURCE_HINT} ${plan.school} ${plan.major} 就业质量报告 就业去向`,
      `${EVIDENCE_SOURCE_HINT} ${plan.school} ${plan.major} 招生章程 培养方案`,
    ]));
}

export function buildTavilySearchContext(results) {
  let searchContext = '## 🌐 系统自动检索的最新互联网参考数据\n';
  searchContext += '优先参考教育部、阳光高考、教育系统及高校公开来源；以下内容仅作为辅助判断依据，需与考生实际省份规则和院校最新招生章程交叉核对。\n';

  results.forEach((result) => {
    if (!result) {
      return;
    }

    if (result.answer) {
      searchContext += `\n【AI 检索摘要】: ${result.answer}\n`;
    }

    (result.results || []).forEach((item) => {
      searchContext += `- 来源 [${item.title}] 链接: ${item.url || '未提供'}\n`;
      searchContext += `  摘要: ${item.content}\n`;
    });
  });

  return searchContext;
}

function inferSourceCategory(item = {}) {
  const text = `${item.title || ''} ${item.url || ''} ${item.content || ''}`;

  if (/就业|毕业生|去向/.test(text)) {
    return '就业';
  }

  if (/招生|章程|录取|分数线|位次/.test(text)) {
    return '招生';
  }

  if (/政策|考试院|教育部|教育厅/.test(text)) {
    return '政策';
  }

  return '院校';
}

export function buildSourceNotes(results = []) {
  const items = [];

  results.forEach((result) => {
    (result?.results || []).forEach((item) => {
      if (!item?.title || !item?.url) {
        return;
      }

      if (items.some((existing) => existing.url === item.url)) {
        return;
      }

      items.push({
        title: item.title,
        url: item.url,
        snippet: item.content || '',
        category: inferSourceCategory(item),
      });
    });
  });

  const categories = new Set(items.map((item) => item.category));
  const dataGaps = [];

  if (!categories.has('招生')) {
    dataGaps.push('候选院校的官方招生章程、历年录取位次或分数线仍需继续核验。');
  }

  if (!categories.has('就业')) {
    dataGaps.push('候选专业对应的就业质量报告或毕业去向公开数据仍需继续补充。');
  }

  return {
    summary: items.length > 0
      ? `本报告额外参考了 ${items.length} 条公开来源，优先覆盖招生政策、院校招生信息与就业质量材料。`
      : '本报告暂未补充到足够的公开来源，建议在正式填报前继续核验招生与就业信息。',
    items: items.slice(0, 8),
    data_gaps: dataGaps,
  };
}

export function buildEvidenceSearchContext(results) {
  const sourceNotes = buildSourceNotes(results);
  let context = '## 🔎 针对候选院校与专业的定向补充证据\n';
  context += `${sourceNotes.summary}\n`;

  sourceNotes.items.forEach((item) => {
    context += `- [${item.category}] ${item.title}\n`;
    context += `  链接: ${item.url}\n`;
    context += `  摘要: ${item.snippet}\n`;
  });

  return context;
}
