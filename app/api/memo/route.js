import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMonthlyMemo, saveMonthlyMemo, ensureMemosSheetExists } from '@/lib/sheets';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await ensureMemosSheetExists();
    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get('year'));
    const month = Number(searchParams.get('month'));
    const content = await getMonthlyMemo(year, month);
    return Response.json({ content });
  } catch (err) {
    console.error('[memo GET]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'editor'].includes(session.user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureMemosSheetExists();
    const { year, month, content } = await request.json();
    await saveMonthlyMemo(year, month, content);
    return Response.json({ success: true });
  } catch (err) {
    console.error('[memo POST]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
