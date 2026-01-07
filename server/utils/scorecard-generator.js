// server/utils/scorecard-generator.js

async function generateScorecard(questionsAndAnswers) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.warn('⚠️ OPENROUTER_API_KEY not found, skipping scorecard generation');
        return null;
    }

    console.log(`[Scorecard] Generating for ${questionsAndAnswers.length} Q&A pairs...`);
    const content = questionsAndAnswers.map(qa => `Q: ${qa.question}\nA: ${qa.answer}`).join('\n\n');

    const prompt = `
    You are an expert HR Interviewer. Analyze the following interview transcript and generate a candidate scorecard.
    
    Interview Transcript:
    ${content}
    
    Provide the response strictly in JSON format with the following structure:
    {
      "overallScore": number (1-10),
      "summary": "brief summary of the candidate's performance",
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "categoryScores": {
         "technical": number (1-10),
         "communication": number (1-10),
         "culture": number (1-10)
      },
      "recommendation": "Hire" | "Strong Hire" | "Reject" | "Follow-up"
    }
    `;

    try {
        const url = 'https://openrouter.ai/api/v1/chat/completions';
        const model = 'google/gemini-2.0-flash-exp:free';

        console.log(`[Scorecard] Requesting LLM: ${url} (Model: ${model})`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceai.app',
                'X-Title': 'VoiceAI Scorecard'
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Scorecard] OpenRouter error (${response.status}):`, errorText);
            throw new Error(`OpenRouter API failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const result = data.choices[0].message.content;
        console.log('[Scorecard] ✅ Successfully generated');
        return JSON.parse(result);
    } catch (error) {
        console.error('❌ Scorecard generation error:', error.message);
        throw error;
    }
}

module.exports = { generateScorecard };
