import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, ReactNode, Ref } from 'react';
import './Login.css';

interface LoginProps {
  onEnter: (nickname: string, isGuest: boolean) => void;
}

interface Account {
  name: string;
  email: string;
  salt: string;
  hash: string;
}
type Accounts = Record<string, Account>;
type Status = 'idle' | 'loading' | 'success';
type ModalKind = null | 'register' | 'forgot';
type FormErrors = Partial<Record<'username' | 'email' | 'password' | 'confirm', string>>;

const ACCOUNTS_KEY = 'rage-arcade-accounts-v1';
const REMEMBER_KEY = 'rage-arcade-remembered-name';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HASH_ERROR = 'Secure hashing is not available here. Use localhost or https.';

/* ---------- storage + hashing helpers ---------- */
function loadAccounts(): Accounts {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as Accounts) : {};
  } catch {
    return {};
  }
}
function saveAccounts(accounts: Accounts): boolean {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    return true;
  } catch {
    return false;
  }
}
function readRemembered(): string {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? '';
  } catch {
    return '';
  }
}
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
function newSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}
async function hashPassword(salt: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(new Uint8Array(digest));
}
function findKey(accounts: Accounts, id: string): string | null {
  const wanted = id.trim().toLowerCase();
  if (!wanted) return null;
  if (accounts[wanted]) return wanted;
  for (const key of Object.keys(accounts)) {
    if (accounts[key].email.toLowerCase() === wanted) return key;
  }
  return null;
}

/* ---------- small icons ---------- */
const iconProps = {
  viewBox: '0 0 24 24',
  className: 'lg-icon',
  'aria-hidden': true,
} as const;

function UserIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg {...iconProps}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg {...iconProps}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {off && <line x1="3" y1="3" x2="21" y2="21" />}
    </svg>
  );
}
function CrownIcon() {
  return (
    <svg className="lg-crown" viewBox="0 0 64 44" aria-hidden="true">
      <path d="M6 38 L2 10 L18 22 L32 4 L46 22 L62 10 L58 38 Z" />
      <line x1="10" y1="42" x2="54" y2="42" />
    </svg>
  );
}
function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="lg-google-icon" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

/* ---------- animated background scene ---------- */
const FAR: [number, number, number][] = [
  [0, 90, 230], [80, 70, 300], [140, 100, 200], [230, 60, 340], [280, 110, 260],
  [380, 80, 380], [450, 90, 240], [530, 70, 320], [590, 120, 210], [700, 60, 360],
  [750, 100, 280], [850, 80, 400], [920, 90, 250], [1000, 70, 330], [1060, 110, 220],
  [1170, 60, 370], [1220, 100, 290], [1310, 80, 240], [1380, 90, 350], [1460, 140, 260],
];
const NEAR: [number, number, number][] = [
  [-20, 140, 150], [100, 90, 210], [190, 120, 120], [300, 70, 260], [370, 140, 140],
  [500, 80, 190], [580, 110, 110], [700, 90, 230], [790, 130, 130], [920, 80, 200],
  [1000, 120, 120], [1110, 90, 250], [1200, 130, 140], [1330, 80, 210], [1410, 120, 120],
  [1520, 100, 180],
];
const EMBERS = Array.from({ length: 24 }, (_, i) => i);

