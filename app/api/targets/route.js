import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTargets, upsertTarget, ensureTargetsSheetExists } from '@/lib/sheets';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await ensureTargetsSheetExists();
    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get('year'));
    const month = Number(searchParams.get('month'));
    const targets = await getTargets(year, month);
    return Response.json({ targets });
  } catch (err) {
    console.error('[targets GET]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureTargetsSheetExists();
    const { year, month, targets } = await request.json();
    await Promise.all(
      targets.map(t => upsertTarget(year, month, t.country, t.targetBookings, t.targetAvgSpend, t.memo))
    );
    return Response.json({ success: true });
  } catch (err) {
    console.error('[targets POST]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
