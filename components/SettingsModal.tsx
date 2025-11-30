import React, { useState } from "react";
import { X, Type, Palette, Sparkles, Check, Loader2, Undo2, Key, Cpu } from "lucide-react";
import { AppearanceSettings } from "../types";
import { runThemeAgent } from "../agents/theme";
import { DEFAULT_THEMES } from "../config";
import { AVAILABLE_MODELS, MODEL_NAME } from "../config/models";
import { APIKeyManager } from "./APIKeyManager";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppearanceSettings;
  onUpdateSettings: (settings: AppearanceSettings) => void;
}

export const SettingsModal = ({ isOpen, onClose, settings, onUpdateSettings }: SettingsModalProps) => {
  const [themePrompt, setThemePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleFontSizeChange = (size: number) => {
    onUpdateSettings({ ...settings, fontSize: size });
  };

  const handleThemeSelect = (themeId: string) => {
    onUpdateSettings({ ...settings, themeId });
  };

  const handleModelSelect = (modelId: string) => {
    onUpdateSettings({ ...settings, selectedModel: modelId });
  };

  const handleGenerateTheme = async () => {
    if (!themePrompt.trim()) return;
    setIsGenerating(true);
    const newTheme = await runThemeAgent(themePrompt);
    if (newTheme) {
      const updatedCustomThemes = [newTheme, ...settings.customThemes];
      onUpdateSettings({
        ...settings,
        customThemes: updatedCustomThemes,
        themeId: newTheme.id
      });
      setThemePrompt("");
    } else {
      alert("Failed to generate theme. Please try a clearer description.");
    }
    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-2xl border-2 border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" style={{ backgroundColor: '#0F0F0F', color: '#FFFFFF' }}>

        {/* Header */}
        <div className="p-6 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div>
            <h2 className="text-2xl font-cinema font-bold text-white">Settings</h2>
            <p className="text-sm text-gray-400">Customize your studio appearance</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">

          {/* AI Model Section */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-medium mb-4 text-white">
              <Cpu className="w-5 h-5 text-red-500" /> AI Model Selection
            </h3>
            <div className="p-4 rounded-xl border-2" style={{ backgroundColor: '#1A1A1A', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div className="grid gap-3">
                {AVAILABLE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleModelSelect(model.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      (settings.selectedModel || MODEL_NAME) === model.id
                        ? "border-red-500 bg-red-500/10"
                        : "border-white/10 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-xs text-gray-400 mt-0.5">{model.description}</span>
                    </div>
                    {(settings.selectedModel || MODEL_NAME) === model.id && (
                      <Check className="w-4 h-4 text-red-500" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Choose based on your needs: Flash (speed), 2.5 Pro (balanced, recommended), 3 Pro Preview (latest).
              </p>
            </div>
          </section>

          {/* Font Size Section */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-medium mb-4 text-white">
              <Type className="w-5 h-5 text-red-500" /> Text Size & Readability
            </h3>
            <div className="p-6 rounded-xl border-2" style={{ backgroundColor: '#1A1A1A', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-wider font-bold text-gray-400">Size: {settings.fontSize}px</span>
                <button
                  onClick={() => handleFontSizeChange(16)}
                  className="text-xs flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Undo2 className="w-3 h-3" /> Reset to Default
                </button>
              </div>

              <input
                type="range"
                min="12"
                max="26"
                step="1"
                value={settings.fontSize}
                onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              />

              <div className="flex justify-between mt-2 text-sm text-gray-400 font-mono">
                <span>Aa (Small)</span>
                <span>Aa (Standard)</span>
                <span>Aa (Large)</span>
                <span>Aa (Extra Large)</span>
              </div>
            </div>
          </section>

          {/* API Key Section */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-medium mb-4 text-white">
              <Key className="w-5 h-5 text-red-500" /> API Configuration
            </h3>
            <div className="rounded-xl border-2" style={{ backgroundColor: '#1A1A1A', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <APIKeyManager onClose={onClose} />
            </div>
          </section>

          {/* Theme Section */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-medium mb-4 text-white">
              <Palette className="w-5 h-5 text-red-500" /> Color Themes
            </h3>

            {/* AI Generator */}
            <div className="mb-6 p-4 rounded-xl border-2 flex gap-2" style={{ backgroundColor: '#1A1A1A', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div className="flex-1">
                <label className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-1 block">AI Theme Generator</label>
                <input
                  type="text"
                  value={themePrompt}
                  onChange={(e) => setThemePrompt(e.target.value)}
                  placeholder="e.g., 'Sunset in Jaipur', 'Cyberpunk Neon'"
                  className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 px-0 disabled:cursor-not-allowed outline-none"
                  style={{ color: '#FFFFFF' }}
                />
              </div>
              <button
                onClick={handleGenerateTheme}
                disabled={isGenerating || !themePrompt.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 hover:bg-red-700 transition-colors"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate
              </button>
            </div>

            {/* Theme Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[...DEFAULT_THEMES, ...settings.customThemes].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className={`relative p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${settings.themeId === theme.id
                    ? "border-red-500 ring-2 ring-red-500/50"
                    : "border-white/10 hover:border-white/20"
                    }`}
                  style={{ backgroundColor: theme.colors.bgSidebar }}
                >
                  <div className="flex gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: theme.colors.bgMain }}></div>
                    <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: theme.colors.accent }}></div>
                    <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: theme.colors.textMain }}></div>
                  </div>
                  <span className="text-sm font-medium" style={{ color: theme.colors.textMain }}>{theme.name}</span>
                  {settings.themeId === theme.id && (
                    <div className="absolute top-2 right-2 p-1 bg-red-600 rounded-full text-white">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};