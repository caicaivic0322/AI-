import Link from 'next/link';
import { AppBottomNav } from '../components/AppChrome';
import { listReports } from '../lib/db';

export const dynamic = 'force-dynamic';

function buildStats(reports) {
  const total = reports.length;
  const paid = reports.filter((report) => report.paid).length;
  const pending = reports.filter((report) => report.status === 'pending').length;

  return [
    { label: '累计方案', value: String(total) },
    { label: '已解锁', value: String(paid) },
    { label: '生成中', value: String(pending) },
  ];
}

const QUICK_ACTIONS = [
  {
    title: '开始新的志愿规划',
    desc: '重新填写成绩、位次和偏好，生成新的分析方案。',
    href: '/form',
    label: '去填写',
  },
  {
    title: '查看历史方案',
    desc: '回看最近生成的报告、解锁状态和填写记录。',
    href: '/plans',
    label: '去查看',
  },
  {
    title: '返回首页',
    desc: '回到首页重新浏览功能介绍和规划流程。',
    href: '/',
    label: '回首页',
  },
];

export default function MePage() {
  let reports = [];

  try {
    reports = listReports(12);
  } catch (error) {
    console.error('Failed to load profile stats:', error);
  }

  const stats = buildStats(reports);
  const latestReport = reports[0] || null;

  return (
    <main className="ios-scene">
      <div className="phone-shell">
        <section className="app-screen me-screen">
          <header className="planner-topbar">
            <Link href="/" className="topbar-action" aria-label="返回首页">‹</Link>
            <h1>我的</h1>
            <Link href="/plans" className="topbar-link">方案</Link>
          </header>

          <section className="entry-hero-card">
            <div className="entry-hero-copy">
              <span className="entry-kicker">个人中心</span>
              <h2>继续你的志愿规划流程</h2>
              <p>这里集中放你的方案统计、最近一次报告和常用入口，方便随时回到上一步继续。</p>
            </div>
          </section>

          <section className="profile-stats-grid">
            {stats.map((item) => (
              <article key={item.label} className="profile-stat-card">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </section>

          <section className="recent-report-card">
            <div className="mode-card-head">
              <strong>最近一次方案</strong>
              <span>{latestReport ? latestReport.created_at : '暂无'}</span>
            </div>
            {latestReport ? (
              <>
                <h3>
                  {latestReport.form_data?.province || '未填写省份'} · {latestReport.form_data?.score || '--'} 分
                </h3>
                <p>
                  {latestReport.form_data?.subject_type || '未填写科类'}
                  {latestReport.form_data?.rank ? ` · 位次 ${latestReport.form_data.rank}` : ''}
                </p>
                <div className="mode-points">
                  <span>{latestReport.paid ? '已解锁完整报告' : '当前为预览版'}</span>
                  <span>{latestReport.status === 'pending' ? '仍在生成中' : '可继续查看'}</span>
                </div>
                <Link href={`/report/${latestReport.id}`} className="plan-record-link">
                  打开最近报告
                </Link>
              </>
            ) : (
              <>
                <p>还没有生成过报告，先去填写基础信息，系统会为你生成第一份志愿分析。</p>
                <Link href="/form" className="plan-record-link">开始填写</Link>
              </>
            )}
          </section>

          <section className="mode-grid">
            {QUICK_ACTIONS.map((item) => (
              <Link key={item.title} href={item.href} className="mode-card">
                <div className="mode-card-head">
                  <strong>{item.title}</strong>
                  <span>{item.label}</span>
                </div>
                <p>{item.desc}</p>
              </Link>
            ))}
          </section>

          <AppBottomNav active="me" />
        </section>
      </div>
    </main>
  );
}
