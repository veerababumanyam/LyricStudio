import { useState } from "react";
import { AgentStatus, AgentStep, Message, LanguageProfile, GenerationSettings, EmotionAnalysis } from "../types";
import { runMultiModalAgent } from "../agents/multimodal";
import { runEmotionAgent } from "../agents/emotion";
import { runResearchAgent } from "../agents/research";
import { runLyricistAgent } from "../agents/lyricist";
import { runComplianceAgent } from "../agents/compliance";
import { runReviewAgent } from "../agents/review";
import { runFormatterAgent } from "../agents/formatter";
import { GeminiError, wrapGenAIError } from "../utils";
import { AUTO_OPTION } from "../config";

export const useOrchestrator = () => {
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    active: false,
    currentAgent: "CHAT",
    message: "Ready",
    steps: []
  });

  const updateAgentStep = (stepId: string, status: 'active' | 'completed') => {
    setAgentStatus(prev => ({
      ...prev,
      steps: prev.steps.map(s => s.id === stepId ? { ...s, status } : s)
    }));
  };

  const resolveAutoSettings = (gen: GenerationSettings, emotion: EmotionAnalysis): GenerationSettings => {
    try {
      const resolved = { ...gen };
      if (resolved.mood === AUTO_OPTION) resolved.mood = `${emotion.navarasa} (${emotion.sentiment})`;
      if (resolved.theme === AUTO_OPTION) resolved.theme = emotion.vibeDescription || "General";
      if (resolved.style === AUTO_OPTION) {
        if (emotion.intensity >= 8 || ['Raudra', 'Veera', 'Hasya'].includes(emotion.navarasa)) resolved.style = "Fast Beat/Mass";
        else if (['Shringara', 'Karuna', 'Shanta'].includes(emotion.navarasa)) resolved.style = "Melody";
        else resolved.style = "Folk";
      }
      if (resolved.singerConfig === AUTO_OPTION) {
        if (emotion.navarasa.includes("Shringara")) resolved.singerConfig = "Duet (Male + Female)";
        else if (emotion.navarasa.includes("Hasya")) resolved.singerConfig = "Group Chorus";
        else resolved.singerConfig = "Male Solo";
      }
      if (resolved.complexity === AUTO_OPTION) resolved.complexity = emotion.intensity > 7 ? "Simple" : "Poetic";
      if (resolved.rhymeScheme === AUTO_OPTION) resolved.rhymeScheme = "AABB";
      return resolved;
    } catch (e) {
      console.warn("Auto-settings resolution failed, using defaults", e);
      return { ...gen, mood: "Happy", theme: "General", style: "Melody", complexity: "Simple", rhymeScheme: "AABB" };
    }
  };

  const runSongGenerationWorkflow = async (
    request: string,
    languageSettings: LanguageProfile,
    genSettings: GenerationSettings,
    addMessage: (msg: Message) => void,
    updateMessage: (id: string, msg: Partial<Message>) => void
  ) => {
    const workflowId = Date.now().toString();
    const finalMsgId = workflowId + "_final";
    const isMixed = languageSettings.primary !== languageSettings.secondary || languageSettings.primary !== languageSettings.tertiary;
    const langLabel = isMixed ? `${languageSettings.primary} Mix` : languageSettings.primary;

    const initialSteps: AgentStep[] = [
      { id: 'multimodal', label: 'Multimodal: Processing Input', status: 'pending' },
      { id: 'emotion', label: 'Emotion: Analyzing Vibe', status: 'pending' },
      { id: 'research', label: 'Research: Context & Culture', status: 'pending' },
      { id: 'lyricist', label: `Lyricist: Composing in ${langLabel}`, status: 'pending' },
      { id: 'compliance', label: 'Compliance: Plagiarism Check', status: 'pending' },
      { id: 'review', label: 'Review: Polishing', status: 'pending' },
      { id: 'formatter', label: 'Formatter: Suno Style', status: 'pending' },
      { id: 'final', label: 'Orchestrator: Finalizing', status: 'pending' },
    ];

    try {
      setAgentStatus({
        active: true,
        currentAgent: "MULTIMODAL",
        message: "Processing inputs...",
        steps: initialSteps.map(s => s.id === 'multimodal' ? { ...s, status: 'active' } : s)
      });

      let processedContext = request;
      try {
        processedContext = await runMultiModalAgent(request, undefined, undefined);
      } catch (e) {
        console.warn("Multimodal step failed non-critically", e);
      }
      updateAgentStep('multimodal', 'completed');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limit protection

      setAgentStatus(prev => ({ ...prev, currentAgent: "EMOTION", message: "Feeling the vibe...", steps: prev.steps.map(s => s.id === 'emotion' ? { ...s, status: 'active' } : s) }));
      let emotionData: EmotionAnalysis = {
        sentiment: "Neutral", navarasa: "Shanta", intensity: 5, suggestedKeywords: [], vibeDescription: "Balanced"
      };
      let resolvedSettings = { ...genSettings };

      try {
        emotionData = await runEmotionAgent(processedContext);
        resolvedSettings = resolveAutoSettings(genSettings, emotionData);
      } catch (e) {
        console.warn("Emotion agent failed, using defaults", e);
      }
      updateAgentStep('emotion', 'completed');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limit protection

      setAgentStatus(prev => ({ ...prev, currentAgent: "RESEARCH", message: `Analyzing context (${resolvedSettings.mood})...`, steps: prev.steps.map(s => s.id === 'research' ? { ...s, status: 'active' } : s) }));
      let researchData = "";
      try {
        researchData = await runResearchAgent(processedContext, `${resolvedSettings.mood} - ${resolvedSettings.theme}`);
      } catch (e) {
        console.warn("Research agent failed, skipping context", e);
      }
      updateAgentStep('research', 'completed');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limit protection

      setAgentStatus(prev => ({ ...prev, currentAgent: "LYRICIST", message: `Composing (${resolvedSettings.style})...`, steps: prev.steps.map(s => s.id === 'lyricist' ? { ...s, status: 'active' } : s) }));

      let messageCreated = false;
      let draftLyrics = "";

      // CRITICAL STEP: Lyric generation
      try {
        draftLyrics = await runLyricistAgent(
          researchData,
          processedContext,
          languageSettings,
          emotionData,
          resolvedSettings,
          (partialText) => {
            if (!messageCreated) {
              addMessage({
                id: finalMsgId,
                role: "model",
                content: partialText,
                senderAgent: "LYRICIST",
                timestamp: new Date()
              });
              messageCreated = true;
            } else {
              updateMessage(finalMsgId, { content: partialText });
            }
          }
        );

        if (!draftLyrics) throw new GeminiError("The lyricist could not generate any content.", 'SERVER');
      } catch (lyricError) {
        // If the Lyricist fails completely, we must stop and notify.
        throw wrapGenAIError(lyricError);
      }

      // Ensure message exists even if streaming failed but we got final text
      if (!messageCreated) {
        addMessage({
          id: finalMsgId,
          role: "model",
          content: draftLyrics,
          senderAgent: "LYRICIST",
          timestamp: new Date()
        });
      } else {
        updateMessage(finalMsgId, { content: draftLyrics });
      }

      updateAgentStep('lyricist', 'completed');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limit protection

      // Non-critical steps follow. We wrap them strictly to ensure lyrics are preserved even if post-processing fails.

      // COMPLIANCE STEP
      setAgentStatus(prev => ({ ...prev, currentAgent: "COMPLIANCE", message: "Checking safety...", steps: prev.steps.map(s => s.id === 'compliance' ? { ...s, status: 'active' } : s) }));
      let complianceReport = { originalityScore: 100, flaggedPhrases: [], similarSongs: [], verdict: "Skipped" };
      try {
        complianceReport = await runComplianceAgent(draftLyrics);
      } catch (e) {
        console.warn("Compliance check skipped (Non-critical error)", e);
      }
      updateAgentStep('compliance', 'completed');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limit protection

      // REVIEW STEP
      setAgentStatus(prev => ({ ...prev, currentAgent: "REVIEW", message: "Polishing...", steps: prev.steps.map(s => s.id === 'review' ? { ...s, status: 'active' } : s) }));
      let finalLyrics = draftLyrics;
      try {
        finalLyrics = await runReviewAgent(draftLyrics, processedContext, languageSettings, resolvedSettings);
        updateMessage(finalMsgId, { content: finalLyrics, senderAgent: "ORCHESTRATOR" });
      } catch (e) {
        console.warn("Review step skipped (Non-critical error)", e);
      }
      updateAgentStep('review', 'completed');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limit protection

      // FORMATTER STEP
      setAgentStatus(prev => ({ ...prev, currentAgent: "FORMATTER", message: "Formatting for Suno.com...", steps: prev.steps.map(s => s.id === 'formatter' ? { ...s, status: 'active' } : s) }));
      let sunoData = { stylePrompt: "", formattedLyrics: "" };
      try {
        sunoData = await runFormatterAgent(finalLyrics);
      } catch (e) {
        console.warn("Formatter step skipped (Non-critical error)", e);
      }
      updateAgentStep('formatter', 'completed');

      // FINAL UPDATE
      let outputContent = finalLyrics;
      if (complianceReport.originalityScore < 70) {
        outputContent += `\n\n[⚠️ COMPLIANCE ALERT: Originality Score ${complianceReport.originalityScore}%. Some phrases may resemble existing songs.]`;
      }

      updateMessage(finalMsgId, {
        content: outputContent,
        sunoFormattedContent: sunoData.formattedLyrics,
        sunoStylePrompt: sunoData.stylePrompt,
        complianceReport: complianceReport,
        senderAgent: "ORCHESTRATOR"
      });

      setAgentStatus(prev => ({ ...prev, currentAgent: "ORCHESTRATOR", message: "Done!", steps: prev.steps.map(s => s.id === 'final' ? { ...s, status: 'completed' } : s) }));

    } catch (error: any) {
      console.error("Workflow Critical Failure:", error);

      let friendlyMessage = "I encountered a musical block. Please try again.";

      if (error instanceof GeminiError) {
        friendlyMessage = `⚠️ ${error.message}`;
      } else if (error.message?.includes("Safety")) {
        friendlyMessage = "⚠️ I cannot generate this song as it may violate safety policies regarding sensitive topics.";
      }

      addMessage({
        id: Date.now().toString(),
        role: "system",
        content: friendlyMessage,
        timestamp: new Date()
      });

    } finally {
      setTimeout(() => {
        setAgentStatus({ active: false, currentAgent: "CHAT", message: "Ready", steps: [] });
      }, 2000);
    }
  };

  return { agentStatus, setAgentStatus, runSongGenerationWorkflow };
};