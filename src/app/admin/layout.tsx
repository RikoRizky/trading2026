import AdminShell from './_components/AdminShell';

export const metadata = {
  title: 'Admin Dashboard | TradingPlatform',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}

