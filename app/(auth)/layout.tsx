'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Briefcase } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex auth-gradient">
            {/* Left panel - Branding */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 text-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold">JobTrack CRM</span>
                </div>

                <div>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <h1 className="text-4xl font-bold leading-tight mb-4">
                            Your strategic
                            <br />
                            job search,
                            <br />
                            <span className="text-blue-200">organized.</span>
                        </h1>
                        <p className="text-blue-100 text-lg">
                            Track applications, manage contacts, and stay ahead of every opportunity.
                        </p>
                    </motion.div>

                    <div className="mt-12 grid grid-cols-3 gap-4">
                        {[
                            { value: '100%', label: 'Data privacy' },
                            { value: '∞', label: 'Applications' },
                            { value: '0', label: 'Monthly cost' },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                                <div className="text-xs text-blue-200">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-blue-200/60 text-sm">
                    All data stored locally — no servers, no tracking.
                </p>
            </div>

            {/* Right panel - Auth form */}
            <div className="flex-1 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-sm"
                >
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 mb-8 lg:hidden">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <Briefcase className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-bold text-white">JobTrack CRM</span>
                    </div>

                    <div className="bg-white rounded-2xl shadow-2xl p-8">
                        {children}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
