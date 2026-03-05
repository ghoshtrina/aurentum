import { AMCPageClient } from './AMCPageClient';

interface Props {
  params: Promise<{ amc: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { amc } = await params;
  const amcName = decodeURIComponent(amc);
  return { title: `${amcName} Mutual Funds - Aurentum` };
}

export default async function AMCPage({ params }: Props) {
  const { amc } = await params;
  const amcName = decodeURIComponent(amc);

  return <AMCPageClient amcName={amcName} />;
}
