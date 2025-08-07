export interface AnalyticsStats {
  totalUsers: number;
  activeUsers: number;
  monthlyRevenue: number;
  churnRate: number;
  userGrowth: { month: string; count: number }[];
  revenueGrowth: { month: string; revenue: number }[];
}
