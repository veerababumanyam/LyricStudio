
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";

import { Message, SavedSong, ViewState } from "../types";
import { runChatAgent } from "../agents/chat";
import { useOrchestrator } from "../hooks/useOrchestrator";
import { useStudio } from "../contexts/StudioContext";

import { Header } from "./Header";
import { SwaraSutraSidebar } from "./SwaraSutraSidebar";
import { HelpModal } from "./HelpModal";
import { MoodBackground } from "./MoodBackground";
import { ErrorBoundary } from "./ErrorBoundary";
import { TutorialOverlay } from "./TutorialOverlay";
import { ChatInterface } from "./ChatInterface";
import { ComposerInput } from "./ComposerInput";
import { RhythmTapper } from "./tools/RhythmTapper";
import { Dashboard } from "./Dashboard";
import { LiveBrainstorm } from "./tools/LiveBrainstorm";

const Studio = () => {
  const {
    languageSettings,
    generationSettings,
    addSavedSong,
    appearance,
    isSidebarOpen, setIsSidebarOpen
  } = useStudio();

  const location = useLocation();
  const [viewState, setViewState] = useState<ViewState>('DASHBOARD');

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const sendInFlightRef = useRef(false);
  const autoPromptRef = useRef<string | null>(null);

  // Updated to support both images and videos
  const [selectedVisual, setSelectedVisual] = useState<{ data: string, mimeType: string, type: 'image' | 'video', fileName: string } | null>(null);

  const [selectedAudio, setSelectedAudio] = useState<{ data: string, mimeType: string, fileName: string } | null>(null);

  // Rhythm Tapper State
  const [isTapperOpen, setIsTapperOpen] = useState(false);
  const [rhythmContext, setRhythmContext] = useState<string | null>(null);

  const { agentStatus, runSongGenerationWorkflow } = useOrchestrator();

  // Load chat session from local storage on mount
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem("swarasutra_chat_session");
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        // Re-hydrate Date objects
        const hydratedMessages = parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        setMessages(hydratedMessages);
        if (hydratedMessages.length > 0) {
          setViewState('CHAT');
        }
      }
    } catch (e) {
      console.error("Failed to load chat session", e);
    }

    // Check for API key in env or localStorage
    const savedKey = localStorage.getItem("swarasutra_api_key");
    setHasApiKey(!!process.env.API_KEY || !!savedKey);
  }, []);

  // Save chat session to local storage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("swarasutra_chat_session", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const promptParam = params.get("prompt");
    if (promptParam) {
      if (autoPromptRef.current === promptParam) return;
      autoPromptRef.current = promptParam;
      setViewState('CHAT');
      handleSendMessage(decodeURIComponent(promptParam));
    }
  }, [location]);

  const updateMessage = useCallback((id: string, newContent: Partial<Message>) => {
    setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, ...newContent } : msg));
  }, []);

  const handleLoadSong = useCallback((song: SavedSong) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "model",
      content: song.content,
      senderAgent: "ORCHESTRATOR",
      timestamp: new Date(),
      sunoFormattedContent: song.sunoContent,
      sunoStylePrompt: song.sunoStylePrompt,
      lyricsData: {
        title: song.title,
        language: song.language
      }
    }]);
    setViewState('CHAT');
  }, []);

  const handleNewChat = (initialPrompt?: string) => {
    setMessages([]);
    setSelectedVisual(null);
    setSelectedAudio(null);
    setRhythmContext(null);
    setInput("");
    setIsLoading(false);
    localStorage.removeItem("swarasutra_chat_session");
    setViewState('CHAT');

    if (initialPrompt) {
      handleSendMessage(initialPrompt);
    }
  };

  const handleLiveSessionEnd = (transcript?: string) => {
    setViewState('CHAT'); // Go back to chat
    if (transcript && transcript.trim().length > 0) {
      // Inject the transcript as a user message so the AI knows context
      const transcriptMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: `[LIVE BRAINSTORM SESSION TRANSCRIPT]\n${transcript}\n\n[INSTRUCTION]: Use the ideas discussed above to generate the next output.`,
        timestamp: new Date(),
        senderAgent: undefined
      };
      setMessages(prev => [...prev, transcriptMsg]);
      // Trigger a response acknowledging the session
      handleSendMessage("Analyze the brainstorm session and suggest a structure based on it.");
    }
  };

  const handleSendMessage = async (text: string = input) => {
    const trimmedText = text.trim();
    if (!trimmedText && !selectedVisual && !selectedAudio) return;
    // Prevent double-submission while a workflow is in progress
    if (isLoading) return;
    if (sendInFlightRef.current) return;
    sendInFlightRef.current = true;

    setViewState('CHAT');

    // Create base message
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmedText || (selectedAudio ? "Analyzing audio track..." : (selectedVisual?.type === 'video' ? "Analyzing video..." : "Uploading scenario...")),
      timestamp: new Date()
    };

    if (selectedAudio) {
      newMessage.audioData = selectedAudio;
    }

    if (selectedVisual) {
      newMessage.visualData = selectedVisual;
    }

    setMessages(prev => [...prev, newMessage]);
    setInput("");
    setIsLoading(true);

    // Expanded Keyword List for Indian Languages & Song Structure
    const songKeywords = [
      "song", "lyrics", "write", "compose", "stanza", "pallavi", "melody", "verse",
      "paata", "geetham", "sahityam", "kavitha", "gaana", "dhun", "shairi", "gazal",
      "charanam", "anupallavi", "mukhda", "antara", "intro", "chorus", "bridge",
      "hook", "rap", "create", "make", "generate", "start", "about", "context", "analyze", "structure"
    ];

    const isSongRequest =
      songKeywords.some(t => trimmedText.toLowerCase().includes(t))
      || !!selectedVisual
      || !!selectedAudio
      || (!!generationSettings.ceremony && generationSettings.ceremony !== "" && trimmedText.length > 0);

    // Visual Part (Image/Video) for Agent
    const visualPart = selectedVisual ? {
      data: selectedVisual.data,
      mimeType: selectedVisual.mimeType,
      type: selectedVisual.type
    } : undefined;

    // Audio Part for Agent
    const audioPart = selectedAudio ? {
      data: selectedAudio.data,
      mimeType: selectedAudio.mimeType,
      fileName: selectedAudio.fileName
    } : undefined;

    try {
      if (isSongRequest) {
        await runSongGenerationWorkflow(
          trimmedText,
          languageSettings,
          generationSettings,
          (msg) => setMessages(prev => [...prev, msg]),
          updateMessage,
          visualPart,
          audioPart,
          rhythmContext || undefined // Pass rhythm if set
        );
        setSelectedVisual(null);
        setSelectedAudio(null);
        // Optional: Clear rhythm after use or keep it? Keeping it allows iteration.
      } else {
        try {
          const response = await runChatAgent(trimmedText, messages, {
            visual: (visualPart && visualPart.type === 'image') ? { data: visualPart.data, mimeType: visualPart.mimeType } : undefined,
            model: appearance.llmModel
          });
          setMessages(prev => [...prev, { id: Date.now().toString(), role: "model", content: response, senderAgent: "CHAT", timestamp: new Date() }]);
          setSelectedVisual(null);
          setSelectedAudio(null);
        } catch (error: any) {
          setMessages(prev => [...prev, { id: Date.now().toString(), role: "system", content: `⚠️ Orchestration Error: ${error.message}`, timestamp: new Date() }]);
        }
      }
    } finally {
      setIsLoading(false);
      sendInFlightRef.current = false;
    }
  };

  return (
    <div className={`flex h-[100dvh] bg-background text-foreground transition-[padding] duration-500 ease-in-out overflow-hidden ${isSidebarOpen ? 'lg:pl-[calc(var(--sidebar-w)+2rem)]' : 'pl-0'}`} style={{ fontSize: `${appearance.fontSize}px`, '--sidebar-w': `${appearance.sidebarWidth || 340}px` } as React.CSSProperties}>

      {/* Global Ambient Background - Moved to root to cover sidebar area */}
      <div className="fixed inset-0 parallax-layer-0 z-0 pointer-events-none">
        <MoodBackground mood={generationSettings.mood} />
      </div>

      <TutorialOverlay />
      <SwaraSutraSidebar onClose={() => setIsSidebarOpen(false)} agentStatus={agentStatus} onLoadProfile={() => { }} onOpenHelp={() => setIsHelpOpen(true)} onOpenSettings={() => setIsSidebarOpen(true)} onLoadSong={handleLoadSong} />

      <div className="flex-1 flex flex-col min-h-0 relative z-10">

        {/* ─── Unified Header ─── */}
        <Header
          viewState={viewState}
          setViewState={setViewState}
          onNewChat={() => handleNewChat()}
          onOpenLive={() => setViewState('LIVE')}
          onOpenHelp={() => setIsHelpOpen(true)}
          agentStatus={agentStatus}
          hasMessages={messages.length > 0}
        />

        <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 relative z-10 scrollbar-hide parallax-layer-1">
          <ErrorBoundary scope="Studio Workspace">
            {viewState === 'DASHBOARD' && (
              <Dashboard
                onNewChat={handleNewChat}
                onOpenLive={() => setViewState('LIVE')}
                onLoadProject={(id) => console.log(id)}
              />
            )}

            {viewState === 'CHAT' && (
              <ChatInterface
                messages={messages}
                agentStatus={agentStatus}
                onSaveSong={addSavedSong}
              />
            )}

            {viewState === 'LIVE' && (
              <LiveBrainstorm
                onClose={handleLiveSessionEnd}
                languageContext={languageSettings.primary}
              />
            )}
          </ErrorBoundary>
        </main>

        {viewState === 'CHAT' && (
          <ComposerInput
            input={input}
            setInput={setInput}
            onSend={() => handleSendMessage()}
            isLoading={isLoading}
            isAgentActive={agentStatus.active}
            selectedVisual={selectedVisual}
            setSelectedVisual={setSelectedVisual}
            selectedAudio={selectedAudio}
            setSelectedAudio={setSelectedAudio}
            onOpenTapper={() => setIsTapperOpen(true)}
            rhythmContext={rhythmContext}
            onClearRhythm={() => setRhythmContext(null)}
            onOpenLive={() => setViewState('LIVE')}
          />
        )}
      </div>
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <RhythmTapper isOpen={isTapperOpen} onClose={() => setIsTapperOpen(false)} onApply={setRhythmContext} />
    </div>
  );
};

export default Studio;
