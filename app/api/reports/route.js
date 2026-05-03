import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getReportData } from '@/lib/sheets';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get('year')) || new Date().getFullYear();

  try {
    const data = await getReportData(year);
    return Response.json({ data });
  } catch (e) {
    console.error('reports API error:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
