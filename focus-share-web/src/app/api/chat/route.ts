import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Model selection based on tier
const MODELS = {
    free: 'gemini-2.0-flash-lite',
    premium: 'gemini-2.0-flash'
};

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { question, content, focusName, tabCount, userEmail } = body;

        // Validate required fields
        if (!question || !content) {
            return NextResponse.json(
                { error: 'Missing required fields: question and content' },
                { status: 400 }
            );
        }

        // Get API key from environment
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY not configured');
            return NextResponse.json(
                { error: 'AI service not configured. Please contact support.' },
                { status: 500 }
            );
        }

        // Check user tier and usage limits
        let userTier = 'free';
        if (userEmail) {
            try {
                // Check usage limits
                const usageResult = await convex.mutation(api.users.incrementChatUsage, {
                    email: userEmail,
                });

                if (!usageResult.allowed) {
                    return NextResponse.json(
                        {
                            error: usageResult.message || 'Monthly query limit reached.',
                            remaining: 0,
                            upgradeRequired: userTier === 'free',
                        },
                        {
                            status: 429,
                            headers: {
                                'Access-Control-Allow-Origin': '*',
                            },
                        }
                    );
                }

                // Get user tier for model selection
                const tierResult = await convex.query(api.users.getUserTier, {
                    email: userEmail,
                });
                userTier = tierResult.tier;
            } catch (err) {
                console.warn('Could not check user tier:', err);
                // Continue with free tier
            }
        }

        const model = MODELS[userTier as keyof typeof MODELS];

        // Build the prompt
        const systemPrompt = `You are a helpful assistant that answers questions based on the content of web pages the user has open in their browser. 

The user is currently focused on a topic called "${focusName || 'General'}" and has ${tabCount || 'multiple'} tabs open.

Based on the content from their open tabs provided below, answer their question concisely and accurately. If the content doesn't contain information relevant to their question, say so.

Focus on being:
- Accurate and factual based on the provided content
- Concise (aim for 2-4 sentences unless more detail is needed)
- Helpful and direct

CONTENT FROM OPEN TABS:
${content}`;

        // Call Gemini API
        const response = await fetch(
            `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: systemPrompt },
                                { text: `\n\nUSER QUESTION: ${question}` }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    },
                    safetySettings: [
                        {
                            category: 'HARM_CATEGORY_HARASSMENT',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                        },
                        {
                            category: 'HARM_CATEGORY_HATE_SPEECH',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                        },
                        {
                            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                        },
                        {
                            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                        }
                    ]
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Gemini API error:', errorData);

            if (response.status === 429) {
                return NextResponse.json(
                    { error: 'Too many requests. Please wait a moment and try again.' },
                    { status: 429 }
                );
            }

            return NextResponse.json(
                { error: 'Failed to generate response. Please try again.' },
                { status: 500 }
            );
        }

        const data = await response.json();

        // Extract the response text
        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!answer) {
            console.error('No answer in Gemini response:', data);
            return NextResponse.json(
                { error: 'No response generated. Please try again.' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { answer },
            {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            }
        );

    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred. Please try again.' },
            { status: 500 }
        );
    }
}

// Handle CORS preflight requests
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
