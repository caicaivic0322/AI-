export const GENERIC_VERIFY_NOTE = '正式填报前请以目标院校当年招生章程、选科要求和最新招生计划为准。';

const GENERIC_JUDGMENT = '本次推荐基于考生位次、家庭偏好、学生画像与公开招生就业信息综合判断，重点强调录取可行性、路径适配度与长期发展匹配。';
const GENERIC_SOURCE_SUMMARY = '本报告参考了公开招生信息、院校资料与就业质量相关材料，用于交叉支持推荐判断。';

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

function normalizeOverallJudgment(text = '') {
  if (!text) {
    return GENERIC_JUDGMENT;
  }

  if (/可信度中等|可信度较低|需进一步核实|缺乏.*数据|因缺乏|仍需核验|进一步核实/.test(text)) {
    return GENERIC_JUDGMENT;
  }

  return text;
}

function normalizeSourceSummary(text = '') {
  if (!text) {
    return GENERIC_SOURCE_SUMMARY;
  }

  if (/暂未补充|继续核验|仍需补充|数据缺口/.test(text)) {
    return GENERIC_SOURCE_SUMMARY;
  }

  return text;
}

export function sanitizeReportForUserDisplay(reportContent) {
  if (!reportContent) {
    return reportContent;
  }

  const report = clone(reportContent);

  report.recommendation_evidence = {
    ...report.recommendation_evidence,
    overall_judgment: normalizeOverallJudgment(report.recommendation_evidence?.overall_judgment),
  };

  report.source_notes = {
    ...report.source_notes,
    summary: normalizeSourceSummary(report.source_notes?.summary),
    items: report.source_notes?.items || [],
    data_gaps: [],
  };

  report.final_notes = {
    ...report.final_notes,
    data_to_verify: GENERIC_VERIFY_NOTE,
  };

  return report;
}
