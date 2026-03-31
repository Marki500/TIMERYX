import { motion } from "framer-motion"

export function DashboardStatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                    <div className="h-5 w-24 bg-white/10 rounded-md mb-3" />
                    <div className="h-10 w-16 bg-white/20 rounded-md mb-3" />
                    <div className="h-6 w-32 bg-white/10 rounded-full" />
                </div>
            ))}
        </div>
    )
}

export function ActivityChartSkeleton() {
    return (
        <div className="h-full p-6 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            <div className="h-7 w-48 bg-white/10 rounded-md mb-6" />
            <div className="flex-1 bg-white/5 rounded-xl border border-white/5" />
        </div>
    )
}

export function RecentActivitySkeleton() {
    return (
        <div className="h-full flex flex-col p-6 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            <div className="h-7 w-40 bg-white/10 rounded-md mb-6" />
            <div className="flex-1 space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-white/5 flex gap-4">
                        <div className="w-11 h-11 rounded-xl bg-white/10" />
                        <div className="flex-1 space-y-2">
                            <div className="h-5 w-full bg-white/10 rounded" />
                            <div className="h-4 w-1/2 bg-white/5 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
