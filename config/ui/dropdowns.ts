/**
 * UI Configuration
 * Dropdown options, suggestion chips, and UI-related constants
 */

export const AUTO_OPTION = "Auto (AI Detect)";

// Dropdown options
export const MOOD_OPTIONS = [
    AUTO_OPTION, "Happy", "Sad (Pathos)", "Energetic", "Peaceful", "Romantic (Shringara)",
    "Angry (Raudra)", "Mysterious", "Funny (Hasya)", "Courageous (Veera)", "Playful (Kids)",
    "Devotional", "Philosophical", "Custom"
];

export const STYLE_OPTIONS = [
    AUTO_OPTION,
    // Indian / Local
    "Melody", "Fast Beat/Mass", "Classical (Carnatic/Hindustani)", "Folk (Teenmaar/Jaanapada)", "Ghazal/Sufi", "Devotional",
    // European / Western
    "Pop", "Rock", "Jazz", "Blues", "Classical (Western)", "Opera", "Electronic/EDM", "Techno", "House", "Trance",
    "Metal", "Punk", "Indie/Alternative", "R&B/Soul", "HipHop/Rap", "Reggae/Ska", "Disco/Funk",
    "Flamenco", "Celtic", "Synthwave", "Eurobeat", "Schlager", "Chanson",
    // Fusion
    "Western Fusion", "Indo-Western", "World Fusion",
    // Other
    "GenZ/Trendy", "Nursery Rhyme", "Anthem", "Custom"
];

export const COMPLEXITY_OPTIONS = [AUTO_OPTION, "Simple", "Poetic", "Complex"];

export const RHYME_SCHEME_OPTIONS = [
    AUTO_OPTION, "AABB", "ABAB", "ABCB", "AAAA", "AABCCB", "Free Verse", "Custom"
];

export const SINGER_CONFIG_OPTIONS = [
    AUTO_OPTION, "Male Solo", "Female Solo", "Duet (Male + Female)", "Group Chorus",
    "Child Solo", "Duet (Male + Male)", "Duet (Female + Female)", "Child Group", "Custom"
];

export const THEME_OPTIONS = [
    AUTO_OPTION, "Love", "Nature", "Urban", "Village", "War", "College", "Road Trip", "Rain", "Custom"
];
