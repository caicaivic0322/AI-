function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderReportItems(items = []) {
  return items
    .map(({ label, value }) => `
      <p><span class="label">${escapeHtml(label)}</span>${escapeHtml(value || '')}</p>
    `)
    .join('');
}

function buildBaseHtml(title, body) {
  return `<!doctype html>
  <html lang="zh-CN">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title)}</title>
      <style>
        @page { size: A4; margin: 14mm 12mm 16mm; }
        * { box-sizing: border-box; }
        body {
          font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
          color: #142132;
          margin: 0;
          background: #eef3f8;
          line-height: 1.72;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        h1, h2, h3 { margin: 0; }
        p { margin: 0; }
        .sheet {
          background: #fbfdff;
          border: 1px solid #d8e1eb;
          border-radius: 24px;
          overflow: hidden;
        }
        .hero {
          background: linear-gradient(180deg, #13263c 0%, #1b3552 100%);
          color: #f4f7fb;
          padding: 28px 30px 24px;
          position: relative;
        }
        .hero::after {
          content: "";
          position: absolute;
          right: 26px;
          top: 24px;
          width: 110px;
          height: 110px;
          border-radius: 50%;
          border: 1px solid rgba(164, 185, 209, 0.22);
        }
        .eyebrow {
          display: inline-block;
          padding: 6px 12px;
          border: 1px solid rgba(164, 185, 209, 0.28);
          border-radius: 999px;
          color: #d8e6f5;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .hero h1 {
          font-family: "Songti SC", "STSong", "Noto Serif CJK SC", serif;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 0.02em;
          margin-bottom: 10px;
        }
        .hero-subtitle {
          max-width: 560px;
          color: rgba(232, 239, 247, 0.82);
          font-size: 13px;
        }
        .hero-meta {
          margin-top: 18px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          color: rgba(232, 239, 247, 0.74);
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .content {
          padding: 28px 30px 32px;
        }
        .airy-stack {
          display: grid;
          row-gap: 18px;
        }
        .section + .section {
          margin-top: 24px;
        }
        .section-title {
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #5f748b;
          margin-bottom: 8px;
        }
        .section-head {
          font-family: "Songti SC", "STSong", "Noto Serif CJK SC", serif;
          font-size: 22px;
          color: #13263c;
          margin-bottom: 12px;
        }
        .summary-panel {
          background: linear-gradient(180deg, #f6f9fc 0%, #f2f6fb 100%);
          border: 1px solid #dbe4ed;
          border-left: 4px solid #7f9fbe;
          border-radius: 18px;
          padding: 18px 18px 18px 20px;
          color: #213246;
          font-size: 14px;
        }
        .grid {
          display: grid;
          gap: 14px;
        }
        .card {
          background: #ffffff;
          border: 1px solid #dbe4ed;
          border-radius: 18px;
          padding: 16px 18px;
        }
        .card h3 {
          font-size: 15px;
          color: #13263c;
          margin-bottom: 10px;
        }
        .card p + p {
          margin-top: 8px;
        }
        .muted {
          color: #5f7184;
          font-size: 13px;
        }
        .label {
          color: #475a70;
          font-weight: 700;
        }
        .keyline {
          height: 1px;
          background: #dbe4ed;
          margin: 16px 0;
        }
        .callout {
          display: grid;
          gap: 8px;
          background: #f6f8fb;
          border: 1px solid #d8e1eb;
          border-radius: 18px;
          padding: 16px 18px;
        }
        .callout strong {
          color: #17314d;
          font-size: 14px;
        }
        .highlight {
          color: #9b6a16;
          font-weight: 700;
        }
        .volunteer-title {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 12px;
          margin-bottom: 14px;
        }
        .volunteer-title h2 {
          font-family: "Songti SC", "STSong", "Noto Serif CJK SC", serif;
          font-size: 22px;
          color: #13263c;
        }
        .volunteer-kicker {
          color: #5f748b;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          overflow: hidden;
          border: 1px solid #dbe4ed;
          border-radius: 16px;
          margin-top: 14px;
        }
        th, td {
          border-bottom: 1px solid #dbe4ed;
          padding: 12px 12px;
          vertical-align: top;
          font-size: 12.5px;
        }
        tr:last-child td { border-bottom: 0; }
        th {
          background: #f3f7fb;
          color: #46607a;
          text-align: left;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .strategy-pill {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 999px;
          background: #edf4fb;
          color: #2f5d87;
          font-weight: 700;
          font-size: 11px;
          border: 1px solid #cfe0f1;
        }
        .footer-note {
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid #dbe4ed;
          color: #6b7d90;
          font-size: 11.5px;
        }
        .plan-grid {
          display: grid;
          gap: 16px;
        }
        .plan-meta {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }
        .plan-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 999px;
          background: #eef3f8;
          color: #274868;
          border: 1px solid #d7e3ef;
          font-size: 11px;
          font-weight: 700;
        }
        .plan-school {
          font-family: "Songti SC", "STSong", "Noto Serif CJK SC", serif;
          font-size: 20px;
          color: #13263c;
          margin-bottom: 4px;
        }
        .plan-major {
          font-size: 13px;
          color: #53687d;
          margin-bottom: 12px;
        }
      </style>
    </head>
    <body>${body}</body>
  </html>`;
}

