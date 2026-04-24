'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppBottomNav } from '../../components/AppChrome';
import { getReportViewState, shouldPollReport } from '../../lib/report-view-state.mjs';

const PDF_SLOGAN = ['0信息差', '100%量身定制', '更可信的高考志愿推荐'];
const PDF_SITE_URL = 'https://www.gaokao.cn';

function ReportStateScreen({ title, detail, icon, actionHref, actionLabel, retryAction }) {
  return (
    <main className="ios-scene">
      <div className="phone-shell">
        <section className="app-screen state-screen">
          <header className="planner-topbar">
            <Link href="/" className="topbar-action" aria-label="返回首页">‹</Link>
            <h1>志愿方案</h1>
            <Link href="/plans" className="topbar-link">记录</Link>
          </header>

          <div className="state-card">
            <div className="state-icon" aria-hidden="true">{icon}</div>
            <h2>{title}</h2>
            {detail ? <p>{detail}</p> : null}
            <div className="state-actions">
              {retryAction ? (
                <button className="primary-cta state-cta-button" type="button" onClick={retryAction}>
                  立即刷新
                </button>
              ) : null}
              {actionHref ? (
                <Link href={actionHref} className="plan-record-link state-secondary-link">
                  {actionLabel}
                </Link>
              ) : null}
            </div>
          </div>

          <AppBottomNav active="plans" />
        </section>
      </div>
    </main>
  );
}

function PayModal({ amount, reportId, onClose, onSuccess }) {
  const [payType, setPayType] = useState('wechat');
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await fetch('/api/pay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, payType }),
      });
      const data = await res.json();

      if (data.dev_mode) {
        // Dev mode: simulate payment
        const confirmRes = await fetch('/api/pay/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reportId }),
        });
        if (confirmRes.ok) {
          onSuccess();
        }
        return;
      }

      if (data.payUrl) {
        // Open payment URL
        window.open(data.payUrl, '_blank');
        // Poll for payment completion
        pollPaymentStatus(reportId, onSuccess);
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert('支付创建失败，请重试');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="pay-overlay" onClick={onClose}>
      <div className="pay-modal" onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
        <button className="pay-close" onClick={onClose}>✕</button>
        <h3>解锁完整报告</h3>
        <div className="pay-price">
          <span className="currency">¥</span>{(amount / 100).toFixed(2)}
        </div>
        <p className="pay-desc">
          查看完整的学校、专业推荐<br />及详细分析报告
        </p>

        <div className="pay-methods">
          <button className={`pay-method ${payType === 'wechat' ? 'selected' : ''}`} onClick={() => setPayType('wechat')}>
            <div className="pay-method-icon">💚</div>
            <div className="pay-method-name">微信支付</div>
          </button>
          <button className={`pay-method ${payType === 'alipay' ? 'selected' : ''}`} onClick={() => setPayType('alipay')}>
            <div className="pay-method-icon">💙</div>
            <div className="pay-method-name">支付宝</div>
          </button>
        </div>

        <button className="btn btn-gold" style={{ width: '100%' }} onClick={handlePay} disabled={paying}>
          {paying ? '处理中...' : '立即支付'}
        </button>

        <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 12 }}>
          支付安全由虎皮椒提供保障
        </p>
      </div>
    </div>
  );
}

function pollPaymentStatus(reportId, onSuccess) {
  let attempts = 0;
  const maxAttempts = 60;
  const interval = setInterval(async () => {
    attempts++;
    if (attempts > maxAttempts) {
      clearInterval(interval);
      return;
    }
    try {
      const res = await fetch(`/api/report/${reportId}`);
      const data = await res.json();
      if (data.paid) {
        clearInterval(interval);
        onSuccess();
      }
    } catch (e) {
      // ignore
    }
  }, 3000);
}

