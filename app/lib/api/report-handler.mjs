import { jsonResponse } from './response-utils.mjs';

function buildMaskedReport(report) {
  return report.report_content ? {
    student_summary: report.report_content.student_summary,
    family_summary: report.report_content.family_summary,
    strategy: {
      core: report.report_content.strategy?.core,
      not_recommended: '付费后查看',
      uncertainties: '付费后查看',
    },
    plans: (report.report_content.plans || []).map((plan) => ({
      type: plan.type,
      school: '***付费后查看***',
      major: '***付费后查看***',
      admission_rate: plan.admission_rate,
      civil_service_friendly: plan.civil_service_friendly,
      soe_fit: plan.soe_fit,
      grad_boost: plan.grad_boost,
      reason: '付费后查看完整推荐理由...',
      risk: '付费后查看...',
      alternative: '付费后查看...',
      undergrad_employment: '付费后查看...',
      grad_employment: '付费后查看...',
    })),
    family_concerns: {
      civil_service: '付费后查看...',
      graduate_school: '付费后查看...',
      soe_opportunity: '付费后查看...',
      location_advice: '付费后查看...',
    },
    employment_trends: {
      overview: '付费后查看...',
      items: (report.report_content.employment_trends?.items || []).map((item) => ({
        plan_type: item.plan_type,
        school: '***付费后查看***',
        major: '***付费后查看***',
        trend_verdict: '付费后查看...',
        trend_window: '付费后查看...',
        demand_signal: '付费后查看...',
        sector_direction: '付费后查看...',
        regional_fit: '付费后查看...',
        risk_note: '付费后查看...',
        advice: '付费后查看...',
      })),
      action_summary: '付费后查看...',
    },
    final_notes: {
      data_to_verify: '付费后查看...',
      scope: '付费后查看...',
      next_steps: '付费后查看...',
    },
  } : null;
}

export async function handleGetReportRequest(request, { params }, dependencies) {
  const { getReport } = dependencies;

  try {
    const { id } = await params;
    const report = getReport(id);

    if (!report) {
      return jsonResponse({ error: '报告不存在' }, { status: 404 });
    }

    if (!report.paid) {
      return jsonResponse({
        id: report.id,
        paid: false,
        amount: report.amount,
        created_at: report.created_at,
        form_data: report.form_data,
        report: buildMaskedReport(report),
      });
    }

    return jsonResponse({
      id: report.id,
      paid: true,
      created_at: report.created_at,
      form_data: report.form_data,
      report: report.report_content,
    });
  } catch (error) {
    console.error('Report fetch error:', error);
    return jsonResponse({ error: '查询失败' }, { status: 500 });
  }
}
