import { db, connectDb } from './client';
import { AnalyticsStats } from './admin';

export async function getAnalyticsStats(): Promise<AnalyticsStats> {
  await connectDb();

  const usersCol = db.collection('users');
  const subsCol = db.collection('subscriptions');

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalUsers, activeUsers, revenueDocs, churnUsers, monthlyNewUsers, monthlyRevenueDocs] = await Promise.all([
    usersCol.countDocuments(),
    usersCol.countDocuments({ isActive: true }),
    subsCol.aggregate([
      {
        $match: { createdAt: { $gte: startOfMonth } }
      },
      {
        $group: { _id: null, total: { $sum: "$amount" } }
      }
    ]).toArray(),
    usersCol.countDocuments({ status: 'churned' }),
    usersCol.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%b", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]).toArray(),
    subsCol.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%b", date: "$createdAt" } },
          revenue: { $sum: "$amount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]).toArray()
  ]);

  const monthlyRevenue = revenueDocs?.[0]?.total ?? 0;

  return {
    totalUsers,
    activeUsers,
    monthlyRevenue,
    churnRate: parseFloat(((churnUsers / totalUsers) * 100).toFixed(2)),
    userGrowth: monthlyNewUsers.map(d => ({ month: d._id, count: d.count })),
    revenueGrowth: monthlyRevenueDocs.map(d => ({ month: d._id, revenue: d.revenue }))
  };
}
