import { cookies } from 'next/headers';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { ROOMS } from '@/lib/content';
import { SESSION_COOKIE, verifySession } from '@/lib/cms/session';
import { configured, URL_ENDPOINT } from '@/lib/cms/imagekit';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = (await verifySession((await cookies()).get(SESSION_COOKIE)?.value)) ?? '';
  return (
    <AdminDashboard
      user={user}
      ready={configured()}
      urlEndpoint={URL_ENDPOINT}
      crafts={ROOMS.map(r => ({ key: r.key, name: r.nav }))}
    />
  );
}
