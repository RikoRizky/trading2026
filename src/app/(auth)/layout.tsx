export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to right, #2C3E50, #4CA1AF, #2C3E50)' }}>
      {children}
    </div>
  );
}


