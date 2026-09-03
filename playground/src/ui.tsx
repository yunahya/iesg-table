import type { ReactNode } from 'react';

export const btn =
  'rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40';
export const btnOn = 'rounded border border-slate-900 bg-slate-900 px-2 py-1 text-white text-xs';
export const input = 'h-7 rounded border border-slate-300 px-2 text-xs';

export function Note({ children }: { children: ReactNode }) {
  return <p className='text-slate-500 text-xs leading-relaxed'>{children}</p>;
}

export function Code({ children }: { children: ReactNode }) {
  return <code className='rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] text-slate-800'>{children}</code>;
}

export function Tag({ children, tone }: { children: ReactNode; tone: 'ok' | 'warn' | 'bad' | 'info' }) {
  const tones = {
    ok: 'bg-emerald-100 text-emerald-800',
    warn: 'bg-amber-100 text-amber-800',
    bad: 'bg-rose-100 text-rose-800',
    info: 'bg-sky-100 text-sky-800',
  };
  return <span className={`rounded px-1.5 py-0.5 font-medium text-xs ${tones[tone]}`}>{children}</span>;
}

/** One row of the API table under a demo. */
export type ApiRow = [name: string, type: string, description: string];

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className='rounded-lg border border-slate-200 bg-white'>
      <h3 className='border-slate-200 border-b px-3 py-2 font-medium text-slate-700 text-xs'>{title}</h3>
      <div className='px-3 py-2.5'>{children}</div>
    </section>
  );
}

export interface DemoPageProps {
  title: string;
  /** One or two sentences: what the feature is for. */
  summary: ReactNode;
  /** The live example. */
  children: ReactNode;
  /** What a consumer can change, in plain Korean. */
  customization?: ReactNode[];
  /** Props, meta fields and helpers this feature exposes. */
  api?: ApiRow[];
  /** CSS variables this feature reads. */
  tokens?: string[];
  /** Honest limitations. Rendered only when there is something to say. */
  caveats?: ReactNode[];
}

/**
 * One feature, one page: example first, then what you can change about it.
 * The layout is deliberately identical everywhere so the eye knows where to go.
 */
export function DemoPage({ title, summary, children, customization, api, tokens, caveats }: DemoPageProps) {
  return (
    <article className='space-y-5'>
      <header>
        <h2 className='font-semibold text-slate-900 text-xl'>{title}</h2>
        <p className='mt-1 max-w-3xl text-slate-600 text-sm leading-relaxed'>{summary}</p>
      </header>

      <div className='rounded-lg border border-slate-200 bg-white p-4'>{children}</div>

      <div className='grid gap-4 xl:grid-cols-2'>
        {customization && customization.length > 0 && (
          <Panel title='커스터마이징 가능한 것'>
            <ul className='space-y-1.5 text-slate-600 text-xs leading-relaxed'>
              {customization.map((item, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static, hand-written list
                <li key={index} className='flex gap-2'>
                  <span className='text-slate-300'>—</span>
                  <span className='min-w-0'>{item}</span>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {api && api.length > 0 && (
          <Panel title='API'>
            <table className='w-full text-left text-xs'>
              <thead className='text-slate-400'>
                <tr>
                  <th className='pb-1 font-medium'>이름</th>
                  <th className='pb-1 font-medium'>타입</th>
                  <th className='pb-1 font-medium'>설명</th>
                </tr>
              </thead>
              <tbody className='align-top text-slate-600'>
                {api.map(([name, type, description]) => (
                  <tr key={name} className='border-slate-100 border-t'>
                    <td className='py-1.5 pr-3 font-mono text-[11px] text-slate-900'>{name}</td>
                    <td className='py-1.5 pr-3 font-mono text-[11px] text-slate-500'>{type}</td>
                    <td className='py-1.5'>{description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}

        {tokens && tokens.length > 0 && (
          <Panel title='이 기능이 읽는 CSS 변수'>
            <div className='flex flex-wrap gap-1.5'>
              {tokens.map((token) => (
                <code key={token} className='rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700'>
                  {token}
                </code>
              ))}
            </div>
          </Panel>
        )}

        {caveats && caveats.length > 0 && (
          <Panel title='제약'>
            <ul className='space-y-1.5 text-slate-600 text-xs leading-relaxed'>
              {caveats.map((item, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static, hand-written list
                <li key={index} className='flex gap-2'>
                  <span className='text-amber-500'>!</span>
                  <span className='min-w-0'>{item}</span>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </article>
  );
}
