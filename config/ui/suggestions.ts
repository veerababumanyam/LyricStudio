/**
 * Suggestion Chips & Enhanced Prompts
 * Context-aware suggestion chips and their expanded prompts
 */

export const SUGGESTION_CHIPS: Record<string, string[]> = {
    "default": [
        "Write a Love Song", "Compose a Mass Beat", "Sad Breakup Song",
        "Wedding Song", "Motivational Anthem", "Lullaby"
    ],
    "lyrics_generated": [
        "Make the chorus catchier", "Add a rap bridge", "Simplify the language",
        "Fix the rhymes in Verse 2", "Translate to English context", "Make it sadder"
    ],
    "love_romance": [
        "Describe her eyes using moonlight", "Add a rain sequence", "Make it a slow melody", "Focus on first meeting"
    ],
    "cinematic": [
        "Add a slow-motion entry feel", "Increase the tempo", "Add powerful Sanskrit words", "Make it a dark villain theme"
    ]
};

export const ENHANCED_PROMPTS: Record<string, string> = {
    // Default Chips
    "Write a Love Song": "Write a romantic melody about love at first sight. Context: The hero [Hero Name] sees the heroine [Heroine Name] in a crowded market. Time slows down. Describe her eyes and smile using poetic metaphors. Language: Telugu. Style: Melodious.",
    "Compose a Mass Beat": "Compose a high-energy 'Mass' beat song for a hero entry. Context: The hero [Hero Name] arrives to save the village [Village Name]. Use punchy dialogues, loud drum descriptions, and words that elevate his strength (Veera). Language: Telugu with local slang.",
    "Sad Breakup Song": "Write a heart-wrenching breakup song (Pathos). Context: The protagonist [Name] is walking alone in the rain, holding a returned gift. Memories of happy times haunt him. Use deep, emotional vocabulary.",
    "Wedding Song": "Create a festive Wedding song for the 'Jeelakarra Bellam' ceremony. Context: The sacred moment of union between [Groom Name] and [Bride Name]. Blend traditional Sanskrit chants with Telugu lyrics describing the eternal bond. Mood: Devotional and Happy.",
    "Motivational Anthem": "Write a powerful motivational anthem about rising from failure. Context: [Name] is training hard after a defeat. Use metaphors of fire, sweat, and climbing mountains. High tempo and inspiring.",
    "Lullaby": "Write a soothing lullaby (Jola Pata) for a sleeping child [Child Name]. Context: A mother singing to her baby under the moonlight. References to 'Chandamama' and dreams. Very slow and melodic.",

    // Edit/Refine Chips
    "Make the chorus catchier": "Rewrite the [Chorus] section to make it catchier and more rhythmic. Use shorter words and a strong hook that repeats.",
    "Add a rap bridge": "Add a [Bridge] section in Rap style. Use fast-paced rhymes and modern slang to increase the energy before the final chorus.",
    "Simplify the language": "Rewrite the lyrics using simpler, everyday conversational language (Vaduka Bhasha). Remove any complex or archaic words.",
    "Fix the rhymes in Verse 2": "Review [Verse 2] and fix the end rhymes (Anthya Prasa). Ensure the lines flow smoothly and sound musical.",
    "Translate to English context": "Provide a brief English summary/translation of the lyrics context so I can understand the meaning better (do not translate the song lines themselves).",
    "Make it sadder": "Rewrite the lyrics to be more emotional and painful. Use darker metaphors and focus on the feeling of loss.",

    // Category specific (Love)
    "Describe her eyes using moonlight": "Rewrite the verse to describe her eyes using metaphors of moonlight and stars. Make it very poetic.",
    "Add a rain sequence": "Add a section describing sudden rain, symbolizing the overflow of emotions.",
    "Make it a slow melody": "Adjust the structure and rhythm to fit a slow, soulful melody (ragam).",
    "Focus on first meeting": "Focus the lyrics on the specific moment of their first meeting and the spark of attraction.",

    // Category specific (Cinematic)
    "Add a slow-motion entry feel": "Write the lyrics to match a slow-motion visual sequence. Use elongated words and grand descriptions.",
    "Increase the tempo": "Rewrite the rhythm to fit a fast-paced, high-tempo beat. Short, punchy lines.",
    "Add powerful Sanskrit words": "Infuse the lyrics with powerful Sanskrit words to give it a divine or epic feel.",
    "Make it a dark villain theme": "Shift the tone to be dark and menacing, suitable for a villain's introduction."
};
