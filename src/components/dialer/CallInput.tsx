// components/dialer/CallInput.tsx
import { Input } from '@/components/ui/input'

interface Props {
  value: string
  onChange: (v: string) => void
  disabled: boolean
  onEnter: () => void
}

export function CallInput({ value, onChange, disabled, onEnter }: Props) {
  return (
    <Input
      type="tel"
      placeholder="+1 (555) 123‑4567"
      value={value}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && onEnter()}
      className="flex-1"
    />
  )
}
