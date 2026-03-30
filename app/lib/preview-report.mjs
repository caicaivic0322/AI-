import { formatHomeProvincePreference, formatSchoolPreference } from './form-utils.mjs';

function formatPathPriority(pathPriority = []) {
  if (!Array.isArray(pathPriority) || pathPriority.length === 0) {
    return '优先就业、兼顾升学';
  }

  return pathPriority.slice(0, 3).join('、');
}

function getCityPreference(formData) {
  if (formData.target_city) {
    return formData.target_city;
  }

  const preference = formatHomeProvincePreference(formData.prefer_home_province);
  return preference === '本省优先' ? '优先本省城市' : preference === '外省优先' ? '优先外省城市' : '可接受跨省城市';
}

function getSchoolPreference(formData) {
  return formatSchoolPreference(formData.school_preference || '公办优先');
}

function buildPlan(type, school, major, formData, note) {
  return {
    type,
    school,
    major,
    admission_rate: type === '冲刺' ? '30%~45%' : type === '稳妥' ? '55%~72%' : '80%+',
    civil_service_friendly: type === '保底' ? '高' : '中高',
    soe_fit: '高',
    grad_boost: type === '冲刺' ? '高' : '中高',
    reason: `结合${formData.province || '本省'}考生定位、${getSchoolPreference(formData)}偏好与${getCityPreference(formData)}意向，${school}${major}适合作为${type}方案。`,
    risk: note,
    alternative: `如分数波动，可转向同层次院校的${major}类专业或相近专业组。`,
    undergrad_employment: '本科阶段即可对接制造业升级、数字化运营与区域重点产业岗位。',
    grad_employment: '读研后可进一步拓展到研发、数据分析、产品管理与平台型岗位。',
  };
}

function buildConciseVolunteer(priority, school, major, fillStrategy, note) {
  return {
    priority,
    school,
    major,
    fill_strategy: fillStrategy,
    note,
  };
}

