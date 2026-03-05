import { CategoryPageClient } from './CategoryPageClient';

interface Props {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const category = decodeURIComponent(slug[0] ?? '');
  const subCategory = slug[1] ? decodeURIComponent(slug[1]) : undefined;
  const title = subCategory ? `${subCategory} - ${category}` : category;
  return { title: `${title} Mutual Funds - Aurentum` };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = decodeURIComponent(slug[0] ?? '');
  const subCategory = slug[1] ? decodeURIComponent(slug[1]) : undefined;

  return <CategoryPageClient category={category} subCategory={subCategory} />;
}