function PlanCard({ plan, index, blurred }) {
  const typeMap = {
    '稳妥': 'plan-safe',
    '均衡': 'plan-balanced',
    '冲刺': 'plan-stretch',
  };
  const typeClass = typeMap[plan.type] || 'plan-balanced';
  const admissionPlanMatch = plan.admission_plan_match;
  const hasAdmissionPlanMatch = admissionPlanMatch?.status === 'matched';

  return (
    <div className={`plan-card ${typeClass} ${blurred ? 'blur-overlay' : ''}`}>
      <div className={blurred ? 'blur-content' : ''}>
        <span className="plan-type">方案 {index + 1} — {plan.type}</span>
        <div className="plan-school">{plan.school}</div>
        <div className="plan-major">{plan.major}</div>

        {hasAdmissionPlanMatch ? (
          <div className="plan-source-pill">
            <span>已匹配 {admissionPlanMatch.year} 招生计划</span>
            <strong>{admissionPlanMatch.major_group || '专业组'} · 计划 {admissionPlanMatch.plan_count || '--'} 人</strong>
            {admissionPlanMatch.source_url ? (
              <a href={admissionPlanMatch.source_url} target="_blank" rel="noreferrer">来源</a>
            ) : null}
          </div>
        ) : null}

        <div className="plan-metrics">
          <div className="plan-metric">
            <div className="plan-metric-label">录取可行性</div>
            <div className="plan-metric-value">{plan.admission_rate}</div>
          </div>
          <div className="plan-metric">
            <div className="plan-metric-label">考公友好度</div>
            <div className="plan-metric-value">{plan.civil_service_friendly}</div>
          </div>
          <div className="plan-metric">
            <div className="plan-metric-label">国企适配度</div>
            <div className="plan-metric-value">{plan.soe_fit}</div>
          </div>
          <div className="plan-metric">
            <div className="plan-metric-label">考研增益</div>
            <div className="plan-metric-value">{plan.grad_boost}</div>
          </div>
        </div>

        <div className="plan-detail">
          <h4>📌 推荐理由</h4>
          <p>{plan.reason}</p>
          <h4>⚠️ 风险提示</h4>
          <p>{plan.risk}</p>
          <h4>🔄 替代方案</h4>
          <p>{plan.alternative}</p>
        </div>
      </div>

      {blurred && (
        <div className="blur-cta">
          <p>付费后查看完整方案</p>
        </div>
      )}
    </div>
  );
}

function TrendCard({ item, blurred }) {
  const trendToneMap = {
    '上行': 'up',
    '景气上行': 'up',
    '稳中有升': 'steady-up',
    '稳中向好': 'steady-up',
    '平稳': 'steady',
    '总体平稳': 'steady',
    '竞争加剧': 'heated',
    '竞争承压': 'heated',
    '需谨慎': 'cautious',
    '审慎配置': 'cautious',
  };

  return (
    <div className={`trend-card ${blurred ? 'blur-overlay' : ''}`}>
      <div className={blurred ? 'blur-content' : ''}>
        <div className="trend-card-head">
          <div>
            <div className="trend-plan-tag">{item.plan_type}配置</div>
            <h3>{item.school}</h3>
            <p>{item.major}</p>
          </div>
          <div className={`trend-badge trend-${trendToneMap[item.trend_verdict] || 'steady'}`}>
            {item.trend_verdict}
          </div>
        </div>

        <div className="trend-grid">
          <div className="trend-row">
            <span>趋势窗口</span>
            <strong>{item.trend_window}</strong>
          </div>
          <div className="trend-row">
            <span>需求牵引</span>
            <strong>{item.demand_signal}</strong>
          </div>
          <div className="trend-row">
            <span>主要去向</span>
            <strong>{item.sector_direction}</strong>
          </div>
          <div className="trend-row">
            <span>区域适配</span>
            <strong>{item.regional_fit}</strong>
          </div>
        </div>

        <div className="trend-note-group">
          <div>
            <h4>风险暴露</h4>
            <p>{item.risk_note}</p>
          </div>
          <div>
            <h4>配置建议</h4>
            <p>{item.advice}</p>
          </div>
        </div>
      </div>

      {blurred && (
        <div className="blur-cta">
          <p>付费后查看</p>
        </div>
      )}
    </div>
  );
}

