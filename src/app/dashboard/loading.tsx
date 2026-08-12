import { DashboardSkeleton, PageHeader, styles } from '@/components/ui';

export default function DashboardLoading() {
  return (
    <main style={styles.page}>
      <PageHeader title="Dashboard" subtitle="Loading your account summary…" />
      <DashboardSkeleton />
    </main>
  );
}
