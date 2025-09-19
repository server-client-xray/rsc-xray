'use client';

interface ButtonProps {
  label: string;
}

export default function Button({ label }: ButtonProps) {
  return <button type="button">{label}</button>;
}
