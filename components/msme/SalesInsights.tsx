import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { Order } from '../../types';
import { format, startOfWeek, startOfMonth, startOfYear, isSameWeek, isSameMonth, isSameYear, parseISO, eachDayOfInterval, subDays, eachMonthOfInterval, subMonths } from 'date-fns';

interface SalesInsightsProps {
    orders: Order[];
    t: (key: string) => string;
}

export default function SalesInsights({ orders, t }: SalesInsightsProps) {
    const [timeRange, setTimeRange] = React.useState<'week' | 'month' | 'year'>('month');

    const chartData = useMemo(() => {
        const now = new Date();
        const completedOrders = orders.filter(o => o.status === 'Delivered' || o.status === 'Shipped' || o.status === 'Accepted');

        if (timeRange === 'week') {
            const days = eachDayOfInterval({
                start: subDays(now, 6),
                end: now
            });

            return days.map(day => {
                const dayStr = format(day, 'EEE');
                const amount = completedOrders
                    .filter(o => {
                        const orderDate = parseISO(o.createdAt || '');
                        return format(orderDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
                    })
                    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

                return { name: dayStr, amount };
            });
        } else if (timeRange === 'month') {
            const weeks = [3, 2, 1, 0].map(w => {
                const date = subDays(now, w * 7);
                const label = `Week ${4 - w}`;
                const amount = completedOrders
                    .filter(o => {
                        const orderDate = parseISO(o.createdAt || '');
                        return isSameWeek(orderDate, date);
                    })
                    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                return { name: label, amount };
            });
            return weeks;
        } else {
            const months = eachMonthOfInterval({
                start: startOfYear(now),
                end: now
            });

            return months.map(month => {
                const monthStr = format(month, 'MMM');
                const amount = completedOrders
                    .filter(o => {
                        const orderDate = parseISO(o.createdAt || '');
                        return isSameMonth(orderDate, month);
                    })
                    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                return { name: monthStr, amount };
            });
        }
    }, [orders, timeRange]);

    const totalInPeriod = useMemo(() => {
        return chartData.reduce((sum, d) => sum + d.amount, 0);
    }, [chartData]);

    const formatCurrency = (value: number) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
        return `₹${value}`;
    };

    return (
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-2">
                        <DollarSign className="h-6 w-6 text-emerald-600" />
                        Revenue Analytics
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Track your sales performance</p>
                </div>

                <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                    {(['week', 'month', 'year'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === range
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '900' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '900' }}
                                tickFormatter={formatCurrency}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    borderRadius: '20px',
                                    border: 'none',
                                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                                }}
                                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#10b981"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-slate-50 rounded-[2rem] p-8 flex flex-col justify-center border border-slate-100">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Total Revenue ({timeRange})</p>
                    <h3 className="text-4xl font-black text-slate-900 mb-6">{formatCurrency(totalInPeriod)}</h3>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Period</p>
                                <p className="text-sm font-black text-slate-700 uppercase">
                                    {timeRange === 'week' ? 'Last 7 Days' : timeRange === 'month' ? 'Last 30 Days' : 'Current Year'}
                                </p>
                            </div>
                        </div>

                        <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Growth Factor</p>
                            </div>
                            <p className="text-sm text-slate-600 font-bold leading-relaxed">
                                {totalInPeriod > 0
                                    ? `Averaging ${formatCurrency(Math.round(totalInPeriod / chartData.length))} per ${timeRange === 'week' ? 'day' : timeRange === 'month' ? 'week' : 'month'}.`
                                    : "No sales recorded in this period."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