function Scene() {
  return (
    <div className="lg-scene" aria-hidden="true">
      <div className="lg-moon" />
      <svg className="lg-skyline" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice">
        <defs>
          <pattern id="lgWinC" width="10" height="14" patternUnits="userSpaceOnUse">
            <rect x="3" y="4" width="3" height="4" fill="#19e3ff" />
          </pattern>
          <pattern id="lgWinR" width="10" height="14" patternUnits="userSpaceOnUse">
            <rect x="3" y="4" width="3" height="4" fill="#ff2d3d" />
          </pattern>
        </defs>
        {FAR.map(([x, w, h], i) => (
          <g key={`f${i}`}>
            <rect x={x} y={600 - h} width={w} height={h} fill="#0b1830" />
            <rect x={x} y={600 - h} width={w} height={h} fill="url(#lgWinC)" opacity="0.35" />
          </g>
        ))}
        {NEAR.map(([x, w, h], i) => (
          <g key={`n${i}`}>
            <rect x={x} y={600 - h} width={w} height={h} fill="#04070f" />
            <rect
              x={x}
              y={600 - h}
              width={w}
              height={h}
              fill={i % 2 === 0 ? 'url(#lgWinR)' : 'url(#lgWinC)'}
              opacity="0.55"
            />
          </g>
        ))}
      </svg>
      <div className="lg-sign">RAGE</div>
      <div className="lg-banner">
        GOOD GAMES
        <br />
        BAD HABITS
      </div>
      <div className="lg-photo" />
      <div className="lg-fog" />
      {EMBERS.map((i) => (
        <span
          key={i}
          className="lg-ember"
          style={
            {
              left: `${(i * 37 + 11) % 100}%`,
              animationDelay: `${(i * 0.73) % 9}s`,
              animationDuration: `${7 + (i % 5) * 2}s`,
              '--dx': `${((i % 7) - 3) * 18}px`,
            } as CSSProperties
          }
        />
      ))}
      <div className="lg-shade" />
      <div className="lg-scan" />
    </div>
  );
}

/* ---------- reusable field ---------- */
interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  disabled?: boolean;
  maxLength?: number;
  showLabel?: boolean;
  trailing?: ReactNode;
  inputRef?: Ref<HTMLInputElement>;
}

