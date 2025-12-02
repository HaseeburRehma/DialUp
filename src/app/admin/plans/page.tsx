//  src/app/admin/plans/page.tsx

"use client";


import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, CreditCard, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Plan {
    id: string;
    name: string;
    price: number;
    features: string[];
    createdAt: string;
}
export const dynamic = 'force-dynamic';
export default function ManagePlansPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { toast } = useToast();

    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    // Redirect if not admin
    useEffect(() => {
        if (status === 'loading') return;
        if (!session) return router.push('/auth/signin');
        if ((session.user as any)?.role !== 'admin') return router.push('/');
        fetchPlans();
    }, [session, status, router]);

    async function fetchPlans() {
        try {
            const res = await fetch('/api/admin/plans', { credentials: 'include' });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setPlans(data.plans);
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to load plans', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(planId: string) {
        if (!confirm('Are you sure you want to delete this plan?')) return;
        try {
            const res = await fetch(`/api/admin/plans/${planId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!res.ok) throw new Error();
            toast({ title: 'Deleted', description: 'Plan removed successfully' });
            fetchPlans();
        } catch {
            toast({ title: 'Error', description: 'Failed to delete plan', variant: 'destructive' });
        }
    }

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <main className="flex-1 pt-16">
                <div className="container mx-auto px-4 py-8">

                    {/* Header and New Plan Button */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-3 bg-purple-600 rounded-xl shadow-lg">
                                    <CreditCard className="h-7 w-7 text-white" />
                                </div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                    Manage Plans
                                </h1>
                            </div>
                            <p className="text-slate-600 text-lg">Configure pricing tiers and features</p>
                        </div>
                        <Button
                            onClick={() => router.push('/admin/plans/new')}
                            className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New Plan
                        </Button>
                    </div>

                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-2xl text-slate-900">Plans ({plans.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-slate-200 hover:bg-slate-50">
                                            <TableHead className="font-semibold text-slate-700">Name</TableHead>
                                            <TableHead className="font-semibold text-slate-700">Price</TableHead>
                                            <TableHead className="font-semibold text-slate-700">Features</TableHead>
                                            <TableHead className="font-semibold text-slate-700">Created</TableHead>
                                            <TableHead className="w-12 font-semibold text-slate-700">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {plans.map(plan => (
                                            <TableRow key={plan.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                <TableCell>
                                                    <span className="font-semibold text-slate-900">{plan.name}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold text-green-600">${plan.price.toFixed(2)}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-2">
                                                        {plan.features.map(feature => (
                                                            <Badge key={feature} className="bg-blue-100 text-blue-700 border-blue-200 border font-medium">
                                                                {feature}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-600">
                                                    {new Date(plan.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="hover:bg-slate-100">
                                                                <MoreHorizontal />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-white border-slate-200">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => router.push(`/admin/plans/${plan.id}/edit`)}>
                                                                <Edit className="mr-2 h-4 w-4" />Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleDelete(plan.id)} className="text-red-600">
                                                                <Trash2 className="mr-2 h-4 w-4" />Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {plans.length === 0 && (
                                    <div className="py-12 text-center text-slate-500">
                                        No plans found. Create one to get started.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
