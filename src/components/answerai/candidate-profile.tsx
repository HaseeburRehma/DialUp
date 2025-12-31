// src/components/answerai/candidate-profile.tsx
'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, XCircle, AlertCircle, Award, User, Target, Zap } from 'lucide-react'
import type { Scorecard } from '@/types/answerai'

interface CandidateProfileProps {
    name: string
    email: string
    scorecard: Scorecard | null
}

export const CandidateProfile: React.FC<CandidateProfileProps> = ({ name, email, scorecard }) => {
    if (!scorecard) {
        return (
            <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-8 text-center text-slate-500">
                    <AlertCircle className="h-10 w-10 mx-auto mb-4 opacity-20" />
                    <p>No AI scorecard available for this candidate yet.</p>
                </CardContent>
            </Card>
        )
    }

    const getRecommendationColor = (rec: string) => {
        switch (rec) {
            case 'Strong Hire': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            case 'Hire': return 'bg-green-100 text-green-700 border-green-200'
            case 'Follow-up': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'Reject': return 'bg-red-100 text-red-700 border-red-200'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    return (
        <div className="space-y-4">
            <Card className="bg-white border-slate-200 shadow-lg overflow-hidden border-t-4 border-t-emerald-500">
                <CardHeader className="bg-slate-50/50 pb-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                                <User className="h-8 w-8" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold text-slate-900">{name}</CardTitle>
                                <p className="text-slate-500 text-sm">{email}</p>
                            </div>
                        </div>
                        <Badge className={`px-4 py-1.5 text-sm font-bold uppercase tracking-wider ${getRecommendationColor(scorecard.recommendation)}`}>
                            {scorecard.recommendation}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="text-slate-500 text-xs font-bold uppercase mb-2 flex items-center">
                                <Target className="h-3 w-3 mr-1" /> Overall Score
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-900">{scorecard.overallScore}</span>
                                <span className="text-slate-400 font-medium">/ 10</span>
                            </div>
                            <Progress value={scorecard.overallScore * 10} className="h-2 mt-4 bg-slate-200 [&>div]:bg-emerald-500" />
                        </div>

                        <div className="col-span-2 space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1 uppercase">
                                    <span>Technical Skills</span>
                                    <span>{scorecard.categoryScores.technical}/10</span>
                                </div>
                                <Progress value={scorecard.categoryScores.technical * 10} className="h-1.5 bg-slate-100 [&>div]:bg-blue-500" />
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1 uppercase">
                                    <span>Communication</span>
                                    <span>{scorecard.categoryScores.communication}/10</span>
                                </div>
                                <Progress value={scorecard.categoryScores.communication * 10} className="h-1.5 bg-slate-100 [&>div]:bg-sky-500" />
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1 uppercase">
                                    <span>Cultural Fit</span>
                                    <span>{scorecard.categoryScores.culture}/10</span>
                                </div>
                                <Progress value={scorecard.categoryScores.culture * 10} className="h-1.5 bg-slate-100 [&>div]:bg-indigo-500" />
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center uppercase tracking-tight">
                            <Zap className="h-4 w-4 mr-2 text-amber-500" /> AI Summary
                        </h3>
                        <p className="text-slate-700 leading-relaxed bg-amber-50/30 p-4 rounded-xl border border-amber-100/50">
                            {scorecard.summary}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-emerald-700 uppercase flex items-center">
                                <CheckCircle2 className="h-3 w-3 mr-2" /> Key Strengths
                            </h4>
                            <ul className="space-y-2">
                                {scorecard.strengths.map((s, i) => (
                                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-red-700 uppercase flex items-center">
                                <XCircle className="h-3 w-3 mr-2" /> Areas for Improvement
                            </h4>
                            <ul className="space-y-2">
                                {scorecard.weaknesses.map((w, i) => (
                                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                                        {w}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
