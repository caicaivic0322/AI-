import Link from 'next/link';
import { AppBottomNav, BrandMark } from './components/AppChrome';
import { getHomepageNewsFeed } from './lib/homepage-news.mjs';

export const dynamic = 'force-dynamic';

const FEATURE_CARDS = [
  {
    title: '数据权威',
    desc: '官方政策与高校数据持续更新',
    icon: 'shield',
  },
  {
    title: '智能匹配',
    desc: '多维算法联看分数、专业与城市',
    icon: 'target',
  },
  {
    title: '方案清晰',
    desc: '冲稳保结构一眼看懂，便于和家长沟通',
    icon: 'bars',
  },
];

const STEPS = [
  { no: '1', title: '填写信息', desc: '成绩与偏好' },
  { no: '2', title: '智能分析', desc: '生成方向' },
  { no: '3', title: '查看结果', desc: '调整与优化' },
];

const HERO_POINTS = [
  '覆盖分数、位次、专业兴趣与城市偏好',
  '输出清晰结论，方便和家长快速讨论',
  '同步参考最新政策与高校快讯',
];

function formatNewsUpdatedAt(updatedAt) {
  if (!updatedAt) {
    return '自动更新';
  }

  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) {
    return '自动更新';
  }

  return `${date.getMonth() + 1}月${date.getDate()}日更新`;
}

function getNewsStatusText(meta) {
  if (meta?.status === 'fresh') {
    return '每日 1 次同步';
  }

  if (meta?.status === 'stale') {
    return '缓存待刷新';
  }

  return '官方兜底';
}

function FeatureIcon({ type }) {
  if (type === 'target') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 3.5V7" />
        <path d="M20.5 12H17" />
      </svg>
    );
  }

  if (type === 'bars') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 19V10" />
        <path d="M12 19V5" />
        <path d="M18 19v-7" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5 18.5 6v5c0 4.1-2.5 7.3-6.5 9.5-4-2.2-6.5-5.4-6.5-9.5V6L12 3.5Z" />
      <path d="m10.2 11.8 1.4 1.4 2.6-3" />
    </svg>
  );
}

export default async function HomePage() {
  const newsFeed = await getHomepageNewsFeed();
  const newsItems = newsFeed.items;
  const newsUpdatedLabel = formatNewsUpdatedAt(newsFeed.meta.updatedAt);
  const newsStatusText = getNewsStatusText(newsFeed.meta);

  return (
    <main className="ios-scene">
      <div className="phone-shell">
        <section className="app-screen home-screen">
          <header className="screen-top home-top">
            <div className="brand-lockup">
              <BrandMark />
              <div>
                <strong>高考志愿</strong>
                <span>智能规划</span>
              </div>
            </div>
            <Link href="/guide" className="guide-link">
              <span className="guide-link-icon">◎</span>
              <span>新手指南</span>
            </Link>
          </header>

          <section className="hero-card">
            <div className="hero-copy">
              <div className="hero-meta-row">
                <span>2026 高考</span>
                <span>AI 志愿规划</span>
              </div>
              <h1 className="hero-title">
                <span className="hero-title-line">科学规划志愿</span>
                <span className="hero-title-line">找到更适合的</span>
                <span className="hero-title-line">大学与专业</span>
              </h1>
              <p>基于政策、数据与算法，为你生成个性化志愿方案。</p>
              <div className="hero-keywords" aria-label="规划依据">
                <span>政策</span>
                <span>数据</span>
                <span>算法</span>
              </div>
            </div>
          </section>

          <div className="hero-actions">
            <Link className="primary-cta" href="/form">
              <span>开始智能规划</span>
              <span aria-hidden="true">→</span>
            </Link>
            <p>仅需 3 步，生成你的志愿方案</p>
          </div>

          <section className="hero-point-list" aria-label="核心说明">
            {HERO_POINTS.map((item) => (
              <div key={item} className="hero-point-row">
                <span className="hero-point-bullet" />
                <span>{item}</span>
              </div>
            ))}
          </section>

          <section className="feature-grid" aria-label="核心能力">
            {FEATURE_CARDS.map((item) => (
              <article key={item.title} className="feature-card">
                <div className="feature-icon">
                  <FeatureIcon type={item.icon} />
                </div>
                <h2>{item.title}</h2>
                <p>{item.desc}</p>
              </article>
            ))}
          </section>

          <section className="journey-card">
            <div className="section-heading">
              <h2>规划只需三步</h2>
            </div>
            <div className="journey-steps">
              {STEPS.map((item, index) => (
                <div key={item.no} className="journey-step">
                  <div className="journey-no">{item.no}</div>
                  <div className="journey-icon" />
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                  {index < STEPS.length - 1 ? <div className="journey-line" /> : null}
                </div>
              ))}
            </div>
          </section>

          <section className="news-card" aria-labelledby="home-news-title">
            <div className="section-heading news-heading">
              <div>
                <span className="news-kicker">2026 最新速览</span>
                <h2 id="home-news-title">政策与高校招考快讯</h2>
                <p className="news-refresh-state">
                  <span>{newsUpdatedLabel}</span>
                  <span>{newsStatusText}</span>
                </p>
              </div>
              <a href="https://gaokao.chsi.com.cn/" target="_blank" rel="noreferrer" className="news-link">
                查看更多
              </a>
            </div>
            <div className="news-list">
              {newsItems.map((item, index) => (
                <a
                  key={`${item.title}-${index}`}
                  className="news-item"
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="news-item-head">
                    <span className="news-tag">{item.tag}</span>
                    <span className="news-date">{item.publishedAt}</span>
                  </div>
                  <strong>{item.title}</strong>
                  <p>{item.summary}</p>
                  <div className="news-meta">
                    <span>{item.source}</span>
                    <span>原文 ↗</span>
                  </div>
                </a>
              ))}
            </div>
          </section>

          <AppBottomNav active="home" />
        </section>
      </div>
    </main>
  );
}
