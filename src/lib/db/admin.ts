import { connectDb } from './client';
import { ObjectId } from 'mongodb';
import { AnalyticsStats } from '@/lib/types';

export async function deletePlan(planId: string) {
  const db = await connectDb();
  return db.collection('plans').deleteOne({ _id: new ObjectId(planId) });
}

export async function getAllPlans() {
  const db = await connectDb();
  return db.collection('plans').find().toArray();
}

export async function updatePlan(planId: string, updates: any) {
  const db = await connectDb();
  await db.collection('plans').updateOne({ _id: new ObjectId(planId) }, { $set: updates });
  return db.collection('plans').findOne({ _id: new ObjectId(planId) });
}

export async function createPlan(data: any) {
  const db = await connectDb();
  const result = await db.collection('plans').insertOne(data);
  return db.collection('plans').findOne({ _id: result.insertedId });
}

export async function getAnalyticsStats(): Promise<AnalyticsStats> {
  const db = await connectDb();

  const usersCol = db.collection('users');
  const subsCol = db.collection('subscriptions');

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    activeUsers,
    revenueDocs,
    churnUsers,
    monthlyNewUsers,
    monthlyRevenueDocs
  ] = await Promise.all([
    usersCol.countDocuments(),
    usersCol.countDocuments({ isActive: true }),
    subsCol.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]).toArray() as { _id: null; total: number }[],
    usersCol.countDocuments({ status: 'churned' }),
    usersCol.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%b", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]).toArray() as { _id: string; count: number }[],
    subsCol.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%b", date: "$createdAt" } },
          revenue: { $sum: "$amount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]).toArray() as { _id: string; revenue: number }[]
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
