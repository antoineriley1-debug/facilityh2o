import { NextResponse } from 'next/server';
import { validateCredentials, createSessionToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const user = validateCredentials(username.trim(), password);
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = createSessionToken(user);

    const cookieStore = cookies();
    cookieStore.set('facilityh2o_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        orgId: user.orgId,
        facilities: user.facilities,
      },
    });
  } catch (err) {
    console.error('[auth] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
