import fs from 'fs';
import path from 'path';
import { getAiProviderOrder, getNoAiProviderError } from './runtime-utils.mjs';
import { buildTavilyQueries, buildTavilySearchContext } from './tavily-utils.mjs';

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
    "data_to_verify": "需要补充核实的数据",
    "scope": "本建议的适用边界",
    "next_steps": "下一步建议动作"
  }
}

## 重要规则
- 严禁伪造精确百分比
- 不要把假设写成事实
- 不要承诺录取结果
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
  return `请根据以下考生信息进行志愿填报分析：

## 基础信息
- 省份：${formData.province}
- 分数：${formData.score}
- 位次：${formData.rank}
- 科类/选科：${formData.subject_type}
- 是否服从调剂：${formData.accept_adjustment ? '是' : '否'}

## 地域偏好
- 意向城市/地区：${formData.target_city || '暂不确定'}
- 是否接受省外：${formData.accept_out_province ? '是' : '否'}
- 学校层次偏好：${formData.school_preference || '无特殊偏好'}
- 是否优先留在本省：${formData.prefer_home_province ? '是' : '否'}

## 家庭决策偏好
- 决策主导：${formData.decision_maker}
- 路径优先级（从高到低）：${(formData.path_priority || []).join(' > ')}

## 学生画像
- 兴趣方向：${(formData.interests || []).join('、') || '暂不确定'}
- 优势学科：${(formData.strong_subjects || []).join('、') || '暂不确定'}
- 是否接受高强度专业：${formData.accept_intensive === undefined ? '暂不确定' : formData.accept_intensive ? '是' : '否'}
- 是否愿意考研：${formData.willing_graduate === undefined ? '暂不确定' : formData.willing_graduate ? '是' : '否'}

请严格按照 JSON 格式输出分析结果。`;
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

    return buildTavilySearchContext(results);
  } catch (e) {
    console.warn("Web search failed:", e.message);
    return '';
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

// Main generate function with fallback
export async function generateReport(formData) {
  let searchContext = '';
  if (process.env.TAVILY_API_KEY) {
    console.log('Initiating Web Search via Tavily...');
    searchContext = await performWebSearch(formData, process.env.TAVILY_API_KEY);
    console.log('Web Search Context fetched length:', searchContext.length);
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(formData) + (searchContext ? `\n\n${searchContext}` : '');

  let rawContent;
  const providers = getAiProviderOrder(process.env);

  if (providers.length === 0) {
    throw getNoAiProviderError();
  }

  for (const provider of providers) {
    try {
      console.log(`Calling ${provider} API...`);
      if (provider === 'DeepSeek') {
        rawContent = await callDeepSeek(systemPrompt, userPrompt);
      } else if (provider === 'Kimi') {
        rawContent = await callKimi(systemPrompt, userPrompt);
      } else {
        rawContent = await callMiniMax(systemPrompt, userPrompt);
      }
      console.log(`${provider} API success`);
      break;
    } catch (providerError) {
      console.warn(`${provider} API failed:`, providerError.message);
    }
  }

  if (!rawContent) {
    throw new Error('AI 服务暂时不可用，请稍后再试');
  }

  // Parse JSON from response
  try {
    // Try to extract JSON from possible markdown code blocks
    let jsonStr = rawContent;
    const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse AI response as JSON:', e.message);
    console.error('Raw content:', rawContent);
    throw new Error('AI 返回格式异常，请重试');
  }
}
