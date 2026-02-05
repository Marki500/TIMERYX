import { Variants } from 'framer-motion'

/**
 * Centralized animation library for TIMERYX
 * Provides consistent timing, easing, and motion patterns across the app
 */

// ============================================
// SPRING CONFIGURATIONS
// ============================================

export const springs = {
    // Gentle spring for subtle movements
    gentle: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30,
    },
    // Bouncy spring for playful interactions
    bouncy: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 25,
    },
    // Smooth spring for page transitions
    smooth: {
        type: 'spring' as const,
        stiffness: 260,
        damping: 35,
    },
    // Snappy spring for quick responses
    snappy: {
        type: 'spring' as const,
        stiffness: 500,
        damping: 40,
    },
}

// ============================================
// EASING FUNCTIONS
// ============================================

export const easings = {
    easeOut: [0.16, 1, 0.3, 1],
    easeIn: [0.7, 0, 0.84, 0],
    easeInOut: [0.87, 0, 0.13, 1],
    smooth: [0.25, 0.1, 0.25, 1],
}

// ============================================
// FADE ANIMATIONS
// ============================================

export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.3,
            ease: easings.easeOut,
        },
    },
}

export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: easings.easeOut,
        },
    },
}

export const fadeInDown: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: easings.easeOut,
        },
    },
}

// ============================================
// SCALE ANIMATIONS
// ============================================

export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.3,
            ease: easings.easeOut,
        },
    },
}

export const popIn: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: springs.bouncy,
    },
}

// ============================================
// STAGGER ANIMATIONS (for lists/tables)
// ============================================

export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
}

export const staggerItem: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: easings.easeOut,
        },
    },
}

// Fast stagger for large lists
export const fastStaggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.02,
            delayChildren: 0.05,
        },
    },
}

// ============================================
// SLIDE ANIMATIONS
// ============================================

export const slideInLeft: Variants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.4,
            ease: easings.easeOut,
        },
    },
}

export const slideInRight: Variants = {
    hidden: { opacity: 0, x: 30 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.4,
            ease: easings.easeOut,
        },
    },
}

// ============================================
// PAGE TRANSITIONS
// ============================================

export const pageTransition: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: easings.smooth,
        },
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: {
            duration: 0.3,
            ease: easings.easeIn,
        },
    },
}

// ============================================
// HOVER ANIMATIONS
// ============================================

export const hoverLift = {
    rest: { y: 0, scale: 1 },
    hover: {
        y: -4,
        scale: 1.02,
        transition: springs.gentle,
    },
}

export const hoverScale = {
    rest: { scale: 1 },
    hover: {
        scale: 1.05,
        transition: springs.gentle,
    },
}

export const hoverGlow = {
    rest: { boxShadow: '0 0 0 0 rgba(255, 255, 255, 0)' },
    hover: {
        boxShadow: '0 8px 24px -4px rgba(255, 255, 255, 0.1)',
        transition: { duration: 0.3 },
    },
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Creates a stagger delay for child elements
 * @param index - Index of the child element
 * @param baseDelay - Base delay in seconds (default: 0.05)
 */
export const getStaggerDelay = (index: number, baseDelay = 0.05) => ({
    delay: index * baseDelay,
})

/**
 * Combines multiple animation variants
 */
export const combineVariants = (...variants: Variants[]): Variants => {
    return variants.reduce((acc, variant) => ({ ...acc, ...variant }), {})
}
