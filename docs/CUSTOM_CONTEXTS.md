# Custom Context System (Music Library)

## Overview
The Custom Context System (branded as "Music Library" in the UI) allows users to create, manage, and use their own context categories and sub-contexts for song generation. This system provides complete flexibility for users to define any type of musical context they need, beyond the built-in scenarios.

## Features

### ✨ Core Capabilities
- **Create Custom Contexts**: Define your own context categories (e.g., "Movie Genres", "Moods", "Seasons")
- **Add Sub-Contexts**: Each context can have multiple sub-contexts with detailed configurations
- **Persistent Storage**: All custom contexts are saved to localStorage and persist across browser sessions
- **Dynamic Integration**: Custom contexts seamlessly integrate with the AI agents
- **Full CRUD Operations**: Create, Read, Update, Delete for both contexts and sub-contexts
- **Default Settings**: Configure default mood, style, complexity, and other parameters for each sub-context

### 🎯 User Benefits
- **Unlimited Flexibility**: Create contexts for any purpose (genres, emotions, scenarios, events, etc.)
- **Reusability**: Save frequently used contexts and reuse them across sessions
- **Customization**: Define exact prompts and settings for AI to generate specific types of songs
- **Organization**: Organize contexts hierarchically with clear categories and sub-categories

## Architecture

### Component Structure
```
components/
  ├── ContextManager.tsx       # Main UI for managing custom contexts
  └── Sidebar.tsx              # Integrated context selection UI

types/
  └── context.ts               # TypeScript interfaces for custom contexts

utils/
  └── context-storage.ts       # localStorage management functions

agents/
  └── lyricist.ts             # Updated to use custom context prompts
```

### Data Flow
1. User creates/edits contexts in ContextManager
2. Contexts saved to localStorage via context-storage utilities
3. User selects a sub-context from the sidebar
4. Selection stored in GenerationSettings
5. Lyricist agent retrieves custom context and uses it in prompts
6. AI generates song based on custom context instructions

## API Reference

### Types

#### CustomContext
```typescript
interface CustomContext {
  id: string;                    // Unique identifier
  name: string;                  // Display name (e.g., "Movie Genres")
  description?: string;          // Optional description
  icon?: string;                 // Emoji or icon
  subContexts: SubContext[];     // Array of sub-contexts
  createdAt: number;             // Creation timestamp
  updatedAt: number;             // Last update timestamp
}
```

#### SubContext
```typescript
interface SubContext {
  id: string;                    // Unique identifier
  name: string;                  // Display name (e.g., "Action Thriller")
  value: string;                 // Value used in settings
  promptContext: string;         // Instructions for AI agent
  defaultMood?: string;          // Auto-fill mood setting
  defaultStyle?: string;         // Auto-fill style setting
  defaultComplexity?: string;    // Auto-fill complexity setting
  defaultRhyme?: string;         // Auto-fill rhyme scheme
  defaultSinger?: string;        // Auto-fill singer config
  suggestedKeywords?: string[];  // Keywords for AI
}
```

### Storage Functions

#### Load Contexts
```typescript
loadCustomContexts(): CustomContext[]
```
Retrieves all saved custom contexts from localStorage.

#### Save Contexts
```typescript
saveCustomContexts(contexts: CustomContext[]): void
```
Persists contexts to localStorage.

#### Add Context
```typescript
addCustomContext(context: Omit<CustomContext, 'id' | 'createdAt' | 'updatedAt'>): CustomContext
```
Creates a new custom context with auto-generated ID and timestamps.

#### Update Context
```typescript
updateCustomContext(id: string, updates: Partial<CustomContext>): void
```
Updates an existing context by ID.

#### Delete Context
```typescript
deleteCustomContext(id: string): void
```
Removes a context and all its sub-contexts.

#### Add Sub-Context
```typescript
addSubContext(contextId: string, subContext: Omit<SubContext, 'id'>): void
```
Adds a new sub-context to an existing context.

#### Update Sub-Context
```typescript
updateSubContext(contextId: string, subContextId: string, updates: Partial<SubContext>): void
```
Updates an existing sub-context.

