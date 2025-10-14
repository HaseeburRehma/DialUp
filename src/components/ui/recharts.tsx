// src/components/ui/recharts.tsx

"use client";

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';

interface RechartsProps {
  userGrowth: { month: string; count: number }[];
  revenueGrowth: { month: string; revenue: number }[];
}

export default function Recharts({ userGrowth, revenueGrowth }: RechartsProps) {
  return (
    <>
      <Separator className="my-8" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {/* User Growth Chart */}
        <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle>User Growth (Last 6 Months)</CardTitle>
            <CardDescription className="text-muted-foreground">New signups per month</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowth}>
                <XAxis
                  dataKey="month"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border)' }}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border)' }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="url(#userGrowthGradient)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: '#10b981' }}
                />
                <defs>
                  <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Trend Chart */}
        <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Revenue Trend (Last 6 Months)</CardTitle>
            <CardDescription className="text-muted-foreground">Monthly revenue</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueGrowth}>
                <XAxis
                  dataKey="month"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border)' }}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border)' }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="url(#revenueGradient)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: '#f59e0b' }}
                />
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}