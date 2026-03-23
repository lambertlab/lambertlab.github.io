import * as React from 'react'

const ADMIN_ICON_GLYPHS = {
  close: '\ueaef',
  about: '\ueaf2',
  delete: '\ueafb',
  info: '\ueafe',
  edit: '\ueaff',
  test: '\ueb00',
} as const

export type AdminIconName = keyof typeof ADMIN_ICON_GLYPHS
export type AdminIconSize = 'sm' | 'md' | 'lg' | 'xl'

type AdminIconProps = {
  name: AdminIconName
  className?: string
  label?: string
  size?: AdminIconSize | number
  title?: string
}

function joinClassNames(...values: Array<string | undefined>): string {
  return values.filter((value): value is string => Boolean(value && value.trim())).join(' ')
}

export function AdminIcon({ name, className, label, size = 'md', title }: AdminIconProps) {
  const decorative = !label
  const sizeClassName = typeof size === 'string' ? `admin-icon--${size}` : undefined
  const inlineStyle = typeof size === 'number' ? { fontSize: `${size}px` } : undefined

  return (
    <span
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
      className={joinClassNames('admin-icon', sizeClassName, className)}
      data-admin-icon={name}
      role={decorative ? undefined : 'img'}
      style={inlineStyle}
      title={title}
    >
      {ADMIN_ICON_GLYPHS[name]}
    </span>
  )
}
