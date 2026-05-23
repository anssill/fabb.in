import Image from 'next/image'

type BrandLogoProps = {
  className?: string
  imageClassName?: string
  priority?: boolean
}

export function BrandLogo({ className = '', imageClassName = '', priority = false }: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 ${className}`}>
      <Image
        src="/brand/fabb-logo.png"
        alt="Fabb"
        width={96}
        height={96}
        priority={priority}
        className={`h-full w-full object-contain p-1.5 ${imageClassName}`}
      />
    </span>
  )
}
