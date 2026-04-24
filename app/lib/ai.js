import fs from 'fs';
import path from 'path';
import { getAiProviderOrder, getNoAiProviderError } from './runtime-utils.mjs';
import {
  buildTavilyQueries,
  buildTavilySearchContext,
  buildEvidenceQueries,
  buildEvidenceSearchContext,
  buildSourceNotes,
} from './tavily-utils.mjs';
import { sanitizeReportForUserDisplay, GENERIC_VERIFY_NOTE } from './report-presentation.mjs';
import { formatHomeProvincePreference, formatSchoolPreference } from './form-utils.mjs';
import { enrichAdmissionRates } from './admission-utils.mjs';
import {
  buildAdmissionPlanContext,
  enrichReportWithAdmissionPlans,
  loadAdmissionPlans,
} from './admission-plans.mjs';

// Read skill files to build system prompt
function readSkillFile(relativePath) {
  try {
    const skillBase = path.join(process.cwd(), '..', 'gaokao-volunteer-planner');
    const fullPath = path.join(skillBase, relativePath);
    return fs.readFileSync(fullPath, 'utf-8');
  } catch (e) {
    console.warn(`Failed to read skill file: ${relativePath}`, e.message);
    return '';
  }
}

function buildSystemPrompt() {
  const methodology = readSkillFile('references/methodology.md');
  const scoringModel = readSkillFile('references/scoring-model.md');
  readSkillFile('assets/output-template.md');

  return `你是一个专业的高考志愿填报分析师。请严格按照以下方法论和评分模型进行分析。

## 方法论
${methodology}

## 评分模型
${scoringModel}

## 输出要求
请将你的分析结果以 JSON 格式输出，结构如下：
{
  "concise_report": {
    "summary": "简明结论，用1段话概括最适合的填报策略",
    "volunteer_table": [
      {
        "priority": "按真实高考志愿格式填写，例如：本科普通批 第1志愿",
        "school": "学校名称",
        "major": "专业名称",
        "fill_strategy": "冲刺|稳妥|保底",
        "note": "一句简短备注，说明为什么放在这个位置"
      }
    ]
  },
  "student_summary": "学生定位总结（一段话）",
  "family_summary": "家庭偏好总结（一段话）",
  "strategy": {
    "core": "核心策略说明",
    "not_recommended": "不优先的方向及原因",
    "uncertainties": "当前不确定性"
  },
  "plans": [
    {
      "type": "稳妥|均衡|冲刺",
      "school": "学校名称（或目标院校层级）",
      "major": "专业名称（或专业方向）",
      "admission_rate": "录取可行性等级（高/中高/中/中低/低 或 需历史数据复核）",
      "undergrad_employment": "本科就业前景（定性描述）",
      "grad_employment": "硕士就业前景（定性描述）",
      "civil_service_friendly": "考公友好度（高/中高/中/中低/低）",
      "soe_fit": "国企适配度（高/中高/中/中低/低）",
      "grad_boost": "考研增益率（高/中高/中/中低/低）",
      "reason": "推荐理由（用家长听得懂的话）",
      "risk": "风险提示",
      "alternative": "替代方案"
    }
  ],
  "family_concerns": {
    "civil_service": "适不适合考公/考编的回答",
    "graduate_school": "值不值得考研的回答",
    "soe_opportunity": "进国企机会大不大的回答",
    "location_advice": "留在本省还是去外地的建议"
  },
  "recommendation_evidence": {
    "overall_judgment": "对本次推荐判断逻辑的总体说明，要客观理性，但不要直接写“可信度中等/较低”",
    "factors": [
      {
        "title": "判断维度，例如：位次匹配 / 城市资源 / 专业趋势",
        "analysis": "这一维度下的分析",
        "evidence": "支持判断的依据或观察",
        "conclusion": "这一维度对最终填报的结论"
      }
    ],
    "school_major_rationales": [
      {
        "school": "学校名称",
        "major": "专业名称",
        "rationale": "为什么推荐这个学校和专业",
        "evidence": "支持该推荐的硬依据",
        "risk_balance": "风险与收益平衡判断"
      }
    ]
  },
  "source_notes": {
    "summary": "本次报告参考的外部来源摘要",
    "items": [
      {
        "title": "来源标题",
        "url": "来源链接",
        "snippet": "与推荐直接相关的摘要",
        "category": "政策|招生|就业|院校"
      }
    ],
    "data_gaps": ["当前仍缺失或建议继续核验的数据点"]
  },
  "employment_trends": {
    "overview": "总览判断，用2-3句给出整体结论，语言要像咨询纪要摘要，短、稳、克制",
    "items": [
      {
        "plan_type": "稳妥|均衡|冲刺",
        "school": "学校名称",
        "major": "专业名称",
        "trend_verdict": "景气上行|稳中向好|总体平稳|竞争承压|审慎配置",
        "trend_window": "趋势窗口，用一句话概括未来3-5年的景气变化",
        "demand_signal": "需求牵引，用一句话说明岗位需求、政策方向、行业吸纳能力",
        "sector_direction": "主要去向，用一句话说明更适合进入的行业赛道或岗位类型",
        "regional_fit": "区域适配，用一句话说明与目标城市或区域的匹配度",
        "risk_note": "风险暴露，用一句话点出关键风险，不要泛泛而谈",
        "advice": "配置建议，用动作型表达，直接告诉家长和考生应该怎么配置"
      }
    ],
    "action_summary": "配置结论，用2-3句给出总体配置动作，不要重复前文"
  },
  "final_notes": {
    "data_to_verify": "简短的使用提醒，例如以最新招生章程和招生计划为准",
    "scope": "本建议的适用边界",
    "next_steps": "下一步建议动作"
  }
}

## 重要规则
- 严禁伪造精确百分比
- 不要把假设写成事实
- 不要承诺录取结果
- “简明版”必须像真实志愿表，直接列学校、专业和志愿顺序，不要写成散文
- “全面版”必须给出有力凭据，不能只有结论没有依据
- 如果提供了外部来源，必须在 source_notes 中整理为“来源摘要 + 来源条目”
- 不要向用户直接展开“缺什么数据、可信度中等、仍需补充哪些学校专业数据”这类削弱决策信心的表述
- 对于录取可行性，如果已有历史位次、分数线、招生计划等线索，请优先输出明确等级，不要停留在“需历史数据复核”
- “专业与就业趋势研判”必须使用更专业、克制、面向未来3-5年的判断方式，不要写空泛口号
- “专业与就业趋势研判”必须像正式咨询报告：先给结论，再给依据，再给风险与建议
- 每个趋势字段尽量具体，优先写“需求牵引、主要去向、区域适配、风险暴露、配置建议”，不要写空泛套话
- 尽量使用短句、判断句、动作句，不要堆砌背景解释
- 避免“建议可以考虑”“总体来说”这类空泛缓冲语，直接给出结论
- 如果信息不足以确定具体学校，输出"目标院校层级 + 专业方向 + 选择原则"
- 使用家长容易理解的话，避免抽象术语
- 仅输出 JSON，不要输出其他内容`;
}