export function buildConciseReportHtml(payload) {
  const rows = (payload.report?.concise_report?.volunteer_table || [])
    .map((item) => `
      <tr>
        <td>${escapeHtml(item.priority)}</td>
        <td>${escapeHtml(item.school)}</td>
        <td>${escapeHtml(item.major)}</td>
        <td>${escapeHtml(item.fill_strategy)}</td>
        <td>${escapeHtml(item.note)}</td>
      </tr>
    `)
    .join('');

  return buildBaseHtml(
    '高考志愿报告-简明版',
    `
      <main class="sheet">
        <section class="hero">
          <div class="eyebrow">Gaokao Volunteer Planner</div>
          <h1>志愿填报执行单</h1>
          <p class="hero-subtitle">简明版志愿表 | 适合在最终确认阶段快速核对志愿顺序、学校专业组合与填报策略。</p>
          <div class="hero-meta">
            <span>生成时间：${escapeHtml(payload.created_at || '')}</span>
            <span>输出版本：简明版志愿表</span>
          </div>
        </section>
        <section class="content">
          <div class="summary-panel airy-stack">
            <span class="label">简要结论：</span>
            ${escapeHtml(payload.report?.concise_report?.summary || '')}
          </div>
          <section class="section">
            <div class="volunteer-title">
              <div>
                <div class="section-title">Action List</div>
                <h2>简明版志愿表</h2>
              </div>
              <div class="volunteer-kicker">按真实填报顺序查看</div>
            </div>
            <table class="airy-stack">
              <thead>
                <tr>
                  <th>志愿顺序</th>
                  <th>学校</th>
                  <th>专业</th>
                  <th>策略</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>${rows.replace(/<td>(冲刺|稳妥|保底)<\/td>/g, '<td><span class="strategy-pill">$1</span></td>')}</tbody>
            </table>
          </section>
          <div class="footer-note">本页为执行单格式，建议结合全面版分析报告一起确认最终填报策略与证据链。</div>
        </section>
      </main>
    `
  );
}

