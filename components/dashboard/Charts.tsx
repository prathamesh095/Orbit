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

const APPLE_COLORS = {
    applied: '#007AFF',
    interviewing: '#FF9500',
    offer: '#34C759',
    rejected: '#FF3B30',
    draft: '#8E8E93',
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
        color: APPLE_COLORS[status as keyof typeof APPLE_COLORS] ?? '#8E8E93',
    }));
}

export function TrendChart({ applications }: TrendChartProps) {
    const data = buildTrendData(applications);

    return (
        <div className="w-full">
            <h3 className="text-[13px] font-semibold text-[#86868B] uppercase tracking-[0.05em] mb-6">Application Trend</h3>
            {applications.length === 0 ? (
                <div className="h-[200px] flex flex-col items-center justify-center text-[#A1A1A6]">
                    <div className="w-10 h-10 rounded-full bg-[#F5F5F7] flex items-center justify-center mb-3">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <p className="text-[13px] font-medium">No results found</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={210}>
                    <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -25 }}>
                        <defs>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#007AFF" stopOpacity={0.12} />
                                <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F2F2F7" />
                        <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11, fill: '#A1A1A6', fontWeight: 500 }}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 11, fill: '#A1A1A6', fontWeight: 500 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                fontSize: 13,
                                fontWeight: 500,
                                borderRadius: 14,
                                border: 'none',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.06)',
                                padding: '8px 12px'
                            }}
                            cursor={{ stroke: '#007AFF', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            name="Applications"
                            stroke="#007AFF"
                            strokeWidth={2.5}
                            fill="url(#areaGradient)"
                            animationDuration={1500}
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
        <div className="w-full">
            <h3 className="text-[13px] font-semibold text-[#86868B] uppercase tracking-[0.05em] mb-6">Status Distribution</h3>
            {applications.length === 0 ? (
                <div className="h-[200px] flex flex-col items-center justify-center text-[#A1A1A6]">
                    <div className="w-10 h-10 rounded-full bg-[#F5F5F7] flex items-center justify-center mb-3">
                        <Activity className="w-5 h-5" />
                    </div>
                    <p className="text-[13px] font-medium">No results found</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={210}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={85}
                            paddingAngle={6}
                            dataKey="value"
                            animationBegin={200}
                            animationDuration={1200}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                fontSize: 13,
                                fontWeight: 500,
                                borderRadius: 14,
                                border: 'none',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.06)',
                                padding: '8px 12px'
                            }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            iconSize={6}
                            formatter={(value) => (
                                <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider ml-1">{value}</span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}

import { TrendingUp, Activity } from 'lucide-react';

