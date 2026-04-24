import Link from 'next/link';
import { AppBottomNav } from '../components/AppChrome';

const GUIDE_STEPS = [
  {
    no: '01',
    title: '选择填报方式',
    desc: '有明确偏好就细化填写，方向还不清晰就先自动规划。',
    meta: '30 秒进入填写',
  },
  {
    no: '02',
    title: '填写成绩与偏好',
    desc: '输入省份、科类、分数、位次，再补充城市、专业和院校层次偏好。',
    meta: '支持自动识别省份',
  },
  {
    no: '03',
    title: 'AI 生成志愿方案',
    desc: '系统会结合政策、历史数据和你的偏好，生成冲稳保结构。',
    meta: '先出预览结论',
  },
  {
    no: '04',
    title: '查看报告与记录',
    desc: '在方案页继续查看、导出或回到填写记录，后续可重新调整条件。',
    meta: '结果可追溯',
  },
];

const MODE_LINKS = [
  {
    href: '/form/guided',
    title: '量身定制',
    desc: '适合已经有城市、学校层次或专业方向想法的学生和家长。',
    badge: '更细致',
  },
  {
    href: '/form/auto',
    title: '自动规划',
    desc: '适合还没有清晰方向，想先让 AI 帮你缩小范围的人。',
    badge: '更省事',
  },
];

export default function GuidePage() {
  return (
    <main className="ios-scene">
      <div className="phone-shell">
        <section className="app-screen guide-screen">
          <header className="planner-topbar">
            <Link href="/" className="topbar-action" aria-label="返回首页">‹</Link>
            <h1>新手指南</h1>
            <Link href="/form" className="topbar-link">开始规划</Link>
          </header>

          <section className="guide-intro">
            <span className="guide-kicker">流程总览</span>
            <h2>从填写信息到查看方案，按 4 步走完</h2>
            <p>先选适合你的填写方式，再让 AI 结合数据生成可讨论的志愿方案。</p>
          </section>

          <section className="guide-flow" aria-label="应用流程">
            {GUIDE_STEPS.map((step) => (
              <article key={step.no} className="guide-step-card">
                <div className="guide-step-no">{step.no}</div>
                <div>
                  <div className="guide-step-head">
                    <h3>{step.title}</h3>
                    <span>{step.meta}</span>
                  </div>
                  <p>{step.desc}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="guide-mode-panel" aria-labelledby="guide-mode-title">
            <div className="section-heading">
              <h2 id="guide-mode-title">从哪种方式开始</h2>
            </div>
            <div className="guide-mode-grid">
              {MODE_LINKS.map((mode) => (
                <Link key={mode.href} href={mode.href} className="guide-mode-card">
                  <div className="guide-mode-head">
                    <strong>{mode.title}</strong>
                    <span>{mode.badge}</span>
                  </div>
                  <p>{mode.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          <Link className="primary-cta guide-start-cta" href="/form">
            <span>开始智能规划</span>
            <span aria-hidden="true">→</span>
          </Link>

          <AppBottomNav active="home" />
        </section>
      </div>
    </main>
  );
}
