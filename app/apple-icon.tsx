import { ImageResponse } from 'next/og'

export const size = {
    width: 180,
    height: 180,
}
export const contentType = 'image/png'

export default function AppleIcon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
                    borderRadius: '40px',
                }}
            >
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
                    <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="url(#grad)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray="42.4 56.5"
                        strokeDashoffset="-14"
                        fill="none"
                    />
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
