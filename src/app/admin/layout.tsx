// src/app/admin/layout.tsx
'use client'

import { ReactNode } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
