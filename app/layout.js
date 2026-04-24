import { Noto_Sans_SC, Noto_Serif_SC } from 'next/font/google';
import SunThemeManager from './components/SunThemeManager';
import './globals.css';

const fontBody = Noto_Sans_SC({
  subsets: ['latin'],
  variable: '--font-body-google',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const fontSerif = Noto_Serif_SC({
  subsets: ['latin'],
  variable: '--font-serif-google',
  weight: ['400', '600', '700', '900'],
  display: 'swap',
});

export const metadata = {
  title: '高考志愿 AI 助手 — 智能分析你的最优志愿方案',
  description: '基于 AI 智能分析，为高考考生量身定制 1-3 个差异化志愿方案。输入分数位次，30秒出结果。',
};

const themeInitScript = `
(function () {
  try {
    var params = new URLSearchParams(window.location.search);
    var requestedTheme = params.get('theme');
    if (requestedTheme === 'dark' || requestedTheme === 'light') {
      window.sessionStorage.setItem('theme-preview', requestedTheme);
    } else if (requestedTheme === 'auto') {
      window.sessionStorage.removeItem('theme-preview');
    }
    var previewTheme = requestedTheme === 'dark' || requestedTheme === 'light'
      ? requestedTheme
      : window.sessionStorage.getItem('theme-preview');
    var hour = new Date().getHours();
    var theme = previewTheme === 'dark' || previewTheme === 'light'
      ? previewTheme
      : hour >= 18 || hour < 6 ? 'dark' : 'light';
    var root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.themeSource = previewTheme === 'dark' || previewTheme === 'light' ? 'preview' : 'clock';
    root.style.colorScheme = theme;
  } catch (error) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${fontBody.variable} ${fontSerif.variable}`}>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <SunThemeManager />
        {children}
      </body>
    </html>
  );
}
