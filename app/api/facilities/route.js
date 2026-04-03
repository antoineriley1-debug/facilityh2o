import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getFacilitiesByOrg, saveFacility, generateId } from '@/lib/store';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const facilities = getFacilitiesByOrg(session.orgId);
  return NextResponse.json({ facilities });
}

export async function POST(request) {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { name, address, code } = await request.json();
  if (!name) return NextResponse.json({ error: 'Name required.' }, { status: 400 });
  const facility = {
    id: generateId('fac'),
    orgId: session.orgId,
    name, address: address || null, code: code || null,
    active: true,
    createdAt: new Date().toISOString(),
  };
  saveFacility(facility);
  return NextResponse.json({ success: true, facility }, { status: 201 });
}
