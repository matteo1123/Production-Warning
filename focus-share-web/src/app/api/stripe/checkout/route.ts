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

// Premium subscription price
const PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID!;

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

        // Ensure user exists in our database
        await convex.mutation(api.users.getOrCreateUser, { email, name });

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
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
