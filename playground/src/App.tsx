import { useEffect, useState } from 'react';
import { ThemeEditor } from './ThemeEditor';
import { ENTRIES, GROUPS, findEntry } from './registry';

/* ------------------------------------------------------------------ */
/* Routing — hash only, no router dependency                           */
/* ------------------------------------------------------------------ */

const readRoute = () => {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return ENTRIES.some((entry) => entry.id === hash) ? hash : '';
};

function useRoute(): string {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const onChange = () => {
      setRoute(readRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */

function Sidebar({ route, onNavigate }: { route: string; onNavigate: () => void }) {
  return (
    <nav aria-label='기능 목록' className='space-y-5'>
      {GROUPS.map((group) => (
        <div key={group.title}>
          <h2 className='px-2 pb-1 font-semibold text-[11px] text-slate-400 uppercase tracking-wide'>{group.title}</h2>
          <ul className='space-y-0.5'>
            {group.entries.map((entry) => {
              const active = entry.id === route;
              return (
                <li key={entry.id}>
                  <a
                    href={`#/${entry.id}`}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={`block rounded px-2 py-1.5 transition-colors ${
                      active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className='block font-medium text-sm'>{entry.label}</span>
                    <span className={`block text-[11px] ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                      {entry.hint}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

export function App() {
  const route = useRoute();
  const entry = findEntry(route);
  const { Component } = entry;
  const [menuOpen, setMenuOpen] = useState(false);
  const isDocs = entry.id === 'docs';

  return (
    <div className='min-h-screen bg-slate-50 text-slate-900'>
      <header className='sticky top-0 z-30 border-slate-200 border-b bg-white/95 backdrop-blur'>
        <div className='mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3'>
          <button
            type='button'
            className='rounded border border-slate-300 px-2 py-1 text-xs lg:hidden'
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            ☰ 메뉴
          </button>
          <a href='#/' className='font-semibold text-lg'>
            @iesg/table
          </a>
          <p className='hidden text-slate-500 text-sm sm:block'>
            Playground — <code>src/</code>를 직접 import하므로 수정하면 바로 반영됩니다.
          </p>
        </div>
      </header>

      <div className='mx-auto flex max-w-[1600px] gap-6 px-4 py-6'>
        <aside
          className={`${menuOpen ? 'block' : 'hidden'} w-56 shrink-0 lg:block`}
          // The sidebar scrolls on its own so a long demo never drags it away.
        >
          <div className='sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1'>
            <Sidebar route={route} onNavigate={() => setMenuOpen(false)} />
          </div>
        </aside>

        <main className='min-w-0 flex-1'>
          <Component />
        </main>

        {!isDocs && (
          <div className='hidden xl:block'>
            <ThemeEditor />
          </div>
        )}
      </div>
    </div>
  );
}
