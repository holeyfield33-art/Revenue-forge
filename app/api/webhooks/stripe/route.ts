import { NextRequest, NextResponse } from 'next/server';

// Placeholder for Stripe webhook handler
// Full implementation in Phase 2: Stripe Integration

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // TODO: Verify Stripe signature
    // const signature = req.headers.get('stripe-signature');
    // if (!verifyStripeSignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const event = body;

    switch (event.type) {
      case 'checkout.session.completed': {
        // Handle successful payment
        const session = event.data.object;
        const customerId = session.customer;
        
        // TODO: Update user profile with tier upgrade
        // import { createServerClient_ } from '@/lib/supabase/server';
        // const supabase = await createServerClient_();
        // const { error } = await supabase
        //   .from('profiles')
        //   .update({ tier: 'pro', stripe_customer_id: customerId })
        //   .eq('stripe_customer_id', customerId);

        console.log('Payment completed:', customerId);
        break;
      }

      case 'customer.subscription.deleted': {
        // Handle subscription cancellation
        const subscription = event.data.object;
        
        // TODO: Downgrade user to free tier
        // const supabase = await createServerClient_();
        // const { error } = await supabase
        //   .from('profiles')
        //   .update({ tier: 'free' })
        //   .eq('stripe_customer_id', subscription.customer);

        console.log('Subscription cancelled:', subscription.customer);
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}
