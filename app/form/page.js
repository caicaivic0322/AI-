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
            <span className="topbar-link">填写记录</span>
          </header>

          <section className="entry-hero-card">
            <div className="entry-hero-copy">
              <span className="entry-kicker">开始填写</span>
              <h2>先选择更适合你的填报方式</h2>
              <p>已经有明确偏好，可以自己细化填写；如果还没有清晰方向，也可以先交给 AI 缩小范围。</p>
            </div>
          </section>

          <section className="mode-grid">
            {modeOptions.map((option) => (
              <Link key={option.value} href={option.href} className="mode-card">
                <div className="mode-card-head">
                  <strong>{option.label}</strong>
                  <span>{option.badge}</span>
                </div>
                <h3>{option.title}</h3>
                <p>{option.description}</p>
              </Link>
            ))}
          </section>

          <AppBottomNav active="form" />
        </section>
      </div>
    </main>
  );
}
