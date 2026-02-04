export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <div className="text-center">
                <h1 className="text-6xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent mb-4">
                    TIMERYX
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                    Project Management & Time Tracking SaaS
                </p>
                <div className="glass-dark p-6 rounded-lg">
                    <p className="text-sm">Setting up your workspace...</p>
                </div>
            </div>
        </main>
    );
}
