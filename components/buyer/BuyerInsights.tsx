import React, { useMemo, useState } from 'react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { Order } from '../../types';
import { format, startOfWeek, startOfYear, isSameWeek, isSameMonth, parseISO, eachDayOfInterval, subDays, eachMonthOfInterval, isValid } from 'date-fns';

interface BuyerInsightsProps {
    orders: Order[];
    t: (key: string) => string;
}

export default function BuyerInsights({ orders, t }: BuyerInsightsProps) {
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

    const chartData = useMemo(() => {
        const now = new Date();
        const deliveredOrders = Array.isArray(orders) ? orders.filter(o => o.status === 'Delivered') : [];

        const formatDateSafely = (date: Date, formatStr: string) => {
            try {
                if (!isValid(date)) return '';
                return format(date, formatStr);
            } catch (e) {
                return '';
            }
        };

        const parseDateSafely = (dateStr: any) => {
            if (!dateStr) return null;
            try {
                const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
                return isValid(d) ? d : null;
            } catch (e) {
                return null;
            }
        };

        if (timeRange === 'week') {
            const days = eachDayOfInterval({
                start: subDays(now, 6),
                end: now
            });

            return days.map(day => {
                const dayStr = formatDateSafely(day, 'EEE');
                const amount = deliveredOrders
                    .filter(o => {
                        const orderDate = parseDateSafely(o.createdAt);
                        if (!orderDate) return false;
                        return formatDateSafely(orderDate, 'yyyy-MM-dd') === formatDateSafely(day, 'yyyy-MM-dd');
                    })
                    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

                return { name: dayStr, amount };
            });
        } else if (timeRange === 'month') {
            const weeks = [3, 2, 1, 0].map(w => {
                const date = subDays(now, w * 7);
                const label = `Week ${4 - w}`;
                const amount = deliveredOrders
                    .filter(o => {
                        const orderDate = parseDateSafely(o.createdAt);
                        if (!orderDate || !isValid(date)) return false;
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
                const monthStr = formatDateSafely(month, 'MMM');
                const amount = deliveredOrders
                    .filter(o => {
                        const orderDate = parseDateSafely(o.createdAt);
                        if (!orderDate || !isValid(month)) return false;
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
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
        return `₹${value}`;
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                        Spending Analysis
                    </h2>
                    <p className="text-sm text-gray-500">Track your product expenditures over time</p>
                </div>

                <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-200">
                    {(['week', 'month', 'year'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === range
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {range.charAt(0).toUpperCase() + range.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                tickFormatter={formatCurrency}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                }}
                                formatter={(value: number) => [formatCurrency(value), 'Spent']}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#4f46e5"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorAmount)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 flex flex-col justify-center">
                    <p className="text-gray-500 text-sm font-medium mb-1">Total Spent ({timeRange})</p>
                    <h3 className="text-4xl font-black text-gray-900 mb-4">{formatCurrency(totalInPeriod)}</h3>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Calendar className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Period</p>
                                <p className="text-sm font-semibold text-gray-700">
                                    {timeRange === 'week' ? 'Last 7 Days' : timeRange === 'month' ? 'Last 30 Days' : 'Year to Date'}
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                            <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mb-2">Insight</p>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {totalInPeriod > 0
                                    ? `Your average spending in this period is approx ${formatCurrency(Math.round(totalInPeriod / (chartData.length || 1)))} per ${timeRange === 'week' ? 'day' : timeRange === 'month' ? 'week' : 'month'}.`
                                    : "No spending data available for this period."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
