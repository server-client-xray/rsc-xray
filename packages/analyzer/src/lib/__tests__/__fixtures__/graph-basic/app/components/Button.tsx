'use client';

export interface ButtonProps {
  label: string;
}

export default function Button({ label }: ButtonProps) {
  // Return a string literal instead of JSX to avoid pulling React types in fixtures.
  return `button:${label}`;
}