#### Delete Sub-Context
```typescript
deleteSubContext(contextId: string, subContextId: string): void
```
Removes a specific sub-context from a context.

#### Context Selection
```typescript
saveContextSelection(contextId: string, subContextId: string): void
loadContextSelection(): { contextId: string; subContextId: string } | null
```
Saves and loads the currently selected context.

## Usage Guide

### Creating a New Context

1. **Open Sidebar**: Navigate to the "Music Library" section
2. **Click "New"**: Opens the context creation form
3. **Fill Details**:
   - Name: e.g., "Movie Genres"
   - Description: e.g., "Different film genre contexts"
   - Icon: e.g., "🎬"
4. **Save**: Context is created and ready for sub-contexts

### Adding Sub-Contexts

1. **Expand Context**: Click on a context to expand it
2. **Click "Add Sub-Context"**: Opens the sub-context form
3. **Fill Required Fields**:
   - Name: e.g., "Action Thriller"
   - Prompt Context: Detailed instructions for AI
   ```
   Context: High-energy action thriller. Fast-paced narrative with
   tension, chase sequences, explosions. Intense drums, electric guitars.
   Lyrics should convey danger, urgency, and heroism.
   ```
4. **Add Keywords** (Optional): "Chase, Danger, Hero, Victory"
5. **Set Defaults** (Optional):
   - Mood: "Energetic"
   - Style: "Rock"
   - Complexity: "Simple"
6. **Save**: Sub-context is now selectable

### Using Custom Contexts

1. **Select Sub-Context**: Click on any sub-context in the Music Library
2. **Active Indicator**: Selected context shows with a checkmark and highlight
3. **Auto-Configuration**: Default settings automatically applied
4. **Generate Song**: Use the chat to request song generation
5. **AI Integration**: Your custom context instructions are sent to AI agents

### Editing Contexts

1. **Context Level**: Click the edit icon (✏️) next to context name
2. **Sub-Context Level**: Click edit icon next to sub-context name
3. **Modify**: Update any fields
4. **Save/Cancel**: Confirm changes or cancel

### Deleting Contexts

- **Delete Context**: Removes context and ALL its sub-contexts (confirmation required)
- **Delete Sub-Context**: Removes only the specific sub-context (confirmation required)

## Examples

### Example 1: Movie Genres Context

**Context**:
- Name: "🎬 Movie Genres"
- Description: "Contexts for different film genres"

**Sub-Contexts**:

1. **Romantic Comedy**
   - Prompt: "Light-hearted romantic comedy. Playful banter, cute moments, feel-good vibes."
   - Keywords: ["Love", "Funny", "Happy", "Light"]
   - Defaults: Mood=Playful, Style=Pop

2. **Horror Thriller**
   - Prompt: "Dark, suspenseful horror atmosphere. Eerie, mysterious, building tension."
   - Keywords: ["Dark", "Fear", "Mystery", "Suspense"]
   - Defaults: Mood=Mysterious, Style=Electronic/EDM

3. **Epic Fantasy**
   - Prompt: "Grand fantasy epic. Magical realms, heroic quests, orchestral grandeur."
   - Keywords: ["Magic", "Quest", "Hero", "Epic"]
   - Defaults: Mood=Courageous, Style=Classical

### Example 2: Seasonal Contexts

**Context**:
- Name: "🌦️ Seasons"
- Description: "Songs for different seasons"

**Sub-Contexts**:

1. **Summer Beach**
   - Prompt: "Sunny summer beach vibes. Carefree, vacation mode, ocean breeze."
   - Keywords: ["Sun", "Beach", "Ocean", "Freedom"]

2. **Winter Cozy**
   - Prompt: "Warm winter indoors. Fireplace, hot cocoa, snow outside."
   - Keywords: ["Snow", "Cozy", "Warmth", "Comfort"]

3. **Spring Bloom**
   - Prompt: "Fresh spring awakening. New beginnings, flowers, renewal."
   - Keywords: ["Bloom", "Fresh", "New", "Growth"]

### Example 3: Cultural Events

**Context**:
- Name: "🎊 Cultural Celebrations"
- Description: "Different cultural festivals and celebrations"

