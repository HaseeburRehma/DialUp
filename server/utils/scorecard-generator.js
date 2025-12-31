// server/utils/scorecard-generator.js
const axios = require('axios');

async function generateScorecard(questionsAndAnswers) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.warn('⚠️ OPENROUTER_API_KEY not found, skipping scorecard generation');
        return null;
    }

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
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'google/gemini-2.0-flash-exp:free',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceai.app',
                'X-Title': 'VoiceAI Scorecard'
            }
        });

        const result = response.data.choices[0].message.content;
        return JSON.parse(result);
    } catch (error) {
        console.error('❌ Scorecard generation failed:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = { generateScorecard };
