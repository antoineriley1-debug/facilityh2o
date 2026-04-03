import { NextResponse } from 'next/server';
import { getSession, canAccessFacility } from '@/lib/auth';
import { getEntriesByOrg, saveEntry, saveAlert, generateId, getFacilitiesByOrg } from '@/lib/store';
import { getOutOfRangeParams } from '@/lib/chemistryRanges';

export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const facilityFilter = searchParams.get('facility');
  const systemFilter = searchParams.get('system');
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');

  let entries = getEntriesByOrg(session.orgId);

  if (facilityFilter) entries = entries.filter(e => e.facilityId === facilityFilter);
  if (systemFilter) entries = entries.filter(e => e.system === systemFilter);
  if (fromDate) entries = entries.filter(e => e.date >= fromDate);
  if (toDate) entries = entries.filter(e => e.date <= toDate);

  entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return NextResponse.json({ entries });
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { facilityId, system, shift, date, time, testerName, operatorName, values, notes } = body;

    if (!facilityId || !system || !shift || !date || !operatorName || !values) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    if (!canAccessFacility(session, facilityId)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const entry = {
      id: generateId('ent'),
      orgId: session.orgId,
      facilityId, system, shift, date, time: time || null,
      testerName: testerName || null,
      operatorName, values, notes: notes || null,
      hasAlerts: false,
      createdAt: new Date().toISOString(),
    };

    const oor = getOutOfRangeParams(system, values);
    if (oor.length > 0) {
      entry.hasAlerts = true;
      const alert = {
        id: generateId('alt'),
        orgId: session.orgId,
        facilityId, system, shift, date,
        testerName: testerName || null,
        operatorName,
        outOfRange: oor,
        acknowledged: false,
        createdAt: new Date().toISOString(),
      };
      saveAlert(alert);

      // Email alert (graceful fallback)
      if (process.env.RESEND_API_KEY && process.env.ALERT_EMAIL_TO) {
        try {
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          const paramList = oor.map(p => `${p.label}: ${p.value}${p.unit} (range: ${p.min}–${p.max})`).join('\n');
          await resend.emails.send({
            from: 'FacilityH2O <alerts@facilityh2o.com>',
            to: process.env.ALERT_EMAIL_TO,
            subject: `⚠️ Out-of-Range Alert — ${facilityId} ${system} ${shift}`,
            text: `Out-of-range values detected:\n\n${paramList}\n\nLogged by ${operatorName} on ${date}.`,
          });
        } catch (e) {
          console.warn('Email alert failed:', e.message);
        }
      }
    }

    saveEntry(entry);
    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
