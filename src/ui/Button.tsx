import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ice text-ink-950 hover:bg-white shadow-[0_0_24px_-6px] shadow-ice/60',
  secondary: 'bg-ink-700 text-white hover:bg-ink-600 border border-ink-600',
  ghost: 'text-ink-200 hover:bg-ink-700/60',
  danger: 'bg-red-500/15 text-red-300 border border-red-500/40 hover:bg-red-500/25',
};

export function buttonClass(variant: Variant = 'secondary', extra = ''): string {
  return `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${extra}`;
}

export function Button({
  variant = 'secondary',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({
  variant = 'secondary',
  className = '',
  ...props
}: LinkProps & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}
