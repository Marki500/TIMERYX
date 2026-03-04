import { ImageResponse } from 'next/og'

export const size = {
    width: 32,
    height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0a0a0a',
                    borderRadius: '6px',
                }}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    {/* Gradient arc representing time/progress */}
                    <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="url(#grad)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="42.4 56.5"
                        strokeDashoffset="-14"
                        fill="none"
                    />
                    {/* Center dot */}
                    <circle cx="12" cy="12" r="2" fill="#818cf8" />
                    <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="24" y2="24">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="50%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        ),
        {
            ...size,
        }
    )
}
