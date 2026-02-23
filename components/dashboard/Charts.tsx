'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import type { Application } from '@/types';
import { STATUS_LABELS } from '@/lib/utils';

interface TrendChartProps {
    applications: Application[];
}

const CHART_COLORS = {
    applied: '#3b82f6',
    interviewing: '#f59e0b',
    offer: '#10b981',
    rejected: '#ef4444',
    draft: '#6b7280',
};

// Group applications by month for the trend chart
function buildTrendData(apps: Application[]) {
    const map = new Map<string, number>();
    const now = new Date();

    // Prime the last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        map.set(key, 0);
    }

    for (const app of apps) {
        if (!app.actionDate) continue;
        const d = new Date(app.actionDate);
        const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (map.has(key)) {
            map.set(key, (map.get(key) ?? 0) + 1);
        }
    }

    return Array.from(map.entries()).map(([month, count]) => ({ month, count }));
}

// Build pie chart data by status
function buildPieData(apps: Application[]) {
    const map: Record<string, number> = {};
    for (const app of apps) {
        map[app.status] = (map[app.status] ?? 0) + 1;
    }
    return Object.entries(map).map(([status, value]) => ({
        name: STATUS_LABELS[status] ?? status,
        value,
        color: CHART_COLORS[status as keyof typeof CHART_COLORS] ?? '#94a3b8',
    }));
}

export function TrendChart({ applications }: TrendChartProps) {
    const data = buildTrendData(applications);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Application Trend</h3>
            {applications.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm text-gray-400">
                    No applications yet
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                        <defs>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                            itemStyle={{ color: '#3b82f6' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            name="Applications"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="url(#areaGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}

export function StatusPieChart({ applications }: { applications: Application[] }) {
    const data = buildPieData(applications);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Status Distribution</h3>
            {applications.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm text-gray-400">
                    No applications yet
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                        />
                        <Legend
                            iconType="circle"
                            iconSize={8}
                            formatter={(value) => (
                                <span style={{ fontSize: 11, color: '#64748b' }}>{value}</span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