function InsightCard({ title, items = [] }) {
  return (
    <div className="report-mini-card">
      <h3>{title}</h3>
      <div className="report-mini-list">
        {items.map((item) => (
          <div key={item.label} className="report-mini-row">
            <span>{item.label}</span>
            <strong>{item.value || '暂无'}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportPage() {
  const params = useParams();
  const reportId = params.id;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPay, setShowPay] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [viewMode, setViewMode] = useState('concise');

  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch(`/api/report/${reportId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setError('');
      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    if (!shouldPollReport(report)) {
      return;
    }

    const timer = window.setInterval(() => {
      fetchReport();
    }, 3000);

    return () => window.clearInterval(timer);
  }, [fetchReport, report]);

  const handlePaySuccess = () => {
    setShowPay(false);
    setLoading(true);
    fetchReport();
  };

  const handleRetryFetch = () => {
    setLoading(true);
    fetchReport();
  };

  const handleUnlock = () => {
    setShowPay(true);
  };

  const handleExportPdf = async (mode) => {
    window.location.href = `/api/report/${reportId}/pdf?mode=${mode}`;
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = '高考志愿分析报告';
    const shareText = `${PDF_SLOGAN.join('\n')}\n${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        setShareMessage('已调起系统分享');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareMessage('报告链接已复制，可直接转发');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setShareMessage('转发未完成，请稍后再试');
      }
    }
  };

  useEffect(() => {
    if (!shareMessage) return;
    const timer = window.setTimeout(() => setShareMessage(''), 2400);
    return () => window.clearTimeout(timer);
  }, [shareMessage]);

  const viewState = getReportViewState({ loading, error, report });

  if (viewState.kind === 'loading') {
    return (
      <ReportStateScreen title={viewState.title} detail="正在拉取报告数据，请稍候。" icon="⏳" actionHref="/plans" actionLabel="查看记录" />
    );
  }

  if (viewState.kind === 'error') {
    return (
      <ReportStateScreen title={viewState.title} detail="读取报告失败，可以返回首页重新开始，或去方案记录查看历史结果。" icon="😞" actionHref="/" actionLabel="返回首页" />
    );
  }

  if (viewState.kind === 'failed') {
    return (
      <ReportStateScreen title={viewState.title} detail={viewState.detail} icon="⚠️" actionHref="/form" actionLabel="重新填写" retryAction={handleRetryFetch} />
    );
  }

  if (viewState.kind === 'pending') {
    return (
      <ReportStateScreen title={viewState.title} detail={`${viewState.detail} 页面会自动刷新最新结果。`} icon="📋" actionHref="/plans" actionLabel="返回记录" retryAction={handleRetryFetch} />
    );
  }

  const r = report.report;
  const isPaid = report.paid;
  const blurred = !isPaid;

  return (
    <main className="ios-scene">
      <div className="phone-shell">
        <div className="app-screen report-screen">
          <header className="planner-topbar no-print">
            <Link href="/" className="topbar-action" aria-label="返回首页">‹</Link>
            <h1>志愿方案</h1>
            <button type="button" className="topbar-link report-share-link" onClick={handleShare}>转发</button>
          </header>

          <section className="report-summary-card no-print">
            <div className="planner-section-head">
              <h2>志愿分析报告</h2>
              <span>{isPaid ? '已解锁完整内容' : '预览版'}</span>
            </div>
            <p>生成时间：{report.created_at}</p>
            <div className="report-summary-pills">
              <span>{viewMode === 'concise' ? '简明视图' : '全面视图'}</span>
              <span>{isPaid ? '可下载 PDF' : `待解锁 ¥${(report.amount / 100).toFixed(2)}`}</span>
            </div>
            <div className="report-summary-grid">
              <InsightCard
                title="考生概况"
                items={[
                  { label: '省份', value: report.form_data?.province },
                  { label: '分数', value: report.form_data?.score ? `${report.form_data.score} 分` : '' },
                  { label: '位次', value: report.form_data?.rank || '' },
                ]}
              />
              <InsightCard
                title="当前状态"
                items={[
                  { label: '报告类型', value: report.paid ? '完整报告' : '预览报告' },
                  { label: '查看模式', value: viewMode === 'concise' ? '简明版' : '全面版' },
                  { label: '解锁状态', value: report.paid ? '已支付' : '待支付' },
                ]}
              />
            </div>
            {isPaid && (
              <div className="report-actions no-print">
                <button className="btn btn-report-action" onClick={() => handleExportPdf('concise')}>简明版 PDF</button>
                <button className="btn btn-report-action" onClick={() => handleExportPdf('full')}>全面版 PDF</button>
                <Link href="/plans" className="btn btn-report-action">查看记录</Link>
              </div>
            )}
            {shareMessage && <div className="report-share-tip no-print">{shareMessage}</div>}
          </section>

          <div className="report-body">
        {isPaid && (
          <section className="pdf-cover print-only">
            <div className="pdf-cover-watermark">{PDF_SITE_URL}</div>
            <div className="pdf-cover-inner">
              <div className="pdf-cover-badge">高考志愿智能分析报告</div>
              <h1>
                {PDF_SLOGAN.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </h1>
              <p>{PDF_SITE_URL}</p>
              <span>生成时间：{report.created_at}</span>
            </div>
          </section>
        )}

        <div className="report-section fade-in-up no-print report-view-toggle-card">
          <div className="report-view-toggle-row">
            <button
              className={`btn ${viewMode === 'concise' ? 'btn-gold' : 'btn-report-action'}`}
              onClick={() => setViewMode('concise')}
            >
              简明版
            </button>
            <button
              className={`btn ${viewMode === 'full' ? 'btn-gold' : 'btn-report-action'}`}
              onClick={() => setViewMode('full')}
            >
              全面版
            </button>
          </div>
          <p className="report-toggle-tip">
            简明版适合先看最终志愿排序，全面版适合核对分析逻辑和推荐依据。
          </p>
        </div>

        {blurred && (
          <div className="report-section fade-in-up no-print report-unlock-card">
            <div className="report-unlock-row">
              <div>
                <h2 style={{ margin: 0, fontSize: '1.05rem' }}>解锁完整报告</h2>
                <p className="report-unlock-tip">
                  查看完整学校与专业推荐、详细判断依据，以及 PDF 下载。
                </p>
              </div>
              <button className="btn btn-gold" onClick={handleUnlock}>
                立即付费 ¥{(report.amount / 100).toFixed(2)}
              </button>
            </div>
          </div>
        )}

        {viewMode === 'concise' && (
          <div className={`report-section fade-in-up ${blurred ? 'blur-overlay' : ''}`}>
            <div className={blurred ? 'blur-content' : ''}>
              <h2><span className="section-icon">🧾</span> 简明版志愿表</h2>
              <p className="report-paragraph">{r.concise_report?.summary}</p>
              <div style={{ display: 'grid', gap: 12 }}>
                {(r.concise_report?.volunteer_table || []).map((item, index) => (
                  <div key={`${item.priority}-${index}`} className="plan-card plan-balanced">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                      <strong>{item.priority}</strong>
                      <span className="plan-type">{item.fill_strategy}</span>
                    </div>
                    <div className="plan-school">{item.school}</div>
                    <div className="plan-major">{item.major}</div>
                    <p style={{ color: '#475569', marginTop: 10, marginBottom: 0 }}>{item.note}</p>
                  </div>
                ))}
              </div>
            </div>
            {blurred && (
              <div className="blur-cta">
                <button className="btn btn-gold" onClick={handleUnlock}>解锁完整报告</button>
              </div>
            )}
          </div>
        )}

        {viewMode === 'full' && (
          <>
        <div className="report-section fade-in-up">
          <h2><span className="section-icon">📋</span> 学生定位总结</h2>
          <p className="report-paragraph">{r.student_summary}</p>
        </div>

        <div className="report-section fade-in-up">
          <h2><span className="section-icon">👨‍👩‍👧</span> 家庭偏好总结</h2>
          <p className="report-paragraph">{r.family_summary}</p>
        </div>

        <div className="report-section fade-in-up">
          <h2><span className="section-icon">🎯</span> 推荐策略</h2>
          <div className="report-item">
            <span className="report-item-label">核心策略：</span>
            <span className="report-item-value">{r.strategy?.core}</span>
          </div>
          <div className={`report-item ${blurred ? 'blur-content' : ''}`}>
            <span className="report-item-label">不优先方向：</span>
            <span className="report-item-value">{r.strategy?.not_recommended}</span>
          </div>
          <div className={`report-item ${blurred ? 'blur-content' : ''}`}>
            <span className="report-item-label">当前不确定性：</span>
            <span className="report-item-value">{r.strategy?.uncertainties}</span>
          </div>
        </div>

        <div className="report-subtitle-row">
          <h2>推荐方案</h2>
        </div>
        {(r.plans || []).map((plan, idx) => (
          <PlanCard key={idx} plan={plan} index={idx} blurred={blurred} />
        ))}

        {blurred && (
          <div className="report-inline-unlock">
            <button className="btn btn-gold btn-lg" onClick={handleUnlock}>
              🔓 解锁完整报告 ¥{(report.amount / 100).toFixed(2)}
            </button>
            <p>
              查看完整的学校、专业推荐及详细分析
            </p>
          </div>
        )}

        <div className={`report-section fade-in-up ${blurred ? 'blur-overlay' : ''}`}>
          <div className={blurred ? 'blur-content' : ''}>
            <h2><span className="section-icon">📈</span> 专业与就业趋势研判</h2>
            <p className="report-paragraph">{r.employment_trends?.overview}</p>
            <div className="trend-list">
              {(r.employment_trends?.items || []).map((item, idx) => (
                <TrendCard key={`${item.plan_type}-${idx}`} item={item} blurred={false} />
              ))}
            </div>
            <div className="trend-summary">
              <span className="trend-summary-label">决策结论</span>
              <p>{r.employment_trends?.action_summary}</p>
            </div>
          </div>
          {blurred && <div className="blur-cta"><p>付费后查看</p></div>}
        </div>

        <div className={`report-section fade-in-up ${blurred ? 'blur-overlay' : ''}`}>
          <div className={blurred ? 'blur-content' : ''}>
            <h2><span className="section-icon">💬</span> 家长最关心</h2>
            <div className="report-item">
              <span className="report-item-label">考公/考编：</span>
              <span className="report-item-value">{r.family_concerns?.civil_service}</span>
            </div>
            <div className="report-item">
              <span className="report-item-label">是否考研：</span>
              <span className="report-item-value">{r.family_concerns?.graduate_school}</span>
            </div>
            <div className="report-item">
              <span className="report-item-label">国企机会：</span>
              <span className="report-item-value">{r.family_concerns?.soe_opportunity}</span>
            </div>
            <div className="report-item">
              <span className="report-item-label">地域建议：</span>
              <span className="report-item-value">{r.family_concerns?.location_advice}</span>
            </div>
          </div>
          {blurred && <div className="blur-cta"><p>付费后查看</p></div>}
        </div>

        <div className={`report-section fade-in-up ${blurred ? 'blur-overlay' : ''}`}>
          <div className={blurred ? 'blur-content' : ''}>
            <h2><span className="section-icon">🔎</span> 参考来源</h2>
            <p className="report-paragraph">{r.source_notes?.summary}</p>
            <div className="report-source-grid">
              {(r.source_notes?.items || []).map((item, index) => (
                <div key={`${item.url || item.title}-${index}`} className="plan-card plan-balanced">
                  <div className="report-card-head">
                    <strong>{item.title}</strong>
                    <span className="plan-type">{item.category}</span>
                  </div>
                  <p className="report-source-snippet">{item.snippet}</p>
                  <a href={item.url} target="_blank" rel="noreferrer" className="report-source-link">
                    {item.url}
                  </a>
                </div>
              ))}
            </div>
          </div>
          {blurred && <div className="blur-cta"><p>付费后查看</p></div>}
        </div>

        <div className={`report-section fade-in-up ${blurred ? 'blur-overlay' : ''}`}>
          <div className={blurred ? 'blur-content' : ''}>
            <h2><span className="section-icon">🧠</span> 推荐依据与判断</h2>
            <p className="report-paragraph">{r.recommendation_evidence?.overall_judgment}</p>
            <div className="report-evidence-grid">
              {(r.recommendation_evidence?.factors || []).map((item, index) => (
                <div key={`${item.title}-${index}`} className="report-mini-card evidence-card">
                  <h3>{item.title}</h3>
                  <div className="report-item">
                    <span className="report-item-label">分析：</span>
                    <span className="report-item-value">{item.analysis}</span>
                  </div>
                  <div className="report-item">
                    <span className="report-item-label">依据：</span>
                    <span className="report-item-value">{item.evidence}</span>
                  </div>
                  <div className="report-item">
                    <span className="report-item-label">结论：</span>
                    <span className="report-item-value">{item.conclusion}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="report-rationale-grid">
              {(r.recommendation_evidence?.school_major_rationales || []).map((item, index) => (
                <div key={`${item.school}-${item.major}-${index}`} className="plan-card plan-balanced">
                  <div className="plan-school">{item.school}</div>
                  <div className="plan-major">{item.major}</div>
                  <div className="report-item">
                    <span className="report-item-label">推荐理由：</span>
                    <span className="report-item-value">{item.rationale}</span>
                  </div>
                  <div className="report-item">
                    <span className="report-item-label">有力凭据：</span>
                    <span className="report-item-value">{item.evidence}</span>
                  </div>
                  <div className="report-item">
                    <span className="report-item-label">风险平衡：</span>
                    <span className="report-item-value">{item.risk_balance}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {blurred && <div className="blur-cta"><p>付费后查看</p></div>}
        </div>

        <div className={`report-section fade-in-up ${blurred ? 'blur-overlay' : ''}`}>
          <div className={blurred ? 'blur-content' : ''}>
            <h2><span className="section-icon">📝</span> 最终提醒</h2>
            <div className="report-item">
              <span className="report-item-label">使用提示：</span>
              <span className="report-item-value">{r.final_notes?.data_to_verify}</span>
            </div>
            <div className="report-item">
              <span className="report-item-label">适用边界：</span>
              <span className="report-item-value">{r.final_notes?.scope}</span>
            </div>
            <div className="report-item">
              <span className="report-item-label">下一步：</span>
              <span className="report-item-value">{r.final_notes?.next_steps}</span>
            </div>
          </div>
          {blurred && <div className="blur-cta"><p>付费后查看</p></div>}
        </div>

        {/* If paid, show all clear */}
        {isPaid && (
          <div className="report-paid-note">
            ✅ 已解锁完整报告
          </div>
        )}

        <div className="report-bottom-actions no-print">
          <Link href="/plans" className="btn btn-report-action">回到方案记录</Link>
          <Link href="/form" className="btn btn-report-action">重新规划一份</Link>
        </div>
          </>
        )}
          </div>

          <AppBottomNav active="plans" />

          {showPay && (
            <PayModal
              amount={report.amount}
              reportId={reportId}
              onClose={() => setShowPay(false)}
              onSuccess={handlePaySuccess}
            />
          )}
        </div>
      </div>
    </main>
  );
}