export function buildFullReportHtml(payload) {
  const factors = (payload.report?.recommendation_evidence?.factors || [])
    .map((item) => `
      <div class="card">
        <h3>${escapeHtml(item.title)}</h3>
        <p><span class="label">分析：</span>${escapeHtml(item.analysis)}</p>
        <p><span class="label">依据：</span>${escapeHtml(item.evidence)}</p>
        <p><span class="label">结论：</span>${escapeHtml(item.conclusion)}</p>
      </div>
    `)
    .join('');

  const rationales = (payload.report?.recommendation_evidence?.school_major_rationales || [])
    .map((item) => `
      <div class="card">
        <h3>${escapeHtml(item.school)} · ${escapeHtml(item.major)}</h3>
        <p><span class="label">推荐理由：</span>${escapeHtml(item.rationale)}</p>
        <p><span class="label">有力凭据：</span>${escapeHtml(item.evidence)}</p>
        <p><span class="label">风险平衡：</span>${escapeHtml(item.risk_balance)}</p>
      </div>
    `)
    .join('');

  const plans = (payload.report?.plans || [])
    .map((item) => `
      <div class="card">
        <div class="plan-meta">
          <span class="plan-badge">${escapeHtml(item.type)}方案</span>
          <span class="muted">录取可行性：${escapeHtml(item.admission_rate)}</span>
        </div>
        <div class="plan-school">${escapeHtml(item.school)}</div>
        <div class="plan-major">${escapeHtml(item.major)}</div>
        <div class="airy-stack">
          ${renderReportItems([
            { label: '推荐理由：', value: item.reason },
            { label: '风险提示：', value: item.risk },
            { label: '替代方案：', value: item.alternative },
            { label: '本科就业方向：', value: item.undergrad_employment },
            { label: '深造后方向：', value: item.grad_employment },
          ])}
        </div>
      </div>
    `)
    .join('');

  const familyConcerns = renderReportItems([
    { label: '考公 / 考编：', value: payload.report?.family_concerns?.civil_service },
    { label: '是否考研：', value: payload.report?.family_concerns?.graduate_school },
    { label: '国企机会：', value: payload.report?.family_concerns?.soe_opportunity },
    { label: '地域建议：', value: payload.report?.family_concerns?.location_advice },
  ]);

  const employmentItems = (payload.report?.employment_trends?.items || [])
    .map((item) => `
      <div class="card">
        <div class="plan-meta">
          <span class="plan-badge">${escapeHtml(item.plan_type)}配置</span>
          <span class="muted">${escapeHtml(item.trend_verdict)}</span>
        </div>
        <div class="plan-school">${escapeHtml(item.school)}</div>
        <div class="plan-major">${escapeHtml(item.major)}</div>
        <div class="airy-stack">
          ${renderReportItems([
            { label: '趋势窗口：', value: item.trend_window },
            { label: '需求牵引：', value: item.demand_signal },
            { label: '主要去向：', value: item.sector_direction },
            { label: '区域适配：', value: item.regional_fit },
            { label: '风险暴露：', value: item.risk_note },
            { label: '配置建议：', value: item.advice },
          ])}
        </div>
      </div>
    `)
    .join('');

  const strategyItems = renderReportItems([
    { label: '核心策略：', value: payload.report?.strategy?.core },
    { label: '不优先方向：', value: payload.report?.strategy?.not_recommended },
    { label: '当前不确定性：', value: payload.report?.strategy?.uncertainties },
  ]);

  const sourceItems = (payload.report?.source_notes?.items || [])
    .map((item) => `
      <div class="card">
        <h3>${escapeHtml(item.title)}</h3>
        <p><span class="label">类型：</span>${escapeHtml(item.category || '')}</p>
        <p><span class="label">摘要：</span>${escapeHtml(item.snippet || '')}</p>
        <p><span class="label">链接：</span>${escapeHtml(item.url || '')}</p>
      </div>
    `)
    .join('');

  const finalNotes = renderReportItems([
    { label: '使用提示：', value: payload.report?.final_notes?.data_to_verify },
    { label: '适用范围：', value: payload.report?.final_notes?.scope },
    { label: '下一步动作：', value: payload.report?.final_notes?.next_steps },
  ]);

  return buildBaseHtml(
    '高考志愿报告-全面版',
    `
      <main class="sheet">
        <section class="hero">
          <div class="eyebrow">Gaokao Volunteer Planner</div>
          <h1>高考志愿全面分析报告</h1>
          <p class="hero-subtitle">冷静呈现信息、判断与依据，适合在家庭沟通和最终决策前完整复核推荐逻辑。</p>
          <div class="hero-meta">
            <span>生成时间：${escapeHtml(payload.created_at || '')}</span>
            <span>输出版本：全面版分析报告</span>
          </div>
        </section>
        <section class="content">
          <section class="section">
            <div class="section-title">Executive Summary</div>
            <div class="section-head">执行摘要</div>
            <div class="summary-panel">
              <p><span class="label">学生定位：</span>${escapeHtml(payload.report?.student_summary || '')}</p>
              <div class="keyline"></div>
              <p><span class="label">家庭偏好：</span>${escapeHtml(payload.report?.family_summary || '')}</p>
            </div>
          </section>
          <section class="section">
            <div class="section-title">Key Judgment</div>
            <div class="section-head">关键判断</div>
            <div class="callout">
              <strong class="highlight">核心结论</strong>
              <p>${escapeHtml(payload.report?.recommendation_evidence?.overall_judgment || '')}</p>
            </div>
          </section>
          <section class="section">
            <div class="section-title">Strategy</div>
            <div class="section-head">推荐策略</div>
            <div class="card airy-stack">${strategyItems}</div>
          </section>
          <section class="section">
            <div class="section-title">Evidence Framework</div>
            <div class="section-head">推荐依据与判断</div>
            <div class="grid">${factors}</div>
          </section>
          <section class="section">
            <div class="section-title">Recommendation Plans</div>
            <div class="section-head">推荐方案详解</div>
            <div class="plan-grid">${plans}</div>
          </section>
          <section class="section">
            <div class="section-title">Recommendation Support</div>
            <div class="section-head">学校与专业推荐凭据</div>
            <div class="grid">${rationales}</div>
          </section>
          <section class="section">
            <div class="section-title">Family Concerns</div>
            <div class="section-head">家长关注问题</div>
            <div class="card airy-stack">${familyConcerns}</div>
          </section>
          <section class="section">
            <div class="section-title">Sources</div>
            <div class="section-head">参考来源</div>
            <div class="callout">
              <strong class="highlight">来源摘要</strong>
              <p>${escapeHtml(payload.report?.source_notes?.summary || '')}</p>
            </div>
            <div class="grid" style="margin-top: 16px;">${sourceItems}</div>
          </section>
          <section class="section">
            <div class="section-title">Career Outlook</div>
            <div class="section-head">未来就业方向与趋势指导</div>
            <div class="callout">
              <strong class="highlight">就业总览</strong>
              <p>${escapeHtml(payload.report?.employment_trends?.overview || '')}</p>
            </div>
            <div class="plan-grid" style="margin-top: 16px;">${employmentItems}</div>
            <div class="footer-note" style="margin-top: 16px; border-top: 0; padding-top: 0;">配置结论：${escapeHtml(payload.report?.employment_trends?.action_summary || '')}</div>
          </section>
          <section class="section">
            <div class="section-title">Next Steps</div>
            <div class="section-head">最终提醒</div>
            <div class="card airy-stack">${finalNotes}</div>
          </section>
          <div class="footer-note">本页强调“判断依据先于结论”，用于帮助家长和考生核对推荐逻辑是否充分、客观、可执行。</div>
        </section>
      </main>
    `
  );
}
