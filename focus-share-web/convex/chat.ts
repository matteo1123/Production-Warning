import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Model selection based on tier
const MODELS = {
    free: 'gemini-2.0-flash-lite',
    premium: 'gemini-2.0-flash'
};

// Internal mutation to log chat messages
export const logChatMessage = internalMutation({
    args: {
        fullPrompt: v.string(),        // The complete prompt sent to the model
        userQuestion: v.string(),      // Just the user's question
        modelResponse: v.string(),
        focusName: v.optional(v.string()),
        userEmail: v.optional(v.string()),
        model: v.optional(v.string()),
        tabCount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("chat_messages", {
            userMessage: args.userQuestion,
            contentSent: args.fullPrompt.substring(0, 50000), // Store up to 50KB of prompt
            modelResponse: args.modelResponse,
            focusName: args.focusName,
            userEmail: args.userEmail,
            model: args.model,
            createdAt: Date.now(),
        });
    },
});

export const askFocus = action({
    args: {
        question: v.string(),
        content: v.string(),
        focusName: v.optional(v.string()),
        tabCount: v.optional(v.number()),
        userEmail: v.optional(v.string()),
        storeMessage: v.optional(v.boolean()),  // Only store if user opted in
    },
    handler: async (ctx, args) => {
        const { question, content, focusName, tabCount, userEmail, storeMessage } = args;

        // Get API key from environment
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return { error: 'AI service not configured. Please contact support.' };
        }

        // Check user tier and usage limits
        let userTier = 'free';
        if (userEmail) {
            try {
                // Check usage limits
                const usageResult = await ctx.runMutation(api.users.incrementChatUsage, {
                    email: userEmail,
                });

                if (!usageResult.allowed) {
                    return {
                        error: usageResult.message || 'Monthly query limit reached.',
                        remaining: 0,
                        upgradeRequired: true,
                    };
                }

                // Get user tier for model selection
                const tierResult = await ctx.runQuery(api.users.getUserTier, {
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

        try {
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
                    return { error: 'Too many requests. Please wait a moment and try again.' };
                }

                return { error: 'Failed to generate response. Please try again.' };
            }

            const data = await response.json();

            // Extract the response text
            const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!answer) {
                console.error('No answer in Gemini response:', data);
                return { error: 'No response generated. Please try again.' };
            }

            // Only log the chat message if user opted in to data collection
            if (storeMessage === true) {
                // Build the full prompt that was sent to the model
                const fullPromptSent = `${systemPrompt}\n\nUSER QUESTION: ${question}`;

                try {
                    await ctx.runMutation(internal.chat.logChatMessage, {
                        fullPrompt: fullPromptSent,
                        userQuestion: question,
                        modelResponse: answer,
                        focusName,
                        userEmail,
                        model,
                        tabCount,
                    });
                } catch (logErr) {
                    console.warn('Failed to log chat message:', logErr);
                    // Don't fail the request if logging fails
                }
            }

            return { answer };

        } catch (error) {
            console.error('Chat action error:', error);
            return { error: 'An unexpected error occurred. Please try again.' };
        }
    },
});

