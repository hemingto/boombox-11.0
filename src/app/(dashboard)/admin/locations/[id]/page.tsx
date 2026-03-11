import { AdminLocationEditPage } from '@/components/features/admin/pages';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LocationEditPage({ params }: Props) {
  const { id } = await params;
  return <AdminLocationEditPage locationId={id} />;
}
