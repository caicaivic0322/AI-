import Link from 'next/link';

export function BrandMark({ className = '' }) {
  return (
    <span className={`brand-mark ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M5 8.4 16 3l11 5.4v15.2L16 29 5 23.6V8.4Z" fill="currentColor" opacity="0.14" />
        <path d="M8.5 9.8 16 6.3l7.5 3.5v3.8L16 17 8.5 13.6V9.8Z" fill="currentColor" />
        <path d="M8.5 16.7 15 19.8v6.1l-6.5-3.1v-6.1Z" fill="currentColor" opacity="0.78" />
        <path d="M17 19.8 23.5 16.7v6.1L17 25.9v-6.1Z" fill="currentColor" opacity="0.56" />
      </svg>
    </span>
  );
}

function NavIcon({ children }) {
  return (
    <span className="nav-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </span>
  );
}

export function AppBottomNav({ active = 'home' }) {
  const items = [
    {
      key: 'home',
      label: '首页',
      href: '/',
      icon: (
        <NavIcon>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.8V21h14V9.8" />
        </NavIcon>
      ),
    },
    {
      key: 'form',
      label: '填报',
      href: '/form',
      icon: (
        <NavIcon>
          <path d="M4 20h16" />
          <path d="M7 16.5V5.8a1.8 1.8 0 0 1 1.8-1.8h6.4A1.8 1.8 0 0 1 17 5.8v10.7" />
          <path d="m9 12 2 2 4-4" />
        </NavIcon>
      ),
    },
    {
      key: 'plans',
      label: '方案',
      href: '/plans',
      icon: (
        <NavIcon>
          <path d="M6 5h12" />
          <path d="M6 10h12" />
          <path d="M6 15h8" />
          <path d="M6 20h10" />
        </NavIcon>
      ),
    },
    {
      key: 'me',
      label: '我的',
      href: '/me',
      icon: (
        <NavIcon>
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
          <path d="M4.5 20.5a8.5 8.5 0 0 1 15 0" />
        </NavIcon>
      ),
    },
  ];

  return (
    <nav className="app-bottom-nav" aria-label="底部导航">
      {items.map((item) => {
        const selected = item.key === active;
        const className = `app-bottom-link ${selected ? 'active' : ''}`;

        return (
          <Link key={item.key} href={item.href} className={className}>
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
