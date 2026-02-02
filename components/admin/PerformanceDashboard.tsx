
import React, { useEffect, useState } from 'react';
import { Activity, Smartphone, Globe, Wifi, AlertTriangle } from 'lucide-react';
import { PerformanceMonitor } from '../../services/PerformanceMonitor';
import { PerformanceMetric } from '../../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PerformanceDashboard() {
    const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);

    useEffect(() => {
        // Load initial metrics
        setMetrics(PerformanceMonitor.getMetrics());

        const interval = setInterval(() => {
            // Simulate live traffic if we are on the dashboard
            const networkLatency = Math.floor(Math.random() * (150 - 20 + 1) + 20);
            PerformanceMonitor.logMetric('network', networkLatency, 'ms', { source: 'heartbeat' });

            // Occasionally simulate app loads
            if (Math.random() > 0.7) {
                const webLoad = Math.floor(Math.random() * (800 - 100 + 1) + 100);
                PerformanceMonitor.logMetric('web_app', webLoad, 'ms', { page: 'dashboard' });
            }

            if (Math.random() > 0.8) {
                const mobileLoad = Math.floor(Math.random() * (1200 - 400 + 1) + 400);
                PerformanceMonitor.logMetric('mobile_app', mobileLoad, 'ms', { device: 'android' });
            }

            // Refresh view
            setMetrics(PerformanceMonitor.getMetrics());
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const getLatestMetric = (type: string) => {
        return metrics.find(m => m.metricType === type);
    };

    const getAverage = (type: string) => {
        const relevant = metrics.filter(m => m.metricType === type);
        if (relevant.length === 0) return 0;
        return Math.round(relevant.reduce((acc, curr) => acc + curr.value, 0) / relevant.length);
    };

    const chartData = metrics
        .slice(0, 20)
        .reverse()
        .map(m => ({
            time: new Date(m.timestamp).toLocaleTimeString(),
            value: m.value,
            type: m.metricType
        }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Activity className="h-6 w-6 text-indigo-600" />
                    System Health & Performance
                </h2>
                <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Live Monitoring
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Network Health */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Network Latency</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{getAverage('network')}ms</h3>
                        </div>
                        <div className={`p-2 rounded-lg ${getAverage('network') > 200 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            <Wifi className="h-5 w-5" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400">Avg response time (last 1 hour)</p>
                </div>

                {/* Web App Performance */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Web App Load</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{getAverage('web_app')}ms</h3>
                        </div>
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                            <Globe className="h-5 w-5" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400">Avg render time</p>
                </div>

                {/* Mobile App Performance */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Mobile App</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{getAverage('mobile_app')}ms</h3>
                        </div>
                        <div className="p-2 rounded-lg bg-pink-50 text-pink-600">
                            <Smartphone className="h-5 w-5" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400">Avg screen load time</p>
                </div>
            </div>

            {/* Real-time Graph */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Real-time Performance Trend</h3>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="time" hide />
                            <YAxis tick={{ fontSize: 10 }} width={30} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#4f46e5" fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Alerts */}
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <h4 className="font-semibold text-orange-900">Recent Critical Alerts</h4>
                </div>
                <div className="space-y-2">
                    {metrics.filter(m => m.status === 'critical').slice(0, 3).map(alert => (
                        <div key={alert.id} className="bg-white/60 p-2 rounded text-sm text-orange-800 flex justify-between">
                            <span>{alert.metricType.replace('_', ' ')} high latency: {alert.value}{alert.unit}</span>
                            <span className="text-xs opacity-70">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                        </div>
                    ))}
                    {metrics.filter(m => m.status === 'critical').length === 0 && (
                        <p className="text-sm text-orange-800 opacity-70">No critical alerts recently. System running smoothly.</p>
                    )}
                </div>
                <p className="text-xs text-orange-700 mt-2 font-medium">
                    * SMS & WhatsApp alerts are automatically sent to Admin for critical events.
                </p>
            </div>

        </div>
    );
}
