const POLICY_SOURCE_HINT = '(site:moe.gov.cn OR site:gaokao.cn OR site:eol.cn)';
const NEWS_SOURCE_HINT = '(site:edu.cn OR site:gaokao.cn OR site:eol.cn)';

export function buildTavilyQueries(formData) {
  return [
    `${POLICY_SOURCE_HINT} 最新 ${formData.province} ${formData.subject_type} ${formData.score}分 位次${formData.rank} 高考政策 录取线 志愿填报`,
    `${NEWS_SOURCE_HINT} ${formData.target_city ? `${formData.target_city} ` : ''}${formData.school_preference || '大学'} ${(
      formData.interests || []
    ).slice(0, 2).join(' ')} 高校招生新闻 专业调整 就业趋势`,
  ];
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