function Field({
  id,
  label,
  value,
  onChange,
  icon,
  type = 'text',
  placeholder,
  autoComplete,
  error,
  disabled,
  maxLength,
  showLabel,
  trailing,
  inputRef,
}: FieldProps) {
  return (
    <div className="lg-group">
      <label htmlFor={id} className={showLabel ? 'lg-label' : 'lg-sr'}>
        {label}
      </label>
      <div className={`lg-field ${error ? 'is-error' : ''}`}>
        {icon}
        <input
          id={id}
          ref={inputRef}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        {trailing}
      </div>
      {error && (
        <p id={`${id}-err`} className="lg-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* ---------- modal shell ---------- */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    boxRef.current?.querySelector<HTMLInputElement>('input')?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !boxRef.current) return;
      const items = Array.from(
        boxRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])'),
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, []);

  return (
    <div
      className="lg-modal-back"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="lg-modal" role="dialog" aria-modal="true" aria-labelledby="lg-modal-title" ref={boxRef}>
        <h2 id="lg-modal-title" className="lg-modal-title">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

/* ---------- create account ---------- */
function RegisterForm({ onDone, onCancel }: { onDone: (name: string) => void; onCancel: () => void }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const errs: FormErrors = {};
    const name = username.trim();
    const mail = email.trim();
    const accounts = loadAccounts();

    if (!name) errs.username = 'Choose a player name.';
    else if (name.length < 2 || name.length > 16) errs.username = 'Use 2 to 16 characters.';
    else if (!/^[A-Za-z0-9_ -]+$/.test(name)) errs.username = 'Letters, numbers, spaces, _ and - only.';
    else if (accounts[name.toLowerCase()]) errs.username = 'That name is taken on this device.';

    if (!mail) errs.email = 'Enter your email.';
    else if (!EMAIL_RE.test(mail)) errs.email = 'That email looks wrong.';
    else if (Object.values(accounts).some((a) => a.email.toLowerCase() === mail.toLowerCase()))
      errs.email = 'That email is already registered here.';

    if (password.length < 6) errs.password = 'At least 6 characters.';
    if (confirm !== password) errs.confirm = 'Passwords do not match.';

    setErrors(errs);
    setFormError('');
    if (Object.keys(errs).length > 0) return;

    setBusy(true);
    try {
      const salt = newSalt();
      const hash = await hashPassword(salt, password);
      accounts[name.toLowerCase()] = { name, email: mail, salt, hash };
      if (!saveAccounts(accounts)) {
        setFormError('Could not save. Is browser storage blocked?');
        setBusy(false);
        return;
      }
      onDone(name);
    } catch {
      setFormError(HASH_ERROR);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <p className="lg-modal-note">Accounts are saved on this device only. No email is ever sent.</p>
      <Field id="rg-name" label="Player name" showLabel value={username} onChange={setUsername}
        icon={<UserIcon />} placeholder="Your legend's name" autoComplete="username"
        maxLength={16} error={errors.username} disabled={busy} />
      <Field id="rg-mail" label="Email" showLabel value={email} onChange={setEmail}
        icon={<MailIcon />} type="email" placeholder="you@example.com" autoComplete="email"
        error={errors.email} disabled={busy} />
      <Field id="rg-pass" label="Password" showLabel value={password} onChange={setPassword}
        icon={<LockIcon />} type="password" placeholder="At least 6 characters"
        autoComplete="new-password" error={errors.password} disabled={busy} />
      <Field id="rg-conf" label="Confirm password" showLabel value={confirm} onChange={setConfirm}
        icon={<LockIcon />} type="password" placeholder="Type it again"
        autoComplete="new-password" error={errors.confirm} disabled={busy} />
      {formError && (
        <p className="lg-error lg-form-error" role="alert">
          {formError}
        </p>
      )}
      <div className="lg-btn-row">
        <button type="button" className="lg-btn lg-btn-ghost" onClick={onCancel} disabled={busy}>
          CANCEL
        </button>
        <button type="submit" className="lg-btn lg-btn-cyan" disabled={busy}>
          {busy ? 'SAVING...' : 'CREATE LEGEND'}
        </button>
      </div>
    </form>
  );
}

/* ---------- forgot password (local demo reset) ---------- */
function ForgotForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const errs: FormErrors = {};
    const accounts = loadAccounts();
    const key = findKey(accounts, identifier);

    if (!identifier.trim()) errs.username = 'Enter your username or email.';
    else if (!key) errs.username = 'No player found with that name or email.';
    if (password.length < 6) errs.password = 'At least 6 characters.';
    if (confirm !== password) errs.confirm = 'Passwords do not match.';

    setErrors(errs);
    setFormError('');
    if (Object.keys(errs).length > 0 || !key) return;

    setBusy(true);
    try {
      const salt = newSalt();
      const hash = await hashPassword(salt, password);
      accounts[key] = { ...accounts[key], salt, hash };
      if (!saveAccounts(accounts)) {
        setFormError('Could not save. Is browser storage blocked?');
        setBusy(false);
        return;
      }
      onDone();
    } catch {
      setFormError(HASH_ERROR);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <p className="lg-modal-note">
        Demo reset: there is no email service, so you can set a new password right here for accounts on this
        device.
      </p>
      <Field id="fg-id" label="Username or email" showLabel value={identifier} onChange={setIdentifier}
        icon={<UserIcon />} placeholder="Email or Username" autoComplete="username"
        error={errors.username} disabled={busy} />
      <Field id="fg-pass" label="New password" showLabel value={password} onChange={setPassword}
        icon={<LockIcon />} type="password" placeholder="At least 6 characters"
        autoComplete="new-password" error={errors.password} disabled={busy} />
      <Field id="fg-conf" label="Confirm new password" showLabel value={confirm} onChange={setConfirm}
        icon={<LockIcon />} type="password" placeholder="Type it again"
        autoComplete="new-password" error={errors.confirm} disabled={busy} />
      {formError && (
        <p className="lg-error lg-form-error" role="alert">
          {formError}
        </p>
      )}
      <div className="lg-btn-row">
        <button type="button" className="lg-btn lg-btn-ghost" onClick={onCancel} disabled={busy}>
          CANCEL
        </button>
        <button type="submit" className="lg-btn lg-btn-cyan" disabled={busy}>
          {busy ? 'SAVING...' : 'SET PASSWORD'}
        </button>
      </div>
    </form>
  );
}

/* ---------- main login screen ---------- */
export default function Login({ onEnter }: LoginProps) {
  const [identifier, setIdentifier] = useState<string>(readRemembered);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState<boolean>(() => readRemembered() !== '');
  const [idError, setIdError] = useState('');
  const [pwError, setPwError] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [modal, setModal] = useState<ModalKind>(null);

  const idRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((t) => window.clearTimeout(t));
  }, []);

  const busy = status !== 'idle';

  function finish(name: string, guest: boolean) {
    setStatus('success');
    const t = window.setTimeout(() => onEnter(name, guest), 650);
    timers.current.push(t);
  }

  function fail(message: string) {
    setStatus('idle');
    setFormError(message);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;

    const id = identifier.trim();
    let idMsg = '';
    let pwMsg = '';
    if (!id) idMsg = 'Enter your username or email.';
    else if (id.includes('@') && !EMAIL_RE.test(id)) idMsg = 'That email looks wrong.';
    if (!password) pwMsg = 'Enter your password.';

    setIdError(idMsg);
    setPwError(pwMsg);
    setFormError('');
    setNotice('');
    if (idMsg) {
      idRef.current?.focus();
      return;
    }
    if (pwMsg) {
      passRef.current?.focus();
      return;
    }

    setStatus('loading');
    try {
      const accounts = loadAccounts();
      const key = findKey(accounts, id);
      if (!key) {
        fail('No player found. Create an account or play as guest.');
        return;
      }
      const account = accounts[key];
      const hash = await hashPassword(account.salt, password);
      if (hash !== account.hash) {
        fail('Wrong password. Try again.');
        return;
      }
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, id);
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        /* storage blocked: ignore */
      }
      finish(account.name, false);
    } catch {
      fail(HASH_ERROR);
    }
  }

  function handleGuest() {
    if (busy) return;
    setIdError('');
    setPwError('');
    setFormError('');
    setNotice('');
    setStatus('loading');
    const t = window.setTimeout(() => finish('Guest', true), 600);
    timers.current.push(t);
  }

  function closeModal() {
    setModal(null);
  }

  function handleRegistered(name: string) {
    setIdentifier(name);
    setPassword('');
    setModal(null);
    setFormError('');
    setNotice('Account created. Enter your password to log in.');
    window.setTimeout(() => passRef.current?.focus(), 50);
  }

  function handleReset() {
    setModal(null);
    setFormError('');
    setNotice('Password updated. You can log in now.');
    window.setTimeout(() => passRef.current?.focus(), 50);
  }

  const statusText =
    status === 'loading' ? 'AUTHENTICATING...' : status === 'success' ? 'ACCESS GRANTED' : '';

  return (
    <main className="lg">
      <Scene />

      <div className="lg-hud lg-hud-tl">
        <p className="lg-online">
          <span className="lg-dot" /> ARCADE SYSTEM ONLINE
        </p>
        <p>PLAYER ID : 0001</p>
        <p>VERSION 01.0</p>
      </div>
      <p className="lg-hud lg-hud-tr" aria-hidden="true">
        PLAY // COMPETE // CREATE // RAGE
      </p>

      <header className="lg-head">
        <CrownIcon />
        <h1 className="lg-title">
          <span className="lg-t-cyan">RAGE</span> <span className="lg-t-red">ARCADE</span>
        </h1>
        <p className="lg-tagline">
          <span aria-hidden="true">///</span> ENTER THE CHAOS. OWN THE GAME. <span aria-hidden="true">///</span>
        </p>
      </header>

      <div className="lg-cardwrap">
        <section className="lg-card" aria-labelledby="lg-heading">
          <div className="lg-card-in">
            <span className="lg-diamond" aria-hidden="true" />
            <h2 id="lg-heading" className="lg-heading">
              PLAYER AUTHENTICATION
            </h2>
            <p className="lg-sub">Your next rage session begins here.</p>

            <form onSubmit={handleSubmit} noValidate>
              <Field
                id="lg-id"
                label="Email or username"
                value={identifier}
                onChange={(v) => {
                  setIdentifier(v);
                  setIdError('');
                  setFormError('');
                }}
                icon={<UserIcon />}
                placeholder="Email or Username"
                autoComplete="username"
                error={idError}
                disabled={busy}
                inputRef={idRef}
              />
              <Field
                id="lg-pw"
                label="Password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(v) => {
                  setPassword(v);
                  setPwError('');
                  setFormError('');
                }}
                icon={<LockIcon />}
                placeholder="Password"
                autoComplete="current-password"
                error={pwError}
                disabled={busy}
                inputRef={passRef}
                trailing={
                  <button
                    type="button"
                    className="lg-eye"
                    onClick={() => setShowPass((s) => !s)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    aria-pressed={showPass}
                    disabled={busy}
                  >
                    <EyeIcon off={showPass} />
                  </button>
                }
              />

              <div className="lg-row">
                <label className="lg-check">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    disabled={busy}
                  />
                  <span className="lg-check-box" aria-hidden="true" />
                  Remember me
                </label>
                <button type="button" className="lg-link" onClick={() => setModal('forgot')} disabled={busy}>
                  Forgot Password?
                </button>
              </div>

              {formError && (
                <p className="lg-error lg-form-error" role="alert">
                  {formError}
                </p>
              )}
              {notice && (
                <p className="lg-notice" role="status">
                  {notice}
                </p>
              )}

              <button type="submit" className={`lg-main ${status === 'success' ? 'is-success' : ''}`} disabled={busy}>
                <span className="lg-chev" aria-hidden="true">
                  &laquo;
                </span>
                <span>{status === 'idle' ? 'LOGIN' : statusText}</span>
                <span className="lg-chev" aria-hidden="true">
                  &raquo;
                </span>
              </button>

              <button type="button" className="lg-alt" onClick={() => setModal('register')} disabled={busy}>
                <span className="lg-chev" aria-hidden="true">
                  &laquo;
                </span>
                <span>CREATE ACCOUNT</span>
                <span className="lg-chev" aria-hidden="true">
                  &raquo;
                </span>
              </button>

              <div className="lg-or" aria-hidden="true">
                <span>OR CONTINUE WITH</span>
              </div>

              <button type="button" className="lg-google" disabled aria-describedby="lg-google-note">
                <GoogleIcon />
                <span>Sign in with Google</span>
              </button>
              <p id="lg-google-note" className="lg-tiny">
                Google sign-in needs a Google Cloud setup, so it is switched off in this demo.
              </p>

              <button type="button" className="lg-guest" onClick={handleGuest} disabled={busy}>
                PLAY AS GUEST
              </button>
            </form>

            <p className="lg-foot">
              NEW PLAYER?{' '}
              <button type="button" className="lg-link lg-link-strong" onClick={() => setModal('register')} disabled={busy}>
                CREATE YOUR LEGEND.
              </button>
            </p>
            <p className="lg-tiny">Demo mode: accounts and progress stay on this device.</p>
          </div>
        </section>
      </div>

      <aside className="lg-hud lg-panel" aria-label="System status">
        <p className="lg-panel-title">SYSTEM STATUS</p>
        <p>
          <span>SERVER</span>
          <strong className="lg-ok">ONLINE</strong>
        </p>
        <p>
          <span>GAMES</span>
          <strong>4</strong>
        </p>
        <p>
          <span>FINAL BOSS</span>
          <strong>1</strong>
        </p>
        <p>
          <span>MODE</span>
          <strong>DEMO</strong>
        </p>
      </aside>

      <footer className="lg-footer">RAGE ARCADE &nbsp;//&nbsp; UNLEASH YOUR INNER CHAOS.</footer>

      {modal === 'register' && (
        <Modal title="CREATE YOUR LEGEND" onClose={closeModal}>
          <RegisterForm onDone={handleRegistered} onCancel={closeModal} />
        </Modal>
      )}
      {modal === 'forgot' && (
        <Modal title="RESET PASSWORD" onClose={closeModal}>
          <ForgotForm onDone={handleReset} onCancel={closeModal} />
        </Modal>
      )}
    </main>
  );
}