function buildUserPrompt(formData) {
  const autoModeNote = formData.form_mode === 'auto'
    ? `
## 自动规划补充说明
- 当前模式：AI 全自动规划
- 用户状态：对城市、院校和专业暂无明确偏好，希望基于分数、位次、选科和优势学科，自动完成学校、专业、录取可行性、就业趋势与入学后的发展规划
- 输出倾向：请主动补齐缺失偏好，不要因为输入简化就只给笼统建议，要仍然输出完整、可执行、可排序的方案`
    : '';

  return `请根据以下考生信息进行志愿填报分析：

## 基础信息
- 省份：${formData.province}
- 分数：${formData.score}
- 位次：${formData.rank}
- 科类/选科：${formData.subject_type}
- 性别：${formData.gender || '暂不确定'}
- 是否服从调剂：${formData.accept_adjustment ? '是' : '否'}

## 地域偏好
- 意向城市/地区：${formData.target_city || '暂不确定'}
- 是否接受省外：${formData.accept_out_province ? '是' : '否'}
- 学校层次偏好：${formatSchoolPreference(formData.school_preference)}
- 地域倾向：${formatHomeProvincePreference(formData.prefer_home_province)}

## 家庭决策偏好
- 决策主导：${formData.decision_maker}
- 路径优先级（从高到低）：${(formData.path_priority || []).join(' > ')}

## 学生画像
- 兴趣方向：${(formData.interests || []).join('、') || '暂不确定'}
- 优势学科：${(formData.strong_subjects || []).join('、') || '暂不确定'}
- 是否接受高强度专业：${formData.accept_intensive === undefined ? '暂不确定' : formData.accept_intensive ? '是' : '否'}
- 是否愿意考研：${formData.willing_graduate === undefined ? '暂不确定' : formData.willing_graduate ? '是' : '否'}

${autoModeNote}

请严格按照 JSON 格式输出分析结果。`;
}

