import Image from 'next/image'

type BrandLogoProps = {
  className?: string
  imageClassName?: string
  priority?: boolean
  compact?: boolean
}

export function BrandLogo({ className = '', imageClassName = '', priority = false, compact = false }: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center justify-center overflow-hidden ${compact ? 'rounded-2xl bg-white shadow-sm ring-1 ring-slate-100' : ''} ${className}`}>
      <Image
        src={compact ? '/brand/fabb-icon-180.png' : '/brand/fabb-logo.png'}
        alt="Fabb"
        width={compact ? 96 : 180}
        height={compact ? 96 : 86}
        priority={priority}
        className={`h-full w-full object-contain ${compact ? 'p-1.5' : ''} ${imageClassName}`}
      />
    </span>
  )
}
