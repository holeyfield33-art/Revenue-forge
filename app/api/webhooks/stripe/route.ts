import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    await req.json();

    return NextResponse.json(
      {
        error: 'Stripe webhooks are not enabled yet. Configure the webhook before using billing.',
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}
