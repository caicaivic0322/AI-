import Link from 'next/link';
import { getHomepageNews } from './lib/homepage-news.mjs';

const HERO_FEATURES = ['位次与梯度校准', '专业与就业联看', '家庭沟通更省心'];

const HERO_METRICS = [
  { value: '30 秒', label: '生成首版分析', detail: '先看方向，再看细节' },
  { value: '4 步', label: '完成核心信息', detail: '输入简单，重点不遗漏' },
  { value: '冲稳保', label: '给出差异化组合', detail: '兼顾录取率与长期发展' },
];

const HERO_POINTS = [
  '覆盖分数、位次、专业兴趣、城市偏好与家庭诉求',
  '输出可读结论，不堆术语，适合和家长一起讨论',
  '同步参考最新政策与高校招考快讯，降低信息差',
];

function AnimatedTitle() {
  const lines = [
    { text: '0信息差', accent: false, baseDelay: 0.3, key: 'a' },
    { text: '100%量身定制', accent: true, baseDelay: 0.6, key: 'b' },
    { text: '更可信的高考志愿推荐', accent: false, baseDelay: 0.9, key: 'c' },
  ];

  return (
    <h1>
      {lines.map((line, lineIndex) => (
        <span key={line.key} className={line.accent ? 'accent hero-line' : 'hero-line'}>
          {line.text.split('').map((char, i) => (
            <span
              key={`${line.key}${i}`}
              className="char"
              style={{ animationDelay: `${line.baseDelay + i * 0.05}s` }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      ))}
    </h1>
  );
}

export default async function HomePage() {
  const newsItems = await getHomepageNews();

  return (
    <section className="hero">
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />
      <div className="hero-rings" />

      {/* Notebook-style horizontal lines */}
      <div className="hero-grid" />

      {/* Gold bottom line */}
      <div className="hero-accent-line" />

      <div className="hero-content">
        <div className="hero-shell">
          <div className="hero-main">
            <div className="hero-badge">
              2026 高考志愿 · 智能分析
            </div>

            <AnimatedTitle />

            <p className="hero-subtitle">
              基于政策、录取率与趋势判断，
              以就业结果为导向，规划更优高考志愿。
            </p>

            <div className="hero-cta-row">
              <div className="hero-cta">
                <Link className="btn btn-lg" href="/form">
                  <span>开始填报分析</span>
                  <span className="btn-arrow">→</span>
                </Link>
              </div>

              <a className="hero-secondary-link" href="#hero-news">
                先看最新政策
              </a>
            </div>

            <div className="hero-metrics" aria-label="产品亮点">
              {HERO_METRICS.map((item, index) => (
                <div
                  key={item.label}
                  className="hero-metric"
                  style={{ animationDelay: `${1 + index * 0.12}s` }}
                >
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                  <small>{item.detail}</small>
                </div>
              ))}
            </div>

            <div className="hero-points" aria-label="核心能力">
              {HERO_POINTS.map((point, index) => (
                <div
                  key={point}
                  className="hero-point"
                  style={{ animationDelay: `${1.06 + index * 0.12}s` }}
                >
                  <span className="hero-point-dot" />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <div className="hero-features">
              {HERO_FEATURES.map((feature, index) => (
                <div
                  key={feature}
                  className="hero-feature"
                  style={{ animationDelay: `${1.18 + index * 0.12}s` }}
                >
                  <span className="hero-feature-text">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <aside id="hero-news" className="hero-briefs" aria-label="2026 高考政策与高校快讯">
            <div className="hero-briefs-head">
              <div>
                <span>2026 最新速览</span>
                <strong>政策与高校招考快讯</strong>
              </div>
              <p>聚合政策、招办动态与高校新闻，先把变化看清楚。</p>
            </div>

            <div className="hero-briefs-grid">
              {newsItems.map((item, index) => (
                <a
                  key={`${item.title}-${index}`}
                  className="hero-brief"
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ animationDelay: `${1.05 + index * 0.12}s` }}
                >
                  <div className="hero-brief-index">0{index + 1}</div>
                  <div className="hero-brief-body">
                    <div className="hero-brief-top">
                      <span className="hero-brief-tag">{item.tag}</span>
                      <span className="hero-brief-date">{item.publishedAt}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    <div className="hero-brief-meta">
                      <span>{item.source}</span>
                      <span>查看原文 ↗</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </aside>
        </div>
      </div>

      <div className="hero-scroll">
        <div className="hero-scroll-mouse" />
      </div>
    </section>
  );
}
