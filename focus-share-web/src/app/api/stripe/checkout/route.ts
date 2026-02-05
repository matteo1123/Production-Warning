import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

// Lazy initialization to avoid build-time errors
let stripe: Stripe | null = null;
let convex: ConvexHttpClient | null = null;

function getStripe(): Stripe {
    if (!stripe) {
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2026-01-28.clover',
        });
    }
    return stripe;
}

function getConvex(): ConvexHttpClient {
    if (!convex) {
        convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    }
    return convex;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, name } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        const stripeClient = getStripe();
        const convexClient = getConvex();

        // Premium subscription price
        const PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID!;

        // Ensure user exists in our database
        await convexClient.mutation(api.users.getOrCreateUser, { email, name });

        // Create Stripe checkout session
        const session = await stripeClient.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer_email: email,
            line_items: [
                {
                    price: PREMIUM_PRICE_ID,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancel`,
            metadata: {
                user_email: email,
            },
        });

        return NextResponse.json({
            sessionId: session.id,
            url: session.url,
        });

    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
