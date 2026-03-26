import { HaulerNavbar } from '@/components/ui/navigation/HaulerNavbar';

type LayoutParams = { id: string };

export default async function HaulerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<LayoutParams>;
}) {
  const { id } = await params;

  return (
    <>
      <HaulerNavbar userId={id} />
      {children}
    </>
  );
}
