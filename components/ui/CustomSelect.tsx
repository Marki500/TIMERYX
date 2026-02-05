'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Option {
    value: string
    label: string
}

interface CustomSelectProps {
    value: string
    onChange: (value: string) => void
    options: Option[]
    placeholder?: string
    label?: string
}

export function CustomSelect({ value, onChange, options, placeholder, label }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find(opt => opt.value === value)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div ref={dropdownRef} className="relative">
            {label && (
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                    {label}
                </label>
            )}

            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2.5 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all hover:border-white/20 hover:from-white/[0.12] hover:to-white/[0.04] backdrop-blur-sm flex items-center justify-between group"
            >
                <span className={selectedOption ? 'text-white' : 'text-zinc-500'}>
                    {selectedOption?.label || placeholder || 'Seleccionar...'}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-2 py-2 bg-gradient-to-br from-[#1a1a1a]/95 to-[#0a0a0a]/95 border border-white/10 rounded-xl shadow-2xl shadow-black/50 backdrop-blur-xl max-h-60 overflow-y-auto"
                    >
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value)
                                    setIsOpen(false)
                                }}
                                className={`w-full px-4 py-2.5 text-left transition-colors flex items-center justify-between group ${option.value === value
                                        ? 'bg-primary-500/10 text-primary-400'
                                        : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <span>{option.label}</span>
                                {option.value === value && (
                                    <Check className="w-4 h-4 text-primary-400" />
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
