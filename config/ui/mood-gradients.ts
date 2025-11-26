/**
 * Mood-based UI Theming
 * Tailwind gradient classes for atmospheric mood rendering
 */

import { AUTO_OPTION } from "./dropdowns";

export const MOOD_GRADIENTS: Record<string, string> = {
    "Happy": "from-yellow-100/20 via-orange-100/20 to-amber-100/20 dark:from-yellow-900/10 dark:via-orange-900/10 dark:to-amber-900/10",
    "Sad (Pathos)": "from-slate-200/20 via-gray-200/20 to-zinc-200/20 dark:from-slate-900/20 dark:via-gray-900/20 dark:to-black",
    "Energetic": "from-cyan-100/20 via-blue-100/20 to-indigo-100/20 dark:from-cyan-900/20 dark:via-blue-900/20 dark:to-indigo-900/20",
    "Peaceful": "from-emerald-100/20 via-teal-100/20 to-green-100/20 dark:from-emerald-900/10 dark:via-teal-900/10 dark:to-green-900/10",
    "Romantic (Shringara)": "from-rose-100/20 via-pink-100/20 to-fuchsia-100/20 dark:from-rose-900/10 dark:via-pink-900/10 dark:to-fuchsia-900/10",
    "Angry (Raudra)": "from-red-100/20 via-orange-100/20 to-stone-100/20 dark:from-red-950/30 dark:via-orange-950/20 dark:to-black",
    "Mysterious": "from-violet-100/20 via-purple-100/20 to-indigo-100/20 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-slate-950",
    "Funny (Hasya)": "from-lime-100/20 via-yellow-100/20 to-green-100/20 dark:from-lime-900/10 dark:via-yellow-900/10 dark:to-green-900/10",
    "Courageous (Veera)": "from-orange-100/20 via-amber-100/20 to-red-100/20 dark:from-orange-900/20 dark:via-amber-900/20 dark:to-red-900/20",
    "Playful (Kids)": "from-sky-100/20 via-pink-100/20 to-yellow-100/20 dark:from-sky-900/10 dark:via-pink-900/10 dark:to-yellow-900/10",
    "Devotional": "from-amber-100/20 via-yellow-100/20 to-orange-100/20 dark:from-amber-900/10 dark:via-yellow-900/10 dark:to-orange-900/10",
    "Philosophical": "from-indigo-100/20 via-slate-100/20 to-gray-100/20 dark:from-indigo-950/20 dark:via-slate-900/20 dark:to-gray-900/20",
    "Custom": "from-slate-100/20 via-gray-100/20 to-zinc-100/20 dark:from-slate-900/20 dark:via-gray-900/20 dark:to-zinc-900/20",
    [AUTO_OPTION]: "from-slate-100/20 via-gray-100/20 to-zinc-100/20 dark:from-slate-900/20 dark:via-gray-900/20 dark:to-zincі-900/20"
};
