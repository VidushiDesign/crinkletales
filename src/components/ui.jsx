// Core UI components. Every tappable thing goes through <Press>, so
// press feel and sound live in one place (change it here, it changes
// everywhere).

import { useEffect } from 'react';
import { Home, BookOpen, Sparkles, User, X } from 'lucide-react';
import { sound } from '../lib/sound.js';

export function Press({
  as: Tag = 'button',
  variant = 'default', // default | primary | ghost | danger | icon
  size = 'md',
  sfx = 'tap',
  className = '',
  onClick,
  children,
  ...rest
}) {
  return (
    <Tag
      type={Tag === 'button' ? 'button' : undefined}
      className={`btn btn-${variant} btn-${size} ${className}`}
      onPointerDown={() => sfx && sound[sfx]?.()}
      onClick={onClick}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function Chip({ active, children, onClick, tone, ...rest }) {
  return (
    <button
      type="button"
      className={`chip ${active ? 'is-active' : ''} ${tone ? `chip-${tone}` : ''}`}
      onPointerDown={() => sound.tap()}
      onClick={onClick}
      aria-pressed={onClick ? !!active : undefined}
      {...rest}
    >
      {children}
    </button>
  );
}

const NAV = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'journal', label: 'Journal', Icon: BookOpen },
  { id: 'insights', label: 'Insights', Icon: Sparkles },
  { id: 'you', label: 'You', Icon: User },
];

export function Nav({ current, go }) {
  return (
    <nav className="nav" aria-label="Main">
      <div className="nav-brand" aria-hidden="true">
        crinkle<span>tales</span>
      </div>
      {NAV.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`nav-item ${current === id ? 'is-active' : ''}`}
          aria-current={current === id ? 'page' : undefined}
          onPointerDown={() => sound.tap()}
          onClick={() => go(id)}
        >
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export function Sheet({ open, onClose, title, children, className = '' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`sheet ${className}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <Press variant="icon" aria-label="Close" onClick={onClose}>
            <X aria-hidden="true" />
          </Press>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

// Replaces window.confirm (blocked in some browsers and frames).
export function Confirm({ open, title, body, confirmLabel = 'Yes', danger, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="sheet-backdrop is-center" onPointerDown={(e) => e.target === e.currentTarget && onCancel?.()}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        {body ? <p>{body}</p> : null}
        <div className="dialog-actions">
          <Press variant="ghost" onClick={onCancel}>
            Cancel
          </Press>
          <Press variant={danger ? 'danger' : 'primary'} sfx={danger ? 'scrunch' : 'tap'} onClick={onConfirm}>
            {confirmLabel}
          </Press>
        </div>
      </div>
    </div>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="toast" role="status" key={toast.id}>
      {toast.text}
    </div>
  );
}

export function Empty({ title, body, action }) {
  return (
    <div className="empty">
      <div className="empty-art" aria-hidden="true">
        <span />
        <span />
      </div>
      <h3>{title}</h3>
      {body ? <p>{body}</p> : null}
      {action}
    </div>
  );
}
