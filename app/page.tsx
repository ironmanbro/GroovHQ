import { Suspense } from 'react';
import { getMenu } from '@/lib/menu';
import MenuApp from '@/components/MenuApp';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const menu = await getMenu();
  return <Suspense><MenuApp menu={menu} /></Suspense>;
}
