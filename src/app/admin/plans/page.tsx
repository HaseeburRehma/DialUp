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
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Plan {
    id: string;
    name: string;
    price: number;
    features: string[];
    createdAt: string;
}

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
        if (session.user?.role !== 'admin') return router.push('/');
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1 pt-16">
                <div className="container mx-auto px-4 py-8">

                    {/* Header and New Plan Button */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold">Manage Plans</h2>
                            <p className="text-muted-foreground">Configure pricing tiers and features</p>
                        </div>
                        <Button onClick={() => router.push('/admin/plans/new')}>+ New Plan</Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Plans ({plans.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Features</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead className="w-12">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {plans.map(plan => (
                                            <TableRow key={plan.id}>
                                                <TableCell>
                                                    <span className="font-medium">{plan.name}</span>
                                                </TableCell>
                                                <TableCell>${plan.price.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {plan.features.map(feature => (
                                                            <Badge key={feature} variant="outline">
                                                                {feature}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(plan.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
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
                                    <div className="py-8 text-center text-muted-foreground">
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