function buildRefinementPrompt(formData, draftReport, generalSearchContext, evidenceSearchContext) {
  return `${buildUserPrompt(formData)}

以下是初版分析结果，请在保留其核心判断的基础上，根据新增证据进行修正、补强和去伪存真：

## 初版分析结果
${JSON.stringify(draftReport, null, 2)}

${generalSearchContext ? `${generalSearchContext}\n` : ''}
${evidenceSearchContext ? `${evidenceSearchContext}\n` : ''}

请重点完成以下任务：
1. 优先用新增证据修正学校、专业、录取可行性和就业判断。
2. 在 recommendation_evidence 中把“硬依据”写实，不要只写抽象结论。
3. 在 source_notes 中整理真正有用的参考来源。
4. 如果某项证据仍不足，请在内部保持审慎，但面向用户只保留简短通用提醒，不要罗列具体缺口。
5. 不要把无法确认的数据写成既定事实。`;
}

// Call Kimi (Moonshot) API
async function callKimi(systemPrompt, userPrompt) {
  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) throw new Error('KIMI_API_KEY not configured');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Kimi API error: ${res.status} ${text}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  } finally {
    clearTimeout(timeout);
  }
}

// Call MiniMax API (fallback)
async function callMiniMax(systemPrompt, userPrompt) {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) throw new Error('MINIMAX_API_KEY not configured');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'abab6.5s-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`MiniMax API error: ${res.status} ${text}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  } finally {
    clearTimeout(timeout);
  }
}

// Perform Tavily Web Search for real-world context data
async function performWebSearch(formData, apiKey) {
  const queries = buildTavilyQueries(formData);

  try {
    const searchPromises = queries.map((q) =>
      fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query: q,
          include_answer: true,
          include_raw_content: false,
          max_results: 5,
          search_depth: 'advanced',
        })
      }).then(r => r.json())
    );
    const results = await Promise.all(searchPromises);

    return {
      results,
      context: buildTavilySearchContext(results),
    };
  } catch (e) {
    console.warn("Web search failed:", e.message);
    return {
      results: [],
      context: '',
    };
  }
}

async function performEvidenceSearch(formData, plans, apiKey) {
  const queries = buildEvidenceQueries(formData, plans);

  if (queries.length === 0) {
    return {
      results: [],
      context: '',
    };
  }

  try {
    const searchPromises = queries.map((q) =>
      fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query: q,
          include_answer: true,
          include_raw_content: false,
          max_results: 4,
          search_depth: 'advanced',
        }),
      }).then((r) => r.json())
    );

    const results = await Promise.all(searchPromises);

    return {
      results,
      context: buildEvidenceSearchContext(results),
    };
  } catch (e) {
    console.warn('Evidence search failed:', e.message);
    return {
      results: [],
      context: '',
    };
  }
}

