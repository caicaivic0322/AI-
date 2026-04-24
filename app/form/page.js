import Link from 'next/link';
import { AppBottomNav } from '../components/AppChrome';
import { getFormModeOptions } from '../lib/form-utils.mjs';

export default function FormPage() {
  const modeOptions = getFormModeOptions();

  return (
    <main className="ios-scene">
      <div className="phone-shell">
        <section className="app-screen form-entry-screen">
          <header className="planner-topbar">
            <Link href="/" className="topbar-action" aria-label="返回首页">‹</Link>
            <h1>智能规划</h1>
            <Link href="/plans" className="topbar-link">填写记录</Link>
          </header>

          <section className="entry-hero-card">
            <div className="entry-hero-copy">
              <span className="entry-kicker">开始填写</span>
              <h2>选择填报方式</h2>
              <p>按已有偏好细化填写，或先让 AI 帮你缩小范围。</p>
            </div>
          </section>

          <section className="mode-grid">
            {modeOptions.map((option) => (
              <Link key={option.value} href={option.href} className={`mode-card mode-card-${option.value}`}>
                <div className="mode-card-head">
                  <strong>{option.label}</strong>
                  <span>{option.badge}</span>
                </div>
                <h3>{option.title}</h3>
                <p>{option.description}</p>
                <div className="mode-points">
                  {option.highlights.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </Link>
            ))}
          </section>

          <AppBottomNav active="form" />
        </section>
      </div>
    </main>
  );
}
