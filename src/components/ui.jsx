import React from 'react';

export function Card({ title, actions, children, className = '', accent = false }) {
  return (
    <section
      className={`card ${accent ? 'border-brand-600/40 ring-1 ring-brand-600/10' : ''} ${className}`}
    >
      {(title || actions) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          <h2 className="card-title">{title}</h2>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function Field({ label, hint, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {hint && <span className="hint">{hint}</span>}
      {children}
    </div>
  );
}

export function NumberInput({ value, onChange, step = 'any', min = 0, ...rest }) {
  return (
    <input
      type="number"
      className="input"
      inputMode="decimal"
      step={step}
      min={min}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      {...rest}
    />
  );
}

export function TextInput({ value, onChange, ...rest }) {
  return (
    <input
      type="text"
      className="input"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      {...rest}
    />
  );
}

export function Select({ value, onChange, options, ...rest }) {
  return (
    <select
      className="input appearance-none pr-8"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      {...rest}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Row({ label, value, strong = false }) {
  return (
    <div className="row">
      <span className={strong ? 'text-neutral-200' : 'row-label'}>{label}</span>
      <span className={`row-value ${strong ? 'font-semibold' : ''}`}>{value}</span>
    </div>
  );
}

export function Highlight({ label, value, tone = 'brand' }) {
  const tones = {
    brand: 'border-brand-600/50 bg-brand-700/25 text-brand-400',
    gold: 'border-amber-500/40 bg-amber-600/15 text-amber-300',
  };
  return (
    <div className={`rounded-xl border px-4 py-3 ${tones[tone]}`}>
      <p className="text-[11px] font-bold uppercase tracking-widest opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-white">{value}</p>
    </div>
  );
}

export function Icon({ name, className = 'h-4 w-4' }) {
  const paths = {
    save: 'M17 21v-8H7v8M7 3v5h8M5 3h11l4 4v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z',
    refresh: 'M21 12a9 9 0 1 1-3-6.7M21 3v6h-6',
    trash: 'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14',
    plus: 'M12 5v14M5 12h14',
    sheet: 'M4 3h16v18H4V3ZM4 9h16M4 15h16M10 3v18',
    download: 'M12 3v12m0 0 4-4m-4 4-4-4M4 21h16',
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
