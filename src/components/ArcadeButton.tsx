import type { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost' | 'normal';
}

export default function ArcadeButton({
  variant = 'normal',
  className = '',
  type = 'button',
  ...rest
}: Props) {
  const v = variant === 'normal' ? '' : `arc-${variant}`;
  return <button type={type} className={`arc-btn ${v} ${className}`} {...rest} />;
}