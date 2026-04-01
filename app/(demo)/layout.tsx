export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div data-theme="demo" style={{ isolation: 'isolate' }}>
      {children}
    </div>
  )
}
