import fs from 'fs/promises';
import path from 'path';

const ADMISSION_PLANS_FILE_PATH = path.join(process.cwd(), 'data', 'admission-plans.json');
const DEFAULT_PLAN_YEAR = 2026;

function normalizeText(value = '') {
  return String(value)
    .replace(/[（）()\s·\-—_/]/g, '')
    .trim();
}

function normalizeNumber(value) {
  const number = Number(String(value ?? '').replace(/[^\d]/g, ''));
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function resolveAdmissionPlanYear(formData = {}) {
  return normalizeNumber(formData.exam_year || formData.year) || DEFAULT_PLAN_YEAR;
}

function textMatches(left = '', right = '') {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  return normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft);
}

function splitSubjectRequirement(value = '') {
  const normalized = String(value || '').trim();
  if (!normalized || /不限|不提科目|无要求/.test(normalized)) {
    return [];
  }

  return normalized
    .replace(/首选|再选|科目|要求|类/g, '')
    .split(/[+、,，/或和及\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function matchesSubjectRequirement(subjectType = '', requirement = '') {
  const requiredSubjects = splitSubjectRequirement(requirement);
  if (requiredSubjects.length === 0) {
    return true;
  }

  const normalizedSubjectType = normalizeText(subjectType);
  if (/理科/.test(normalizedSubjectType) && requiredSubjects.every((item) => /物理|化学|生物/.test(item))) {
    return true;
  }

  if (/文科/.test(normalizedSubjectType) && requiredSubjects.every((item) => /历史|政治|地理/.test(item))) {
    return true;
  }

  return requiredSubjects.every((subject) => normalizedSubjectType.includes(normalizeText(subject)));
}

function isCandidatePlanForForm(formData, plan) {
  const targetYear = resolveAdmissionPlanYear(formData);

  return (
    normalizeNumber(plan.year) === targetYear &&
    textMatches(plan.province, formData.province) &&
    matchesSubjectRequirement(formData.subject_type, plan.subject_requirement)
  );
}

export function findMatchingAdmissionPlan(formData = {}, candidatePlan = {}, admissionPlans = []) {
  const matches = admissionPlans
    .filter((plan) => isCandidatePlanForForm(formData, plan))
    .filter((plan) => textMatches(plan.school_name, candidatePlan.school))
    .filter((plan) => textMatches(plan.major_name, candidatePlan.major))
    .sort((a, b) => (normalizeNumber(b.plan_count) || 0) - (normalizeNumber(a.plan_count) || 0));

  return matches[0] || null;
}

function formatAdmissionPlanMatch(plan) {
  return {
    status: 'matched',
    year: normalizeNumber(plan.year),
    province: plan.province || '',
    batch: plan.batch || '',
    school_code: plan.school_code || '',
    school_name: plan.school_name || '',
    major_group: plan.major_group || '',
    major_code: plan.major_code || '',
    major_name: plan.major_name || '',
    subject_requirement: plan.subject_requirement || '不限',
    plan_count: normalizeNumber(plan.plan_count),
    source_name: plan.source_name || '官方招生计划',
    source_url: plan.source_url || '',
    published_at: plan.published_at || '',
  };
}

function appendPlanEvidence(plan, match) {
  const label = `${match.year} ${match.province}${match.batch || ''}招生计划`;
  const detailParts = [
    match.major_group,
    match.subject_requirement ? `选科：${match.subject_requirement}` : '',
    match.plan_count ? `计划 ${match.plan_count} 人` : '',
  ].filter(Boolean);
  const evidence = `${label}已列出 ${match.school_name}${match.major_name}${detailParts.length ? `（${detailParts.join('，')}）` : ''}。`;

  return {
    ...plan,
    admission_plan_match: match,
    reason: plan.reason ? `${plan.reason} ${evidence}` : evidence,
  };
}

function buildAdmissionPlanSourceItem(match) {
  return {
    title: `${match.year}${match.province}${match.batch || ''}招生计划：${match.school_name}${match.major_name}`,
    url: match.source_url,
    snippet: `${match.major_group || '未标注专业组'}，${match.subject_requirement || '不限'}，计划 ${match.plan_count || '--'} 人。`,
    category: '招生计划',
  };
}

function mergeAdmissionPlanSourceNotes(sourceNotes = {}, matches = []) {
  const existingItems = sourceNotes.items || [];
  const planItems = matches
    .filter((match) => match.source_url)
    .map(buildAdmissionPlanSourceItem);
  const items = [...existingItems, ...planItems]
    .filter((item, index, list) => item?.url && list.findIndex((entry) => entry.url === item.url && entry.title === item.title) === index);

  return {
    ...sourceNotes,
    summary: matches.length > 0
      ? `本报告已匹配 ${matches.length} 条当年招生计划，并继续结合公开来源做交叉核验。`
      : sourceNotes.summary,
    items: items.slice(0, 10),
  };
}

export function enrichReportWithAdmissionPlans(formData = {}, report = {}, admissionPlans = []) {
  if (!report || !Array.isArray(report.plans) || admissionPlans.length === 0) {
    return report;
  }

  const matchedPlans = [];
  const enrichedPlans = report.plans.map((candidatePlan) => {
    const match = findMatchingAdmissionPlan(formData, candidatePlan, admissionPlans);
    if (!match) {
      return {
        ...candidatePlan,
        admission_plan_match: candidatePlan.admission_plan_match || { status: 'unmatched', year: resolveAdmissionPlanYear(formData) },
      };
    }

    const formattedMatch = formatAdmissionPlanMatch(match);
    matchedPlans.push(formattedMatch);
    return appendPlanEvidence(candidatePlan, formattedMatch);
  });

  if (matchedPlans.length === 0) {
    return {
      ...report,
      plans: enrichedPlans,
    };
  }

  return {
    ...report,
    plans: enrichedPlans,
    source_notes: mergeAdmissionPlanSourceNotes(report.source_notes, matchedPlans),
    final_notes: {
      ...report.final_notes,
      data_to_verify: `已优先匹配 ${resolveAdmissionPlanYear(formData)} 年招生计划；正式填报前仍请以省考试院和院校最新公布版本为准。`,
    },
  };
}

export function buildAdmissionPlanContext(formData = {}, admissionPlans = []) {
  const candidates = admissionPlans
    .filter((plan) => isCandidatePlanForForm(formData, plan))
    .slice(0, 20);

  if (candidates.length === 0) {
    return '';
  }

  const year = resolveAdmissionPlanYear(formData);
  let context = `## 已导入的 ${year} 招生计划\n`;
  context += '以下为已结构化导入的官方招生计划。生成候选方案时，必须优先选择这些真实可报的院校专业组合；未在计划内的学校或专业不得写成确定可报。\n';

  candidates.forEach((plan) => {
    context += `- ${plan.province} ${plan.batch || '未标注批次'} ${plan.school_name} ${plan.major_group || ''} ${plan.major_name}`;
    context += `；选科：${plan.subject_requirement || '不限'}；计划 ${plan.plan_count || '--'} 人`;
    context += plan.source_name ? `；来源：${plan.source_name}` : '';
    context += '\n';
  });

  return context;
}

export async function loadAdmissionPlans(dependencies = {}) {
  const {
    readFile = (filePath) => fs.readFile(filePath, 'utf-8'),
    filePath = ADMISSION_PLANS_FILE_PATH,
  } = dependencies;

  try {
    const payload = JSON.parse(await readFile(filePath));
    return Array.isArray(payload) ? payload : payload.items || [];
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('Failed to load admission plans:', error.message);
    }
    return [];
  }
}
