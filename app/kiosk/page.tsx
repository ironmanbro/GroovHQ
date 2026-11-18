import { getMenu } from '@/lib/menu';
import KioskApp from '@/components/KioskApp';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Order here — GROOV HQ', robots: { index: false, follow: false } };

export default async function Page() { return <KioskApp menu={await getMenu()} />; }
