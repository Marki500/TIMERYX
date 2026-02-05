export default function ChatPage() {
    return (
        <div className="p-8 flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center mb-6">
                <span className="text-3xl">💬</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Messages</h1>
            <p className="text-zinc-400 max-w-md">
                Team messaging and comments are coming soon in TIMERYX V2.
            </p>
        </div>
    )
}
