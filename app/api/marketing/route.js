import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMarketingData } from '@/lib/sheets';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await getMarketingData();
    return Response.json({ data });
  } catch (e) {
    console.error('marketing API error:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
