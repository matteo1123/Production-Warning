import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia',
});

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Stripe webhook secret
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const email = session.customer_email || session.metadata?.user_email;

            if (email) {
                await convex.mutation(api.users.updateSubscription, {
                    email,
                    tier: 'premium',
                    stripeCustomerId: session.customer as string,
                    stripeSubscriptionId: session.subscription as string,
                    subscriptionStatus: 'active',
                });
                console.log(`Activated premium for ${email}`);
            }
            break;
        }

        case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;

            // Get user by customer ID
            const user = await convex.query(api.users.getUserByStripeCustomerId, {
                stripeCustomerId: customerId,
            });

            if (user) {
                const status = subscription.status;
                const tier = status === 'active' ? 'premium' : 'free';

                await convex.mutation(api.users.updateSubscription, {
                    email: user.email,
                    tier,
                    subscriptionStatus: status,
                    subscriptionEndsAt: subscription.current_period_end * 1000,
                });
                console.log(`Updated subscription for ${user.email}: ${status}`);
            }
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;

            const user = await convex.query(api.users.getUserByStripeCustomerId, {
                stripeCustomerId: customerId,
            });

            if (user) {
                await convex.mutation(api.users.updateSubscription, {
                    email: user.email,
                    tier: 'free',
                    subscriptionStatus: 'canceled',
                    subscriptionEndsAt: subscription.current_period_end * 1000,
                });
                console.log(`Canceled subscription for ${user.email}`);
            }
            break;
        }

        case 'invoice.payment_failed': {
            const invoice = event.data.object as Stripe.Invoice;
            const customerId = invoice.customer as string;

            const user = await convex.query(api.users.getUserByStripeCustomerId, {
                stripeCustomerId: customerId,
            });

            if (user) {
                await convex.mutation(api.users.updateSubscription, {
                    email: user.email,
                    tier: user.tier, // Keep current tier
                    subscriptionStatus: 'past_due',
                });
                console.log(`Payment failed for ${user.email}`);
            }
            break;
        }

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
