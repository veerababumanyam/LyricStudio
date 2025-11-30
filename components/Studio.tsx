import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic, Send, Menu, Globe, Bot, Feather, BookOpen, CheckCircle, Sparkles, Heart, ShieldCheck, Video, FileCode, Settings as SettingsIcon, Zap, X, User
} from "lucide-react";

// Modular Imports - Adjusted for component directory depth
import { AgentType, Message, LanguageProfile, GenerationSettings, AppearanceSettings, SavedSong } from "../types";
import { runChatAgent } from "../agents/chat";
import { useOrchestrator } from "../hooks/useOrchestrator";
import { getSafeLocalStorage, setSafeLocalStorage } from "../utils";
import { DEFAULT_THEMES, SUGGESTION_CHIPS, ENHANCED_PROMPTS, AUTO_OPTION, MODEL_NAME } from "../config";
import { AVAILABLE_MODELS } from "../config/models";

// Component Imports
import { Sidebar } from "./Sidebar";
import { WorkflowStatus } from "./WorkflowStatus";
import { LyricsRenderer } from "./LyricsRenderer";
import { SettingsModal } from "./SettingsModal";
import { HelpModal } from "./HelpModal";
import { MoodBackground } from "./MoodBackground";
import { ErrorBoundary } from "./ErrorBoundary";

// --- Helpers ---
const renderAgentIcon = (agent?: AgentType) => {
  switch (agent) {
    case "RESEARCH": return <BookOpen className="w-4 h-4 text-blue-400" />;
    case "LYRICIST": return <Feather className="w-4 h-4 text-amber-400" />;
    case "REVIEW": return <CheckCircle className="w-4 h-4 text-green-400" />;
    case "EMOTION": return <Heart className="w-4 h-4 text-pink-500" />;
    case "COMPLIANCE": return <ShieldCheck className="w-4 h-4 text-red-400" />;
    case "MULTIMODAL": return <Video className="w-4 h-4 text-indigo-400" />;
    case "FORMATTER": return <FileCode className="w-4 h-4 text-cyan-400" />;
    case "ORCHESTRATOR": return <Sparkles className="w-4 h-4 text-purple-400" />;
    default: return <Bot className="w-4 h-4 text-muted-foreground" />;
  }
};