// Call DeepSeek API
async function callDeepSeek(systemPrompt, userPrompt) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 150000);

  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`DeepSeek API error: ${res.status} ${text}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  } finally {
    clearTimeout(timeout);
  }
}

async function callProvider(provider, systemPrompt, userPrompt) {
  if (provider === 'DeepSeek') {
    return callDeepSeek(systemPrompt, userPrompt);
  }

  if (provider === 'Kimi') {
    return callKimi(systemPrompt, userPrompt);
  }

  return callMiniMax(systemPrompt, userPrompt);
}

function parseReportJson(rawContent) {
  let jsonStr = rawContent;
  const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  return JSON.parse(jsonStr);
}

async function generateWithFallback(providers, systemPrompt, userPrompt) {
  let rawContent;

  for (const provider of providers) {
    try {
      console.log(`Calling ${provider} API...`);
      rawContent = await callProvider(provider, systemPrompt, userPrompt);
      console.log(`${provider} API success`);
      break;
    } catch (providerError) {
      console.warn(`${provider} API failed:`, providerError.message);
    }
  }

  if (!rawContent) {
    throw new Error('AI 服务暂时不可用，请稍后再试');
  }

  try {
    return parseReportJson(rawContent);
  } catch (e) {
    console.error('Failed to parse AI response as JSON:', e.message);
    console.error('Raw content:', rawContent);
    throw new Error('AI 返回格式异常，请重试');
  }
}

function mergeSourceNotes(existingSourceNotes = {}, searchResults = []) {
  const derivedSourceNotes = buildSourceNotes(searchResults);
  const mergedItems = [
    ...(existingSourceNotes.items || []),
    ...derivedSourceNotes.items,
  ].filter((item, index, list) => item?.url && list.findIndex((entry) => entry.url === item.url) === index);

  const mergedDataGaps = [
    ...(existingSourceNotes.data_gaps || []),
    ...(derivedSourceNotes.data_gaps || []),
  ];

  return {
    summary: existingSourceNotes.summary || derivedSourceNotes.summary,
    items: mergedItems.slice(0, 8),
    data_gaps: [...new Set(mergedDataGaps.filter(Boolean))],
  };
}

// Main generate function with fallback
export async function generateReport(formData) {
  let searchContext = '';
  let searchResults = [];
  const admissionPlans = await loadAdmissionPlans();
  const admissionPlanContext = buildAdmissionPlanContext(formData, admissionPlans);

  if (process.env.TAVILY_API_KEY) {
    console.log('Initiating Web Search via Tavily...');
    const searchPayload = await performWebSearch(formData, process.env.TAVILY_API_KEY);
    searchContext = searchPayload.context;
    searchResults = searchPayload.results;
    console.log('Web Search Context fetched length:', searchContext.length);
  }

  const systemPrompt = buildSystemPrompt();
  const providers = getAiProviderOrder(process.env);

  if (providers.length === 0) {
    throw getNoAiProviderError();
  }

  const initialPrompt = [
    buildUserPrompt(formData),
    admissionPlanContext,
    searchContext,
  ].filter(Boolean).join('\n\n');
  const draftReport = await generateWithFallback(providers, systemPrompt, initialPrompt);

  let finalReport = draftReport;

  if (process.env.TAVILY_API_KEY && Array.isArray(draftReport.plans) && draftReport.plans.length > 0) {
    console.log('Initiating targeted evidence search for candidate plans...');
    const evidencePayload = await performEvidenceSearch(formData, draftReport.plans, process.env.TAVILY_API_KEY);
    const evidenceContext = evidencePayload.context;

    if (evidenceContext) {
      console.log('Evidence Search Context fetched length:', evidenceContext.length);
      try {
        finalReport = await generateWithFallback(
          providers,
          systemPrompt,
          buildRefinementPrompt(
            formData,
            draftReport,
            [admissionPlanContext, searchContext].filter(Boolean).join('\n\n'),
            evidenceContext
          )
        );
        searchResults = [...searchResults, ...evidencePayload.results];
      } catch (error) {
        console.warn('Refinement pass failed, using draft report:', error.message);
        searchResults = [...searchResults, ...evidencePayload.results];
      }
    }
  }

  finalReport.source_notes = mergeSourceNotes(finalReport.source_notes, searchResults);
  finalReport = enrichReportWithAdmissionPlans(formData, finalReport, admissionPlans);
  finalReport = enrichAdmissionRates(formData, finalReport, searchResults);

  const hasAdmissionPlanMatches = (finalReport.plans || [])
    .some((plan) => plan?.admission_plan_match?.status === 'matched');

  finalReport.final_notes = {
    ...finalReport.final_notes,
    data_to_verify: hasAdmissionPlanMatches
      ? finalReport.final_notes?.data_to_verify
      : GENERIC_VERIFY_NOTE,
  };

  return sanitizeReportForUserDisplay(finalReport);
}
