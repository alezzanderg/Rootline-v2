export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-background px-4 py-16 text-foreground sm:px-6">
      <main className="mx-auto flex min-h-[70vh] max-w-md items-center">{children}</main>
    </div>
  )
}
