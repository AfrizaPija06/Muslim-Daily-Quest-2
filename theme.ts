
export const THEMES = {
  ramadhan: {
    id: 'ramadhan',
    name: 'Ramadhan Kareem',
    // Deep purple night sky with gold accents
    bg: 'bg-[#0f0518] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#321355] via-[#150625] to-[#05020a]',
    bgPatternColor: 'text-[#fbbf24]/10', // Subtle gold pattern
    fontMain: 'font-sans',
    fontDisplay: 'font-legends', // Classic font fits Ramadhan
    textPrimary: 'text-[#fefce8]', // Ivory
    textSecondary: 'text-[#c4b5fd]', // Light purple
    textAccent: 'text-[#fbbf24]', // Amber/Gold
    textGold: 'text-[#f59e0b]',
    card: 'glass-card border-[#fbbf24]/30 bg-[#1e1b4b]/40 backdrop-blur-md',
    border: 'border-[#fbbf24]/20',
    buttonPrimary: 'bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] border border-[#fbbf24]/50 hover:bg-[#5b21b6] shadow-[0_0_20px_rgba(251,191,36,0.2)] text-white',
    inputBg: 'bg-[#2e1065]/50',
    inputBorder: 'border-[#7c3aed]/50 focus:border-[#fbbf24]',
    progressBar: 'from-[#fbbf24] via-[#f59e0b] to-[#7c3aed]',
    activeTab: 'bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-[#2e1065] border border-[#fefce8]',
    inactiveTab: 'text-[#c4b5fd] hover:text-[#fbbf24]',
    glow: 'shadow-[0_0_30px_rgba(124,58,237,0.3)]',
    icons: {
      trophy: 'text-[#fbbf24]',
      home: 'text-[#c4b5fd]',
      mosque: 'text-[#fbbf24] drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]',
    }
  },
  maghfirah: {
    id: 'maghfirah',
    name: 'Maghfirah Phase',
    // Warm, fiery, intense amber/gold theme for the middle 10 days
    bg: 'bg-[#1a0500] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#7c2d12] via-[#451a03] to-[#0f0500]',
    bgPatternColor: 'text-[#fbbf24]/10', // Subtle gold pattern
    fontMain: 'font-sans',
    fontDisplay: 'font-legends',
    textPrimary: 'text-[#fffbeb]', // Warm white
    textSecondary: 'text-[#fdba74]', // Light orange
    textAccent: 'text-[#fbbf24]', // Amber/Gold
    textGold: 'text-[#f59e0b]',
    card: 'glass-card border-[#f59e0b]/30 bg-[#451a03]/40 backdrop-blur-md',
    border: 'border-[#f59e0b]/30',
    buttonPrimary: 'bg-gradient-to-r from-[#ea580c] to-[#c2410c] border border-[#fbbf24]/50 hover:bg-[#9a3412] shadow-[0_0_20px_rgba(234,88,12,0.4)] text-white',
    inputBg: 'bg-[#431407]/50',
    inputBorder: 'border-[#ea580c]/50 focus:border-[#fbbf24]',
    progressBar: 'from-[#fbbf24] via-[#f97316] to-[#ea580c]',
    activeTab: 'bg-gradient-to-r from-[#fbbf24] to-[#f97316] text-[#431407] border border-[#fffbeb]',
    inactiveTab: 'text-[#fdba74] hover:text-[#fbbf24]',
    glow: 'shadow-[0_0_30px_rgba(234,88,12,0.5)]',
    icons: {
      trophy: 'text-[#fbbf24]',
      home: 'text-[#fdba74]',
      mosque: 'text-[#fbbf24] drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]',
    }
  }
};