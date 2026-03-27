function formatPathPriority(pathPriority = []) {
  if (!Array.isArray(pathPriority) || pathPriority.length === 0) {
    return '优先就业、兼顾升学';
  }

  return pathPriority.slice(0, 3).join('、');
}

function getCityPreference(formData) {
  return formData.target_city || (formData.prefer_home_province ? '优先本省城市' : '可接受跨省城市');
}

function getSchoolPreference(formData) {
  return formData.school_preference || '公办优先';
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

export function buildPreviewReport(formData = {}) {
  const cityPreference = getCityPreference(formData);
  const schoolPreference = getSchoolPreference(formData);
  const pathPriority = formatPathPriority(formData.path_priority);
  const province = formData.province || '所在省份';
  const score = formData.score || '你的分数';
  const rank = formData.rank || '你的位次';
  const subjectType = formData.subject_type || '当前选科';
  const decisionMaker = formData.decision_maker || '家庭共同决策';

  return {
    student_summary: `你当前位于${province}${subjectType}志愿决策区间，参考分数 ${score}、位次 ${rank}，适合采用“冲稳保”组合来平衡录取率与未来发展。`,
    family_summary: `${decisionMaker}更关注结果确定性与长期收益，建议以${pathPriority}为主线，同时把${cityPreference}与${schoolPreference}纳入最终筛选。`,
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
      data_to_verify: '正式填报前请核验当年招生计划、专业组要求、学费与住宿地信息。',
      scope: '该预览报告用于前端展示与流程演示，不替代正式 AI 个性化分析。',
      next_steps: '如用于真实填报，建议接入正式 AI Key、重新生成完整个性化报告后再做最终决策。',
    },
  };
}
