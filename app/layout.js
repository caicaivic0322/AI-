import './globals.css';

export const metadata = {
  title: '高考志愿 AI 助手 — 智能分析你的最优志愿方案',
  description: '基于 AI 智能分析，为高考考生量身定制 1-3 个差异化志愿方案。输入分数位次，30秒出结果。',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