export function buildPreviewReport(formData = {}) {
  const cityPreference = getCityPreference(formData);
  const schoolPreference = getSchoolPreference(formData);
  const pathPriority = formatPathPriority(formData.path_priority);
  const province = formData.province || '所在省份';
  const score = formData.score || '你的分数';
  const rank = formData.rank || '你的位次';
  const subjectType = formData.subject_type || '当前选科';
  const decisionMaker = formData.decision_maker || '家庭共同决策';
  const isAutoMode = formData.form_mode === 'auto';

  return {
    concise_report: {
      summary: isAutoMode
        ? `在缺少明确个人偏好的前提下，建议先用${province}${subjectType}的分数与位次建立“冲稳保”组合，再由 AI 从优势学科反推更合适的专业和学校层次。`
        : `结合${province}${subjectType}的分数与位次，当前更适合采用“1 个冲刺 + 1 个稳妥 + 1 个保底”的志愿组合，先锁定结果，再优化学校与专业匹配度。`,
      volunteer_table: [
        buildConciseVolunteer('本科普通批 第1志愿', '杭州电子科技大学', '计算机科学与技术', '冲刺', '适合作为高位尝试，兼顾城市资源与专业热度。'),
        buildConciseVolunteer('本科普通批 第2志愿', '浙江工业大学', '软件工程', '稳妥', '建议作为主力志愿，学校平台与就业出口更均衡。'),
        buildConciseVolunteer('本科普通批 第3志愿', '宁波大学', '数据科学与大数据技术', '保底', '更适合兜住录取结果，同时保留后续发展空间。'),
      ],
    },
    student_summary: `你当前位于${province}${subjectType}志愿决策区间，参考分数 ${score}、位次 ${rank}，适合采用“冲稳保”组合来平衡录取率与未来发展。`,
    family_summary: isAutoMode
      ? `当前暂无明确城市和院校偏好，建议由 AI 先以结果确定性、就业出口与专业适配度为主线，自动补齐学校和专业筛选逻辑。`
      : `${decisionMaker}更关注结果确定性与长期收益，建议以${pathPriority}为主线，同时把${cityPreference}与${schoolPreference}纳入最终筛选。`,
    strategy: {
      core: `优先选择就业出口稳定、行业趋势清晰、城市资源匹配度更高的专业方向，再在可报范围内优化学校层次与录取概率。`,
      not_recommended: '不建议把全部志愿集中在单一热门专业或单一城市，以免录取波动放大。',
      uncertainties: '正式填报前仍需核对当年招生计划、专业组限制、体检要求和选科细则。',
    },
    plans: [
      buildPlan('冲刺', '杭州电子科技大学', '计算机科学与技术', formData, '竞争会更激烈，建议作为少量高位志愿配置。'),
      buildPlan('稳妥', '浙江工业大学', '软件工程', formData, '学校与专业匹配度较均衡，是结果导向的主力组合。'),
      buildPlan('保底', '宁波大学', '数据科学与大数据技术', formData, '录取把握更高，适合保证结果下限与后续就业延展性。'),
    ],
    family_concerns: {
      civil_service: '如看重考公，可优先关注信息类、管理类与区域资源更强的院校组合。',
      graduate_school: '若后续有读研计划，建议优先保留专业基础扎实、科研平台稳定的学校。',
      soe_opportunity: '国企与大型平台更看重学校平台、城市资源与专业匹配，稳妥档方案通常更平衡。',
      location_advice: `城市选择建议优先考虑 ${cityPreference}，兼顾实习机会、产业密度和家庭接受度。`,
    },
    recommendation_evidence: {
      overall_judgment: '本次推荐优先依据位次区间、城市偏好、学校层次要求和就业导向做交叉判断，不追求表面热门，而强调结果确定性与长期收益的平衡。',
      factors: [
        {
          title: '位次与录取区间匹配',
          analysis: `参考 ${province} 同层次院校常见录取波动，当前分数与位次更适合做“冲稳保”分层配置。`,
          evidence: '同一专业近年录取波动通常受招生计划、专业热度和院校层次共同影响。',
          conclusion: '不宜把全部志愿压在单一高热度方向，分层配置更理性。',
        },
        {
          title: '城市与就业资源适配',
          analysis: `${cityPreference}对应的实习机会、产业密度与就业外溢效应，对信息类专业更友好。`,
          evidence: '长三角与省会城市对软件、数据和智能制造类岗位的吸纳能力更强。',
          conclusion: '城市偏好与专业方向是一组联动条件，不能只看学校名气。',
        },
      ],
      school_major_rationales: [
        {
          school: '杭州电子科技大学',
          major: '计算机科学与技术',
          rationale: '学校的平台资源和专业匹配度较强，适合做高位尝试。',
          evidence: '电子信息与计算机类专业在区域产业链中更容易获得实习与就业承接。',
          risk_balance: '竞争强度更高，适合少量高位配置而非全部压上。',
        },
        {
          school: '浙江工业大学',
          major: '软件工程',
          rationale: '学校层次、城市资源与专业出口之间更均衡，适合作为主力方案。',
          evidence: '软件工程岗位覆盖面更广，本科阶段就有较稳定的就业承接。',
          risk_balance: '比冲刺志愿更稳，但仍需关注课程强度与实践能力要求。',
        },
      ],
    },
    source_notes: {
      summary: '预览模式下展示的是示例来源结构；真实报告会补充招生章程、录取信息与就业质量材料作为证据链。',
      items: [
        {
          title: '阳光高考院校库与招生信息',
          url: 'https://gaokao.cn',
          snippet: '可用于核对院校招生专业、选科要求与公开说明。',
          category: '招生',
        },
        {
          title: '高校毕业生就业质量年度报告',
          url: 'https://www.ncss.cn',
          snippet: '可用于交叉核对专业就业去向与就业质量公开数据。',
          category: '就业',
        },
      ],
      data_gaps: ['预览模式未接入真实院校定向检索，正式报告会补充候选院校的录取与就业证据。'],
    },
    employment_trends: {
      overview: '从当前产业趋势看，信息技术、智能制造、数据应用与复合型工科方向仍具备较强就业韧性。',
      items: [
        {
          plan_type: '冲刺',
          school: '杭州电子科技大学',
          major: '计算机科学与技术',
          trend_verdict: '高景气',
          trend_window: '3-5年',
          demand_signal: '数字化转型与平台型企业持续吸纳技术人才。',
          sector_direction: '软件研发、数据平台、AI 应用工程',
          regional_fit: '长三角地区机会更集中',
          risk_note: '热门专业竞争强，需接受培养强度和就业筛选压力。',
          advice: '适合作为高潜力冲刺选项，强化项目与实践积累。',
        },
        {
          plan_type: '稳妥',
          school: '浙江工业大学',
          major: '软件工程',
          trend_verdict: '稳中向上',
          trend_window: '3年左右',
          demand_signal: '企业信息化、工业软件和服务型岗位需求稳定。',
          sector_direction: '软件开发、实施咨询、产品与测试',
          regional_fit: '省会与新一线城市匹配度较高',
          risk_note: '需关注课程实践与实习节奏，避免只停留在理论层面。',
          advice: '更适合作为结果导向主方案，兼顾录取率与就业出口。',
        },
      ],
      action_summary: '优先锁定就业出口稳定的专业，再结合录取率做学校层次排序，是这份预览报告的核心结论。',
    },
    final_notes: {
      data_to_verify: '正式填报前请核验当年招生计划、专业组要求、历年录取位次与就业质量报告等公开资料。',
      scope: '该预览报告用于前端展示与流程演示，不替代正式 AI 个性化分析。',
      next_steps: '如用于真实填报，建议接入正式 AI Key、重新生成完整个性化报告后再做最终决策。',
    },
  };
}
