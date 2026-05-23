export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#e9ebf5]">
      {children}
    </div>
  )
}
