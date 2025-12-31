// src/app/api/answerai/generate-scorecard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
const { generateScorecard } = require('../../../../../server/utils/scorecard-generator');

export async function POST(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { questions, answers } = await req.json();

        if (!questions || !answers || questions.length === 0) {
            return NextResponse.json({ error: 'Insufficient data for scorecard generation' }, { status: 400 });
        }

        // Map data to the format expected by the generator
        const qaData = questions.map((q: any) => {
            const a = answers.find((ans: any) => ans.questionId === q.id);
            return {
                question: q.content,
                answer: a ? a.content : 'No answer collected'
            };
        });

        const scorecard = await generateScorecard(qaData);
        return NextResponse.json(scorecard);
    } catch (err: any) {
        console.error('Scorecard API Error:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
