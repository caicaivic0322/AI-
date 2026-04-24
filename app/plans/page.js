import Link from 'next/link';
import { AppBottomNav } from '../components/AppChrome';
import { listReports } from '../lib/db';

export const dynamic = 'force-dynamic';

function getStatusLabel(report) {
  if (report.status === 'failed') return '生成失败';
  if (report.status === 'pending') return '生成中';
  return report.paid ? '完整报告' : '预览报告';
}

function getPrimaryAction(report) {
  if (report.status === 'pending') {
    return { href: `/report/${report.id}`, label: '查看进度' };
  }

  if (report.status === 'failed') {
    return { href: '/form', label: '重新填写' };
  }

  return { href: `/report/${report.id}`, label: report.paid ? '查看报告' : '继续查看' };
}

export default function PlansPage() {
  let reports = [];

  try {
    reports = listReports(24);
  } catch (error) {
    console.error('Failed to load reports list:', error);
  }

  return (
    <main className="ios-scene">
      <div className="phone-shell">
        <section className="app-screen plans-screen">
          <header className="planner-topbar">
            <Link href="/" className="topbar-action" aria-label="返回首页">‹</Link>
            <h1>我的方案</h1>
            <Link href="/form" className="topbar-link">新建</Link>
          </header>

          <section className="entry-hero-card">
            <div className="entry-hero-copy">
              <span className="entry-kicker">报告记录</span>
              <h2>查看最近生成的志愿分析方案</h2>
              <p>这里会保留你的填写记录、生成状态和已解锁报告，方便继续查看或重新规划。</p>
            </div>
          </section>

          <section className="plans-list">
            {reports.length === 0 ? (
              <div className="empty-state-card">
                <strong>还没有生成过方案</strong>
                <p>先去填写基础信息，生成你的第一份志愿分析报告。</p>
                <Link href="/form" className="primary-cta empty-state-cta">开始填写</Link>
              </div>
            ) : (
              reports.map((report) => {
                const action = getPrimaryAction(report);

                return (
                  <article key={report.id} className="plan-record-card">
                    <div className="plan-record-head">
                      <strong>{report.form_data?.province || '未填写省份'} · {report.form_data?.score || '--'} 分</strong>
                      <span className={`plan-record-badge status-${report.status}`}>{getStatusLabel(report)}</span>
                    </div>
                    <p>
                      {report.form_data?.subject_type || '未填写科类'}
                      {report.form_data?.rank ? ` · 位次 ${report.form_data.rank}` : ''}
                    </p>
                    <div className="plan-record-meta">
                      <span>{report.created_at}</span>
                      <span>{report.paid ? '已付费解锁' : `待解锁 ¥${(report.amount / 100).toFixed(2)}`}</span>
                    </div>
                    <Link href={action.href} className="plan-record-link">{action.label}</Link>
                  </article>
                );
              })
            )}
          </section>

          <AppBottomNav active="plans" />
        </section>
      </div>
    </main>
  );
}