export const Studio = () => {
  // --- State Management ---
  // Sidebar should always remain accessible - this state persists across all operations
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Multi-modal State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Domain State
  const [languageSettings, setLanguageSettings] = useState<LanguageProfile>({
    primary: "Telugu",
    secondary: "English",
    tertiary: "Hindi"
  });

  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
    category: "",
    ceremony: "",
    theme: AUTO_OPTION,
    customTheme: "",
    mood: AUTO_OPTION,
    customMood: "",
    style: AUTO_OPTION,
    customStyle: "",
    complexity: AUTO_OPTION,
    rhymeScheme: AUTO_OPTION,
    customRhymeScheme: "",
    singerConfig: AUTO_OPTION,
    customSingerConfig: ""
  });

  // Saved Songs Library - Safe Init
  const [savedSongs, setSavedSongs] = useState<SavedSong[]>(() => {
    return getSafeLocalStorage("swaz_saved_songs", []);
  });

  // Appearance - Safe Init with Model Migration
  const [appearance, setAppearance] = useState<AppearanceSettings>(() => {
    // Ensure structure is valid even if local storage has partial/corrupt data
    const defaults = { fontSize: 16, themeId: "dark", customThemes: [], selectedModel: MODEL_NAME };
    const saved = getSafeLocalStorage("swaz_appearance", defaults);
    
    // Migration: Fix invalid model names (e.g., gemini-3.0-pro -> gemini-3-pro-preview)
    const validModelIds = AVAILABLE_MODELS.map(m => m.id);
    let selectedModel = saved.selectedModel || MODEL_NAME;
    
    // If the saved model is invalid, reset to default
    if (!validModelIds.includes(selectedModel)) {
      console.warn(`[MIGRATION] Invalid model "${selectedModel}" detected in localStorage. Resetting to default: ${MODEL_NAME}`);
      selectedModel = MODEL_NAME;
      
      // Update localStorage immediately to prevent repeated migrations
      const migratedSettings = { ...saved, selectedModel };
      setSafeLocalStorage("swaz_appearance", migratedSettings);
    }
    
    return {
      ...defaults,
      ...saved,
      selectedModel,
      customThemes: Array.isArray(saved.customThemes) ? saved.customThemes : []
    };
  });

  const { agentStatus, runSongGenerationWorkflow } = useOrchestrator();

  // --- Effects ---

  // Load Theme
  useEffect(() => {
    try {
      const customThemes = appearance.customThemes || [];
      const theme = [...DEFAULT_THEMES, ...customThemes].find(t => t.id === appearance.themeId) || DEFAULT_THEMES[0];

      const root = document.documentElement;
      if (theme?.colors) {
        root.style.setProperty('--bg-primary', theme.colors.bgMain);
        root.style.setProperty('--bg-secondary', theme.colors.bgSidebar);
        root.style.setProperty('--text-primary', theme.colors.textMain);
        root.style.setProperty('--text-secondary', theme.colors.textSecondary);
        root.style.setProperty('--accent-red', theme.colors.accent);
        root.style.setProperty('--brand-red-600', theme.colors.accent);
        root.style.setProperty('--border-default', theme.colors.border);
      }

      setSafeLocalStorage("swaz_appearance", appearance);
    } catch (e) {
      console.warn("Theme application warning:", e);
    }
  }, [appearance]);

  useEffect(() => {
    setSafeLocalStorage("swaz_saved_songs", savedSongs);
  }, [savedSongs]);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      try {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      } catch (e) { /* ignore scroll error */ }
    }
  }, [messages, agentStatus]);


  // --- Handlers ---
  const updateMessage = useCallback((id: string, updater: Partial<Message> | ((prev: Message) => Partial<Message>)) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === id) {
        const updates = typeof updater === 'function' ? updater(msg) : updater;
        return { ...msg, ...updates };
      }
      return msg;
    }));
  }, []);

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim() && !selectedImage) return;

    console.log(`[STUDIO] 📤 User sent message: "${text.substring(0, 50)}..."`);

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput("");
    setIsLoading(true);

    const lowerText = text.toLowerCase();
    const triggers = ["song", "lyrics", "write", "compose", "create", "generate", "ballad", "rap", "anthem"];
    const isSongRequest = triggers.some(t => lowerText.includes(t));
    console.log(`[STUDIO] Detected as ${isSongRequest ? 'SONG REQUEST' : 'CHAT REQUEST'}`);

    // Use selected model or default
    const activeModel = appearance.selectedModel || MODEL_NAME;

    if (isSongRequest) {
      await runSongGenerationWorkflow(
        text,
        languageSettings,
        generationSettings,
        (msg) => setMessages(prev => [...prev, msg]),
        updateMessage,
        activeModel // Pass model to orchestrator
      );
      setSelectedImage(null);
    } else {
      try {
        const response = await runChatAgent(
          text, 
          messages, 
          { 
            image: selectedImage ? selectedImage.split(',')[1] : undefined,
            context: {
              language: languageSettings,
              generation: generationSettings
            },
            modelName: activeModel // Pass model to chat agent
          }
        );
        const newAiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "model",
          content: response,
          senderAgent: "CHAT",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, newAiMsg]);
        setSelectedImage(null);
      } catch (error: any) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: "system",
          content: `⚠️ ${error.message || "Something went wrong."}`,
          timestamp: new Date()
        }]);
      }
    }
    setIsLoading(false);
  };

  const handleNewSong = () => {
    console.log("[STUDIO] 🎵 Starting new song composition");
    
    // Check for unsaved work
    if (messages.length > 0) {
      const hasLyrics = messages.some(msg => msg.role === 'assistant' && msg.content.trim().length > 0);
      
      if (hasLyrics) {
        // Custom confirmation with three options
        const userChoice = window.confirm(
          "You have unsaved lyrics. Start new song?\n\n" +
          "Click OK to discard and start new.\n" +
          "Click Cancel to go back and save first."
        );
        
        if (!userChoice) {
          // User clicked Cancel - scroll to save button area
          const lyricsRenderer = document.querySelector('[data-lyrics-renderer]');
          if (lyricsRenderer) {
            lyricsRenderer.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          return;
        }
      }
    }
    
    // Clear state and start fresh
    setMessages([]);
    setInput("");
    setSelectedImage(null);
    setIsLoading(false);
    // Note: Sidebar state (isSidebarOpen) is intentionally NOT reset - sidebar should always remain accessible
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setSelectedImage(reader.result as string);
        reader.readAsDataURL(file);
      }
    } catch (e) {
      console.error("Image upload failed", e);
      alert("Failed to load image. Please try another one.");
    }
  };

  const handleSaveSong = (data: any) => {
    const newSong: SavedSong = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...data
    };
    setSavedSongs([newSong, ...savedSongs]);
  };

  const handleLoadSong = (song: SavedSong) => {
    const msg: Message = {
      id: Date.now().toString(),
      role: "model",
      content: song.content,
      sunoFormattedContent: song.sunoContent,
      sunoStylePrompt: song.sunoStylePrompt,
      lyricsData: { title: song.title, language: song.language },
      timestamp: new Date(),
      senderAgent: "ORCHESTRATOR"
    };
    setMessages(prev => [...prev, msg]);
  };

  const handleDeleteSong = (id: string) => {
    setSavedSongs(savedSongs.filter(s => s.id !== id));
  };

  // Studio Welcome Component...
  const StudioWelcome = () => (
    <div className="flex flex-col items-center text-center px-6 py-12 md:py-20 animate-in fade-in duration-700 space-y-8 max-w-4xl mx-auto h-full justify-center">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider shadow-sm">
        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        #1 Rated AI Lyricist & Orchestrator
      </div>
      <div className="space-y-6">
        <h1 className="text-4xl md:text-6xl font-cinema font-bold text-foreground tracking-tight leading-none">
          Compose Your Hits <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500">Instantly & Securely</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Professional lyric generation for Indian Cinema, Global Pop, and Fusion. We combine <span className="text-foreground font-medium">deep cultural context</span> with advanced poetic algorithms to get your lyrics ready fast.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4">
        <button
          onClick={() => document.getElementById("studio-input")?.focus()}
          className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg shadow-primary/25 hover:scale-105 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2"
        >
          <Mic className="w-4 h-4" />
          Start Composing
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 w-full max-w-3xl border-t border-border/40 mt-8">
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-green-500/10 rounded-full text-green-600"><ShieldCheck className="w-5 h-5" /></div>
          <div className="text-sm font-bold">Enterprise-Grade Privacy</div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-blue-500/10 rounded-full text-blue-600"><CheckCircle className="w-5 h-5" /></div>
          <div className="text-sm font-bold">99.9% Originality Score</div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-purple-500/10 rounded-full text-purple-600"><Zap className="w-5 h-5" /></div>
          <div className="text-sm font-bold">24/7 Creative Support</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden" style={{ fontSize: `${appearance.fontSize}px` }}>

      {/* Sidebar - Isolated Error Boundary */}
      <ErrorBoundary scope="Sidebar">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          agentStatus={agentStatus}
          languageSettings={languageSettings}
          onLanguageChange={(k, v) => setLanguageSettings(prev => ({ ...prev, [k]: v }))}
          generationSettings={generationSettings}
          onSettingChange={(k, v) => setGenerationSettings(prev => ({ ...prev, [k]: v }))}
          onLoadProfile={(l, g) => {
            setLanguageSettings(l);
            setGenerationSettings(g);
          }}
          onOpenHelp={() => setIsHelpOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          savedSongs={savedSongs}
          onDeleteSong={handleDeleteSong}
          onLoadSong={handleLoadSong}
          fontSize={appearance.fontSize}
        />
      </ErrorBoundary>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative">
        <MoodBackground mood={generationSettings.mood} />

        {/* Top Bar */}
        <header className="h-16 border-b border-border flex items-center justify-between px-4 bg-background/50 backdrop-blur-sm z-20">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-secondary rounded-md">
                <Menu className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
            <div className="flex items-center gap-2 px-3 py-1 bg-secondary/50 rounded-full border border-border/50">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">
                {languageSettings.primary}
                {languageSettings.secondary !== languageSettings.primary && ` + ${languageSettings.secondary}`}
              </span>
            </div>
            {generationSettings.ceremony && (
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 text-purple-500 rounded-full border border-purple-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-xs font-bold truncate max-w-[150px]">{generationSettings.theme}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewSong}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-primary/10 text-primary border border-primary/20 hover:border-primary/40"
              title="Create New Song"
              aria-label="Create New Song - Start a fresh composition (will prompt if you have unsaved work)"
            >
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">New Song</span>
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-full transition-colors hover:bg-secondary text-muted-foreground"
              title="Theme Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Chat / Content Area - Isolated Error Boundary */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 relative z-10 scrollbar-thin scrollbar-thumb-border">
          <ErrorBoundary scope="Chat Area">
            {messages.length === 0 ? (
              <StudioWelcome />
            ) : (
              <div className="max-w-3xl mx-auto space-y-6 pb-10">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary border border-border"}`}>
                      {msg.role === "user" ? <User className="w-4 h-4" /> : renderAgentIcon(msg.senderAgent)}
                    </div>

                    <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      <div className={`p-4 rounded-2xl shadow-sm text-base leading-relaxed whitespace-pre-wrap border select-text ${msg.role === "user"
                          ? "bg-primary text-primary-foreground border-transparent rounded-tr-none"
                          : "glass-panel text-foreground rounded-tl-none"
                        }`}>
                        <ErrorBoundary scope="Message Content" fallback={<p className="text-red-500 italic">Error rendering message content.</p>}>
                          {/* Render Special Content: Lyrics or Normal Text */}
                          {msg.lyricsData || (msg.senderAgent === "LYRICIST" || msg.senderAgent === "ORCHESTRATOR") ? (
                            <LyricsRenderer
                              content={msg.content}
                              sunoContent={msg.sunoFormattedContent}
                              sunoStylePrompt={msg.sunoStylePrompt}
                              onSave={handleSaveSong}
                            />
                          ) : (
                            msg.content
                          )}
                        </ErrorBoundary>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 ml-1">
                        <span className="text-xs text-muted-foreground opacity-70">
                          {msg.senderAgent ? `${msg.senderAgent} • ` : ""} {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {msg.complianceReport && msg.complianceReport.originalityScore < 80 && (
                        <div className="mt-2 text-xs flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Originality Score: {msg.complianceReport.originalityScore}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {agentStatus.active && (
                  <div className="flex justify-start">
                    <WorkflowStatus status={agentStatus} />
                  </div>
                )}

                {isLoading && !agentStatus.active && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><Bot className="w-4 h-4 animate-pulse" /></div>
                    <div className="glass-panel p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ErrorBoundary>
        </main>

        {/* Input Area */}
        <footer className="p-4 bg-background/60 backdrop-blur-md border-t border-border z-20">
          <div className="max-w-3xl mx-auto relative">
            {selectedImage && (
              <div className="absolute bottom-full left-0 mb-2 p-2 bg-secondary rounded-lg shadow-lg flex items-start gap-2 animate-in slide-in-from-bottom-2">
                <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-md" />
                <button onClick={() => setSelectedImage(null)} className="p-1 bg-background rounded-full hover:text-destructive"><X className="w-3 h-3" /></button>
              </div>
            )}

            {messages.length === 0 && (
              <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mask-linear-fade">
                {SUGGESTION_CHIPS["default"].map(chip => (
                  <button
                    key={chip}
                    onClick={() => handleSendMessage(ENHANCED_PROMPTS[chip] || chip)}
                    className="whitespace-nowrap px-3 py-2 bg-secondary/50 hover:bg-secondary text-sm font-medium text-muted-foreground hover:text-primary rounded-full border border-border transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            <div className="glass-panel p-1.5 rounded-2xl flex items-center gap-2 shadow-lg ring-1 ring-white/10">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-muted-foreground hover:text-primary hover:bg-secondary/50 rounded-xl transition-colors"
                title="Upload Image for context"
              >
                <span className="sr-only">Upload</span>
                <div className="w-5 h-5 border-2 border-current border-dashed rounded-md flex items-center justify-center">
                  <span className="text-[10px] font-bold">+</span>
                </div>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

              <input
                id="studio-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Describe the song (e.g., 'Sad breakup song in rain')..."
                disabled={isLoading || agentStatus.active}
                className="flex-1 bg-transparent border-none focus:ring-0 text-foreground placeholder-muted-foreground text-base px-3 py-2"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={(!input && !selectedImage) || isLoading}
                className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center mt-2">
              <p className="text-xs text-muted-foreground opacity-70">
                SWAZ AI can make mistakes. Check generated lyrics for accuracy.
              </p>
            </div>
          </div>
        </footer>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={appearance}
        onUpdateSettings={setAppearance}
      />
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
};