**Sub-Contexts**:

1. **Diwali Festival**
   - Prompt: "Festival of Lights. Celebration, joy, family gatherings, fireworks."
   - Keywords: ["Light", "Joy", "Family", "Celebration"]

2. **Christmas**
   - Prompt: "Christmas celebration. Joy, giving, family, winter magic."
   - Keywords: ["Joy", "Family", "Magic", "Giving"]

## Integration with AI Agents

### Lyricist Agent Integration

When a custom context is selected:

```typescript
// Custom context takes priority over built-in scenarios
if (generationSettings?.customContextId && generationSettings?.customSubContextId) {
  const { context, subContext } = getContextById(
    generationSettings.customContextId,
    generationSettings.customSubContextId
  );
  
  // Build scenario instruction from custom context
  scenarioInstruction = `
    CUSTOM CONTEXT: ${context.name} - ${subContext.name}
    ${subContext.promptContext}
    SUGGESTED KEYWORDS: ${subContext.suggestedKeywords.join(", ")}
    INSTRUCTION: Use this custom context to inform the lyrical content.
  `;
}
```

The AI agent receives your custom instructions and generates lyrics accordingly.

## Best Practices

### Writing Effective Prompt Contexts

1. **Be Specific**: Describe the exact mood, setting, and emotional tone
2. **Include Sensory Details**: Mention visuals, sounds, and feelings
3. **Set Expectations**: What should the lyrics convey?
4. **Use Examples**: Reference similar songs or styles if helpful

**Good Example**:
```
Context: Late-night jazz club. Smooth saxophone, dim lights, 
intimate atmosphere. Lyrics should be sultry and sophisticated, 
with themes of romance and nostalgia. Think "Fly Me to the Moon" 
meets modern R&B.
```

**Poor Example**:
```
Context: Jazz song
```

### Organizing Contexts

1. **Group by Theme**: Create contexts for related concepts
2. **Use Clear Names**: Make contexts easy to find and recognize
3. **Add Descriptions**: Help future you remember what each context is for
4. **Choose Good Icons**: Visual cues help quick identification

### Default Settings Strategy

- **Use Defaults When**: You always want certain settings for that context
- **Skip Defaults When**: You want flexibility to change settings per song
- **Example**: A "Heavy Metal" sub-context should probably default to:
  - Style: "Rock" or "Metal"
  - Mood: "Energetic" or "Angry"
  - Complexity: "Simple" (punchy lyrics)

## Troubleshooting

### Contexts Not Persisting
- **Issue**: Contexts disappear after refresh
- **Solution**: Check browser localStorage is enabled and not full

### Context Not Applying to AI
- **Issue**: AI ignores custom context
- **Solution**: Ensure sub-context is selected (highlighted) before generating

### Can't Edit Context
- **Issue**: Edit button doesn't work
- **Solution**: Refresh page and try again; check browser console for errors

### Lost All Contexts
- **Issue**: All custom contexts disappeared
- **Solution**: Check browser localStorage manually (`swaz_custom_contexts` key)

## Future Enhancements

### Planned Features
- [ ] Export/Import contexts as JSON files
- [ ] Share contexts with other users
- [ ] Context templates library
- [ ] AI-suggested context improvements
- [ ] Context versioning and history
- [ ] Collaborative context editing
- [ ] Context analytics (most used, success rate)

## Technical Notes

### localStorage Limits
- Maximum size: ~5-10MB depending on browser
- Stored as JSON strings
- Cleared when browser cache is cleared
- Accessible only from same domain

### Performance Considerations
- Contexts loaded once on sidebar mount
- Updates trigger immediate localStorage save
- No network requests required
- Minimal memory footprint

### Browser Compatibility
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Requires localStorage API support
- Falls back gracefully if localStorage unavailable

## Support

For issues or feature requests related to the Custom Context System:
1. Check this documentation first
2. Review examples and best practices
3. Check browser console for error messages
4. Open GitHub issue with reproduction steps

---

**Last Updated**: November 30, 2025  
**Version**: 1.0.0  
**Component**: Music Library (Custom Context System)
