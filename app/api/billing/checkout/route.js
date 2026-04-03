import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { PLANS } from '@/lib/stripe';

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { plan } = await request.json();

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Billing not configured. Contact support.' }, { status: 503 });
  }

  try {
    const { stripe } = await import('@/lib/stripe');
    const planConfig = PLANS[plan];
    if (!planConfig) return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?billing=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?billing=cancelled`,
      metadata: { orgId: session.orgId, plan },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
