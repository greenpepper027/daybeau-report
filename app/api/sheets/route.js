import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDailyData } from '@/lib/sheets';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end   = searchParams.get('end');

  if (!start || !end) {
    return Response.json({ error: 'start and end are required' }, { status: 400 });
  }

  try {
    const data = await getDailyData(start, end);
    return Response.json({ data });
  } catch (e) {
    console.error('sheets API error:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
