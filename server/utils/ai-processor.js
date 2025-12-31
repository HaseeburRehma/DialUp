// server/utils/ai-processor.js
const axios = require('axios');

/**
 * Process a transcript to extract sentiment and tasks.
 * @param {string} transcript - The full call transcript.
 * @returns {Promise<{ sentiment: string, tasks: Array<{text: string, dueDate?: Date}>, summary?: string }>}
 */
async function processTranscript(transcript) {
    if (!transcript || transcript.length < 10) {
        return { sentiment: 'neutral', tasks: [] };
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.warn('⚠️ OPENROUTER_API_KEY not found, skipping AI processing');
        return { sentiment: 'neutral', tasks: [] };
    }

    try {
        const prompt = `
        Analyze the following call transcript and extract:
        1. Sentiment (choose one: positive, neutral, negative, angry, urgent).
        2. Action Items/Tasks (a list of things the speaker or listener promised to do).
        3. A concise 1-sentence summary.

        Transcript:
        "${transcript}"

        Respond ONLY with a JSON object in this format:
        {
            "sentiment": "neutral",
            "tasks": [{"text": "Follow up with email"}],
            "summary": "..."
        }
        `;

        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'google/gemini-2.0-flash-exp:free',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceai.app',
                'X-Title': 'VoiceAI Insights'
            }
        });

        const result = response.data.choices[0].message.content;
        return JSON.parse(result);
    } catch (err) {
        console.error(' AI Processing Error:', err.message);
        return { sentiment: 'neutral', tasks: [] };
    }
}

module.exports = { processTranscript };
