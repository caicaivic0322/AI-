import Link from 'next/link';
import { getFormModeOptions } from '../lib/form-utils.mjs';

export default function FormPage() {
  const modeOptions = getFormModeOptions();

  return (
    <div className="form-page">
      <div className="form-header">
        <div className="form-header-inner">
          <span className="form-brand">高考志愿填报</span>
          <div className="header-progress-text">选择适合你的填报方式</div>
        </div>
      </div>

      <div className="form-body">
        <div className="form-container">
          <div className="form-panel form-entry-panel">
            <div className="form-step-header">
              <div className="form-step-icon">🧭</div>
              <div className="form-step-text">
                <span className="form-step-kicker">填报入口</span>
                <h2>先选择一种更适合你的填报方式</h2>
                <p>家长和学生可以先判断自己是否已经有清晰方向，再决定是自己细化填写，还是先交给 AI 帮你缩小范围。</p>
              </div>
            </div>

            <div className="form-mode-grid">
              {modeOptions.map((option) => (
                <Link key={option.value} href={option.href} className="form-mode-card">
                  <div className="form-mode-card-head">
                    <span className="form-mode-badge">{option.badge}</span>
                    <span className="form-mode-label">{option.label}</span>
                  </div>
                  <strong>{option.title}</strong>
                  <p>{option.description}</p>
                  <div className="form-mode-points">
                    {option.highlights.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>

            <div className="step-footer">
              <Link className="btn btn-ghost" href="/">← 返回首页</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
