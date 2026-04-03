import { NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { getAlertsByOrg, acknowledgeAlert } from '@/lib/store';

export async function GET() {
  const session = await getSession();
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const alerts = getAlertsByOrg(session.orgId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return NextResponse.json({ alerts });
}

export async function PATCH(request) {
  const session = await getSession();
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await request.json();
  acknowledgeAlert(id);
  return NextResponse.json({ success: true });
}
