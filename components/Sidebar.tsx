import React, { useState, useEffect } from "react";
import { Music, X, Feather, CheckCircle, Languages, Sparkles, Mic2, Heart, Palette, ListOrdered, Users, Save, Download, Trash2, Layout, ChevronRight, ChevronDown, Coffee, Sliders, Wand2, HelpCircle, BookMarked, ArrowUpRight, Settings, Plus, Edit2, FolderPlus } from "lucide-react";
import { AgentStatus, LanguageProfile, GenerationSettings, SavedProfile, SavedSong } from "../types";
import { SCENARIO_KNOWLEDGE_BASE, CeremonyDefinition, MOOD_OPTIONS, STYLE_OPTIONS, COMPLEXITY_OPTIONS, RHYME_SCHEME_OPTIONS, SINGER_CONFIG_OPTIONS, THEME_OPTIONS } from "../config";
import { APP_LOGO } from "../assets/logo";
import { ContextManager } from "./ContextManager";
import { getContextById, loadCustomContexts, addCustomContext, addSubContext, deleteCustomContext, deleteSubContext, saveContextOrder, reorderContexts, reorderSubContexts } from "../utils/context-storage";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CustomContext, SubContext } from "../types/context";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  agentStatus: AgentStatus;
  languageSettings: LanguageProfile;
  onLanguageChange: (type: keyof LanguageProfile, value: string) => void;
  generationSettings: GenerationSettings;
  onSettingChange: (type: keyof GenerationSettings, value: string) => void;
  onLoadProfile: (lang: LanguageProfile, gen: GenerationSettings) => void;
  onOpenHelp: () => void;
  onOpenSettings?: () => void;
  savedSongs: SavedSong[];
  onDeleteSong: (id: string) => void;
  onLoadSong: (song: SavedSong) => void;
  fontSize?: number;
}

const SidebarSection = ({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
  fontSize = 16,
  actionButton
}: {
  title: string,
  icon: React.ReactNode,
  children?: React.ReactNode,
  defaultOpen?: boolean,
  badge?: React.ReactNode,
  fontSize?: number,
  actionButton?: React.ReactNode
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-strong last:border-0">
      <div className="flex items-center justify-between p-4 hover:bg-secondary/80 transition-colors group">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center gap-2 text-left outline-none"
        >
          <span className="font-bold uppercase tracking-wide flex items-center gap-2 text-foreground group-hover:text-primary transition-colors min-w-0" style={{ fontSize: `${fontSize * 0.875}px` }}>
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5 flex-shrink-0 text-foreground" }) : icon}
            <span className="truncate">{title}</span>
          </span>
        </button>
        <div className="flex items-center gap-3 ml-2 flex-shrink-0">
          {badge}
          {actionButton}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-secondary rounded transition-colors outline-none"
            aria-label={isOpen ? "Collapse section" : "Expand section"}
          >
            <ChevronDown className={`w-5 h-5 text-foreground transition-transform duration-300 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden min-h-0">
          <div className="p-4 pt-2 space-y-4 bg-background">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const PreferenceSelect = ({
  label,
  icon,
  value,
  options,
  customValue,
  onChange,
  onCustomChange,
  compact = false,
  fontSize = 16
}: {
  label: string,
  icon: React.ReactNode,
  value: string,
  options: string[],
  customValue: string,
  onChange: (val: string) => void,
  onCustomChange: (val: string) => void,
  compact?: boolean,
  fontSize?: number
}) => (
  <div className="space-y-2 w-full">
    <label className="font-semibold text-foreground flex items-center gap-2 truncate" title={label} style={{ fontSize: `${fontSize * 0.875}px` }}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4 text-foreground" }) : icon}
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-2 border-default font-medium rounded-lg focus:ring-2 focus:ring-primary focus:border-primary block p-2.5 pr-8 outline-none transition-colors appearance-none cursor-pointer hover:border-primary shadow-sm"
        style={{
          fontSize: `${fontSize * 0.9375}px`,
          backgroundColor: '#FFFFFF',
          color: '#0A0A0A'
        }}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none" style={{ color: '#0A0A0A' }}>
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
    {value === "Custom" && (
      <input
        type="text"
        value={customValue}
        onChange={(e) => onCustomChange(e.target.value)}
        placeholder="Type custom..."
        className="w-full border-2 border-default font-medium rounded-lg focus:ring-2 focus:ring-primary focus:border-primary block p-2.5 outline-none animate-fade-in"
        style={{
          fontSize: `${fontSize * 0.9375}px`,
          backgroundColor: '#FFFFFF',
          color: '#0A0A0A'
        }}
      />
    )}
  </div>
);

// Sortable Context Item Component
const SortableContextItem = ({ context, isExpanded, onToggle, onDelete, onAddSubContext, children, fontSize }: {
  context: CustomContext;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onAddSubContext: () => void;
  children?: React.ReactNode;
  fontSize: number;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: context.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  return (
    <div ref={setNodeRef} style={style} className="border border-default rounded-lg overflow-hidden bg-background">
      <div className="flex items-center justify-between p-2 bg-secondary/30 hover:bg-secondary/50 transition-colors">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 flex-1 text-left"
        >
          <span {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-secondary rounded">
            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </span>
          <span className="text-lg">{context.icon}</span>
          <span className="font-semibold text-sm truncate">{context.name}</span>
        </button>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onAddSubContext}
            className="p-1.5 hover:bg-secondary rounded text-primary"
            title="Add sub-context"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-secondary rounded text-destructive"
            title="Delete context"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {isExpanded && children}
    </div>
  );
};

// Sortable Sub-Context Item Component
const SortableSubContextItem = ({ subContext, contextId, isSelected, onSelect, onDelete, fontSize }: {
  subContext: SubContext;
  contextId: string;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  fontSize: number;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: subContext.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-2 rounded transition-colors group ${
        isSelected ? 'bg-primary text-white' : 'bg-card hover:bg-secondary'
      }`}
    >
      <button
        onClick={onSelect}
        className="flex items-center gap-2 flex-1 text-left"
      >
        <span {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-secondary/50 rounded">
          <ChevronRight className="w-3 h-3" />
        </span>
        <span className="text-sm font-medium truncate">{subContext.name}</span>
        {isSelected && <CheckCircle className="w-3.5 h-3.5 ml-auto" />}
      </button>
      <button
        onClick={onDelete}
        className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
          isSelected ? 'hover:bg-white/20' : 'hover:bg-secondary'
        }`}
        title="Delete sub-context"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  agentStatus,
  languageSettings,
  onLanguageChange,
  generationSettings,
  onSettingChange,
  onLoadProfile,
  onOpenHelp,
  onOpenSettings,
  savedSongs,
  onDeleteSong,
  onLoadSong,
  fontSize = 16
}) => {
  const [profileName, setProfileName] = useState("");
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [autoConfigured, setAutoConfigured] = useState(false);
  
  // Custom context management states
  const [customContexts, setCustomContexts] = useState<CustomContext[]>([]);
  const [expandedCustomContexts, setExpandedCustomContexts] = useState<Set<string>>(new Set());
  const [isAddingNewContext, setIsAddingNewContext] = useState(false);
  const [isAddingSubContext, setIsAddingSubContext] = useState<string | null>(null);
  const [editingContext, setEditingContext] = useState<string | null>(null);
  const [editingSubContext, setEditingSubContext] = useState<{ contextId: string; subContextId: string } | null>(null);
  
  // Context form states
  const [contextForm, setContextForm] = useState({ name: "", description: "", icon: "📚" });
  const [subContextForm, setSubContextForm] = useState({
    name: "",
    value: "",
    promptContext: "",
    defaultMood: "",
    defaultStyle: "",
    defaultComplexity: "",
    defaultRhyme: "",
    defaultSinger: "",
    suggestedKeywords: ""
  });
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const saved = localStorage.getItem("geetgatha_profiles");
    if (saved) {
      try {
        setSavedProfiles(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved profiles", e);
      }
    }
  }, []);

  useEffect(() => {
    if (generationSettings.category && !activeCategory) {
      setActiveCategory(generationSettings.category);
    }
  }, [generationSettings.category]);

  useEffect(() => {
    if (autoConfigured) {
      const timer = setTimeout(() => setAutoConfigured(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [autoConfigured]);
  
  useEffect(() => {
    loadCustomContextsData();
  }, []);
  
  const loadCustomContextsData = () => {
    const loaded = loadCustomContexts();
    const ordered = reorderContexts(loaded);
    setCustomContexts(ordered);
  };

  const handleSaveProfile = () => {
    if (!profileName.trim()) return;
    const newProfile: SavedProfile = {
      id: Date.now().toString(),
      name: profileName,
      language: languageSettings,
      generation: generationSettings,
      timestamp: Date.now()
    };
    const updated = [newProfile, ...savedProfiles];
    setSavedProfiles(updated);
    localStorage.setItem("geetgatha_profiles", JSON.stringify(updated));
    setProfileName("");
  };

  const handleDeleteProfile = (id: string) => {
    const updated = savedProfiles.filter(p => p.id !== id);
    setSavedProfiles(updated);
    localStorage.setItem("geetgatha_profiles", JSON.stringify(updated));
  };

  const handleLoadProfile = (profile: SavedProfile) => {
    onLoadProfile(profile.language, profile.generation);
  };

  const handleCeremonySelect = (category: string, event: CeremonyDefinition) => {
    onSettingChange('category', category);
    onSettingChange('ceremony', event.id);
    onSettingChange('theme', event.label);
    onSettingChange('mood', event.defaultMood);
    onSettingChange('style', event.defaultStyle);
    onSettingChange('complexity', event.defaultComplexity);
    onSettingChange('rhymeScheme', event.defaultRhyme);
    onSettingChange('singerConfig', event.defaultSinger);
    // Clear custom context when using built-in ceremony
    onSettingChange('customContextId', '');
    onSettingChange('customSubContextId', '');
    setAutoConfigured(true);
  };

  const handleCustomContextSelect = (contextId: string, subContextId: string) => {
    const { context, subContext } = getContextById(contextId, subContextId);
    
    if (context && subContext) {
      // Apply custom context settings
      onSettingChange('customContextId', contextId);
      onSettingChange('customSubContextId', subContextId);
      onSettingChange('category', 'custom');
      onSettingChange('ceremony', subContextId);
      
      // Apply default settings if provided
      if (subContext.defaultMood) onSettingChange('mood', subContext.defaultMood);
      if (subContext.defaultStyle) onSettingChange('style', subContext.defaultStyle);
      if (subContext.defaultComplexity) onSettingChange('complexity', subContext.defaultComplexity);
      if (subContext.defaultRhyme) onSettingChange('rhymeScheme', subContext.defaultRhyme);
      if (subContext.defaultSinger) onSettingChange('singerConfig', subContext.defaultSinger);
      
      setAutoConfigured(true);
    }
  };
  
  // Custom context inline management handlers
  const handleAddNewContext = () => {
    if (!contextForm.name.trim() || !subContextForm.name.trim() || !subContextForm.promptContext.trim()) return;
    
    const keywords = subContextForm.suggestedKeywords
      .split(",")
      .map(k => k.trim())
      .filter(k => k);
    
    const newContext = addCustomContext({
      name: contextForm.name,
      description: contextForm.description,
      icon: contextForm.icon,
      subContexts: []
    });
    
    addSubContext(newContext.id, {
      name: subContextForm.name,
      value: subContextForm.value || subContextForm.name,
      promptContext: subContextForm.promptContext,
      defaultMood: subContextForm.defaultMood,
      defaultStyle: subContextForm.defaultStyle,
      defaultComplexity: subContextForm.defaultComplexity,
      defaultRhyme: subContextForm.defaultRhyme,
      defaultSinger: subContextForm.defaultSinger,
      suggestedKeywords: keywords.length > 0 ? keywords : undefined
    });
    
    resetContextForms();
    setIsAddingNewContext(false);
    loadCustomContextsData();
  };
  
  const handleAddSubContextToExisting = (contextId: string) => {
    if (!subContextForm.name.trim() || !subContextForm.promptContext.trim()) return;
    
    const keywords = subContextForm.suggestedKeywords
      .split(",")
      .map(k => k.trim())
      .filter(k => k);
    
    addSubContext(contextId, {
      name: subContextForm.name,
      value: subContextForm.value || subContextForm.name,
      promptContext: subContextForm.promptContext,
      defaultMood: subContextForm.defaultMood,
      defaultStyle: subContextForm.defaultStyle,
      defaultComplexity: subContextForm.defaultComplexity,
      defaultRhyme: subContextForm.defaultRhyme,
      defaultSinger: subContextForm.defaultSinger,
      suggestedKeywords: keywords.length > 0 ? keywords : undefined
    });
    
    resetSubContextForm();
    setIsAddingSubContext(null);
    loadCustomContextsData();
  };
  
  const handleDeleteContext = (contextId: string) => {
    if (confirm("Are you sure you want to delete this context and all its sub-contexts?")) {
      deleteCustomContext(contextId);
      loadCustomContextsData();
    }
  };
  
  const handleDeleteSubContext = (contextId: string, subContextId: string) => {
    if (confirm("Are you sure you want to delete this sub-context?")) {
      deleteSubContext(contextId, subContextId);
      loadCustomContextsData();
    }
  };
  
  const toggleCustomContext = (contextId: string) => {
    const newExpanded = new Set(expandedCustomContexts);
    if (newExpanded.has(contextId)) {
      newExpanded.delete(contextId);
    } else {
      newExpanded.add(contextId);
    }
    setExpandedCustomContexts(newExpanded);
  };
  
  const resetContextForms = () => {
    setContextForm({ name: "", description: "", icon: "📚" });
    resetSubContextForm();
  };
  
  const resetSubContextForm = () => {
    setSubContextForm({
      name: "",
      value: "",
      promptContext: "",
      defaultMood: "",
      defaultStyle: "",
      defaultComplexity: "",
      defaultRhyme: "",
      defaultSinger: "",
      suggestedKeywords: ""
    });
  };
  
  const handleContextDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = customContexts.findIndex(c => c.id === active.id);
      const newIndex = customContexts.findIndex(c => c.id === over.id);
      
      const reordered = arrayMove(customContexts, oldIndex, newIndex);
      setCustomContexts(reordered);
      saveContextOrder(reordered.map(c => c.id));
    }
  };
  
  const handleSubContextDragEnd = (contextId: string, event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const context = customContexts.find(c => c.id === contextId);
      if (!context) return;
      
      const oldIndex = context.subContexts.findIndex(s => s.id === active.id);
      const newIndex = context.subContexts.findIndex(s => s.id === over.id);
      
      const reordered = arrayMove(context.subContexts, oldIndex, newIndex);
      reorderSubContexts(contextId, reordered.map(s => s.id));
      loadCustomContextsData();
    }
  };

  const languages = [
    "Assamese", "Bengali", "Bodo", "Dogri", "English", "Gujarati", "Hindi", "Kannada", "Kashmiri", "Konkani", "Maithili",
    "Malayalam", "Manipuri", "Marathi", "Nepali", "Odia", "Punjabi", "Sanskrit", "Santali", "Sindhi", "Tamil", "Telugu", "Urdu",
    "Spanish", "French", "German", "Italian", "Portuguese", "Russian", "Dutch", "Polish", "Swedish", "Norwegian", "Danish", "Finnish"
  ];

  const isMixed = languageSettings.primary !== languageSettings.secondary || languageSettings.primary !== languageSettings.tertiary;

  return (
    <>
      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 lg:w-80 bg-card border-r border-default flex flex-col shadow-2xl transform transition-transform duration-300 lg:transform-none ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ fontSize: `${fontSize}px` }}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-default bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt="SWAZ" className="h-8 w-auto" />
            <span className="font-cinema font-bold text-lg">SWAZ</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-secondary hover:text-primary"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pb-6 pt-4">
          {/* Language Studio */}
          <SidebarSection
            title="Language Mix"
            icon={<Languages />}
            defaultOpen={true}
            fontSize={fontSize}
            badge={isMixed && <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-1 font-medium text-[10px]"><Sparkles className="w-2 h-2" /> Fusion</span>}
          >
            <div className="space-y-4 relative">
              <div>
                <label className="font-semibold text-foreground mb-2 flex items-center justify-between" style={{ fontSize: `${fontSize * 0.875}px` }}>
                  <span>PRIMARY LANGUAGE</span>
                  <span className="text-white bg-primary px-2 py-1 rounded font-bold" style={{ fontSize: `${fontSize * 0.75}px` }}>Base</span>
                </label>
                <div className="relative">
                  <select
                    value={languageSettings.primary}
                    onChange={(e) => {
                      const newLang = e.target.value;
                      onLanguageChange('primary', newLang);
                      if (languageSettings.secondary === languageSettings.primary) onLanguageChange('secondary', newLang);
                      if (languageSettings.tertiary === languageSettings.primary) onLanguageChange('tertiary', newLang);
                    }}
                    className="w-full border-2 border-primary font-semibold rounded-lg focus:ring-2 focus:ring-primary block p-3 pr-10 outline-none appearance-none cursor-pointer shadow-sm"
                    style={{
                      fontSize: `${fontSize * 0.9375}px`,
                      backgroundColor: '#FFFFFF',
                      color: '#0A0A0A'
                    }}
                  >
                    {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: '#0A0A0A' }} />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground mb-2 flex items-center justify-between" style={{ fontSize: `${fontSize * 0.875}px` }}>
                  <span>SECONDARY LANGUAGE</span>
                  <span className="text-white bg-gray-600 px-2 py-1 rounded font-bold" style={{ fontSize: `${fontSize * 0.75}px` }}>Mix</span>
                </label>
                <div className="relative">
                  <select
                    value={languageSettings.secondary}
                    onChange={(e) => onLanguageChange('secondary', e.target.value)}
                    className="w-full border-2 border-default font-medium rounded-lg focus:ring-2 focus:ring-primary block p-3 pr-10 outline-none appearance-none cursor-pointer shadow-sm"
                    style={{
                      fontSize: `${fontSize * 0.9375}px`,
                      backgroundColor: '#FFFFFF',
                      color: '#0A0A0A'
                    }}
                  >
                    {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: '#0A0A0A' }} />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground mb-2 flex items-center justify-between" style={{ fontSize: `${fontSize * 0.875}px` }}>
                  <span>TERTIARY LANGUAGE</span>
                  <span className="text-white bg-gray-600 px-2 py-1 rounded font-bold" style={{ fontSize: `${fontSize * 0.75}px` }}>Accent</span>
                </label>
                <div className="relative">
                  <select
                    value={languageSettings.tertiary}
                    onChange={(e) => onLanguageChange('tertiary', e.target.value)}
                    className="w-full border-2 border-default font-medium rounded-lg focus:ring-2 focus:ring-primary block p-3 pr-10 outline-none appearance-none cursor-pointer shadow-sm"
                    style={{
                      fontSize: `${fontSize * 0.9375}px`,
                      backgroundColor: '#FFFFFF',
                      color: '#0A0A0A'
                    }}
                  >
                    {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: '#0A0A0A' }} />
                </div>
              </div>
            </div>
          </SidebarSection>

          {/* Context - Built-in Scenarios + Custom Contexts */}
          <SidebarSection
            title="Context"
            icon={<Coffee />}
            defaultOpen={true}
            fontSize={fontSize}
            badge={autoConfigured && (
              <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full animate-pulse border border-emerald-500/20 text-[10px]">
                <Wand2 className="w-2.5 h-2.5" /> Active
              </span>
            )}
            actionButton={
              !isAddingNewContext && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAddingNewContext(true);
                  }}
                  className="p-1.5 bg-primary text-white rounded-md hover:brightness-110 transition-all"
                  title="Add new custom context"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )
            }
          >
            <div className="space-y-3">
              {/* Add New Context Form */}
              {isAddingNewContext && (
                <div className="p-3 bg-secondary/50 rounded-lg border-2 border-primary animate-in slide-in-from-top-2 space-y-3">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">New Context + Sub-Context</div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Context name (e.g., 'Movie Genres')"
                      value={contextForm.name}
                      onChange={(e) => setContextForm({ ...contextForm, name: e.target.value })}
                      className="w-full px-2 py-1.5 rounded border border-default text-sm focus:ring-2 focus:ring-primary outline-none"
                      style={{ backgroundColor: '#FFFFFF', color: '#0A0A0A' }}
                    />
                    <input
                      type="text"
                      placeholder="Icon (emoji)"
                      value={contextForm.icon}
                      onChange={(e) => setContextForm({ ...contextForm, icon: e.target.value })}
                      className="w-full px-2 py-1.5 rounded border border-default text-sm focus:ring-2 focus:ring-primary outline-none"
                      maxLength={2}
                      style={{ backgroundColor: '#FFFFFF', color: '#0A0A0A' }}
                    />
                    <input
                      type="text"
                      placeholder="Sub-context name (e.g., 'Action Thriller')"
                      value={subContextForm.name}
                      onChange={(e) => setSubContextForm({ ...subContextForm, name: e.target.value })}
                      className="w-full px-2 py-1.5 rounded border border-default text-sm focus:ring-2 focus:ring-primary outline-none"
                      style={{ backgroundColor: '#FFFFFF', color: '#0A0A0A' }}
                    />
                    <textarea
                      placeholder="Prompt context (instructions for AI)"
                      value={subContextForm.promptContext}
                      onChange={(e) => setSubContextForm({ ...subContextForm, promptContext: e.target.value })}
                      className="w-full px-2 py-1.5 rounded border border-default text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                      rows={3}
                      style={{ backgroundColor: '#FFFFFF', color: '#0A0A0A' }}
                    />
                    <input
                      type="text"
                      placeholder="Keywords (comma-separated, optional)"
                      value={subContextForm.suggestedKeywords}
                      onChange={(e) => setSubContextForm({ ...subContextForm, suggestedKeywords: e.target.value })}
                      className="w-full px-2 py-1.5 rounded border border-default text-sm focus:ring-2 focus:ring-primary outline-none"
                      style={{ backgroundColor: '#FFFFFF', color: '#0A0A0A' }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddNewContext}
                        disabled={!contextForm.name.trim() || !subContextForm.name.trim() || !subContextForm.promptContext.trim()}
                        className="flex-1 px-3 py-1.5 bg-primary text-white rounded text-sm font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingNewContext(false);
                          resetContextForms();
                        }}
                        className="px-3 py-1.5 bg-secondary text-foreground rounded text-sm font-medium hover:bg-secondary/80 flex items-center justify-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Custom Contexts with Drag and Drop */}
              {customContexts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Custom Contexts</div>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleContextDragEnd}>
                    <SortableContext items={customContexts.map(c => c.id)} strategy={verticalListSortingStrategy}>
                      {customContexts.map((context) => (
                        <SortableContextItem
                          key={context.id}
                          context={context}
                          isExpanded={expandedCustomContexts.has(context.id)}
                          onToggle={() => toggleCustomContext(context.id)}
                          onDelete={() => handleDeleteContext(context.id)}
                          onAddSubContext={() => setIsAddingSubContext(context.id)}
                          fontSize={fontSize}
                        >
                          <div className="p-2 space-y-1">
                            {/* Add Sub-Context Form */}
                            {isAddingSubContext === context.id && (
                              <div className="p-2 bg-secondary/50 rounded border border-primary mb-2 space-y-2">
                                <input
                                  type="text"
                                  placeholder="Sub-context name"
                                  value={subContextForm.name}
                                  onChange={(e) => setSubContextForm({ ...subContextForm, name: e.target.value })}
                                  className="w-full px-2 py-1 rounded border border-default text-xs focus:ring-2 focus:ring-primary outline-none"
                                  style={{ backgroundColor: '#FFFFFF', color: '#0A0A0A' }}
                                />
                                <textarea
                                  placeholder="Prompt context"
                                  value={subContextForm.promptContext}
                                  onChange={(e) => setSubContextForm({ ...subContextForm, promptContext: e.target.value })}
                                  className="w-full px-2 py-1 rounded border border-default text-xs focus:ring-2 focus:ring-primary outline-none resize-none"
                                  rows={2}
                                  style={{ backgroundColor: '#FFFFFF', color: '#0A0A0A' }}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAddSubContextToExisting(context.id)}
                                    disabled={!subContextForm.name.trim() || !subContextForm.promptContext.trim()}
                                    className="flex-1 px-2 py-1 bg-primary text-white rounded text-xs font-medium hover:brightness-110 disabled:opacity-50"
                                  >
                                    Add
                                  </button>
                                  <button
                                    onClick={() => {
                                      setIsAddingSubContext(null);
                                      resetSubContextForm();
                                    }}
                                    className="px-2 py-1 bg-secondary text-foreground rounded text-xs font-medium hover:bg-secondary/80"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            {/* Sub-Contexts with Drag and Drop */}
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={(event) => handleSubContextDragEnd(context.id, event)}
                            >
                              <SortableContext items={context.subContexts.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                {context.subContexts.map((subContext) => (
                                  <SortableSubContextItem
                                    key={subContext.id}
                                    subContext={subContext}
                                    contextId={context.id}
                                    isSelected={generationSettings.customContextId === context.id && generationSettings.customSubContextId === subContext.id}
                                    onSelect={() => handleCustomContextSelect(context.id, subContext.id)}
                                    onDelete={() => handleDeleteSubContext(context.id, subContext.id)}
                                    fontSize={fontSize}
                                  />
                                ))}
                              </SortableContext>
                            </DndContext>
                          </div>
                        </SortableContextItem>
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              )}
              
              {/* Built-in Contexts */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Built-in Contexts</div>
                {SCENARIO_KNOWLEDGE_BASE.map((category) => (
                  <div key={category.id}>
                    <button
                      onClick={() => setActiveCategory(activeCategory === category.id ? "" : category.id)}
                      className={`w-full flex items-center justify-between p-3 text-left rounded-lg font-semibold transition-colors ${activeCategory === category.id ? "bg-secondary text-foreground" : "bg-card hover:bg-secondary text-foreground"}`}
                      style={{ fontSize: `${fontSize * 0.875}px` }}
                    >
                      <span>{category.label}</span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${activeCategory === category.id ? "rotate-90" : ""}`} />
                    </button>
                    {activeCategory === category.id && (
                      <div className="pl-4 pr-2 py-2 space-y-1 border-l-2 border-primary ml-2 bg-card/50">
                        {category.events.map((event) => (
                          <button
                            key={event.id}
                            onClick={() => handleCeremonySelect(category.id, event)}
                            className={`w-full text-left px-3 py-2 rounded-lg font-medium flex justify-between transition-colors ${generationSettings.ceremony === event.id && generationSettings.category !== 'custom' ? "bg-primary text-white font-bold" : "bg-card hover:bg-secondary text-foreground"}`}
                            style={{ fontSize: `${fontSize * 0.875}px` }}
                          >
                            {event.label}
                            {generationSettings.ceremony === event.id && generationSettings.category !== 'custom' && <CheckCircle className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </SidebarSection>

          {/* Fine Tuning */}
          <SidebarSection title="Fine Tuning" icon={<Sliders />} defaultOpen={true} fontSize={fontSize}>
            <div className="space-y-4">
              <PreferenceSelect label="Theme" icon={<Palette />} value={generationSettings.theme} options={THEME_OPTIONS} customValue={generationSettings.customTheme} onChange={v => onSettingChange('theme', v)} onCustomChange={v => onSettingChange('customTheme', v)} fontSize={fontSize} />
              <div className="grid grid-cols-2 gap-2">
                <PreferenceSelect label="Mood" icon={<Heart />} value={generationSettings.mood} options={MOOD_OPTIONS} customValue={generationSettings.customMood} onChange={v => onSettingChange('mood', v)} onCustomChange={v => onSettingChange('customMood', v)} fontSize={fontSize} />
                <PreferenceSelect label="Style" icon={<Mic2 />} value={generationSettings.style} options={STYLE_OPTIONS} customValue={generationSettings.customStyle} onChange={v => onSettingChange('style', v)} onCustomChange={v => onSettingChange('customStyle', v)} fontSize={fontSize} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <PreferenceSelect label="Complexity" icon={<Sparkles />} value={generationSettings.complexity} options={COMPLEXITY_OPTIONS} customValue="" onChange={v => onSettingChange('complexity', v)} onCustomChange={() => {}} fontSize={fontSize} />
                <PreferenceSelect label="Rhyme Scheme" icon={<ListOrdered />} value={generationSettings.rhymeScheme} options={RHYME_SCHEME_OPTIONS} customValue={generationSettings.customRhymeScheme} onChange={v => onSettingChange('rhymeScheme', v)} onCustomChange={v => onSettingChange('customRhymeScheme', v)} fontSize={fontSize} />
              </div>
            </div>
          </SidebarSection>

          {/* Music Library - Advanced Context Management */}
          <SidebarSection
            title="Music Library"
            icon={<Music />}
            defaultOpen={false}
            fontSize={fontSize}
          >
            <ContextManager
              onSelectContext={handleCustomContextSelect}
              selectedContextId={generationSettings.customContextId}
              selectedSubContextId={generationSettings.customSubContextId}
              fontSize={fontSize}
            />
          </SidebarSection>

          {/* Library */}
          <SidebarSection title="Library" icon={<BookMarked />} fontSize={fontSize} badge={savedSongs.length > 0 ? <span className="bg-primary text-white font-bold px-2 py-0.5 rounded-full" style={{ fontSize: `${fontSize * 0.75}px` }}>{savedSongs.length}</span> : null}>
            <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
              {savedSongs.map(song => (
                <div key={song.id} className="flex justify-between items-center bg-card border border-default p-3 rounded-lg hover:bg-secondary group transition-colors">
                  <span className="font-semibold truncate flex-1 text-foreground" style={{ fontSize: `${fontSize * 0.875}px` }}>{song.title}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <button onClick={() => onLoadSong(song)} className="p-1.5 hover:text-primary rounded hover:bg-background"><ArrowUpRight className="w-4 h-4" /></button>
                    <button onClick={() => onDeleteSong(song.id)} className="p-1.5 hover:text-destructive rounded hover:bg-background"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              {savedSongs.length === 0 && <p className="text-center font-medium text-muted-foreground py-6" style={{ fontSize: `${fontSize * 0.875}px` }}>No songs saved.</p>}
            </div>
          </SidebarSection>

          {/* Profiles */}
          <SidebarSection title="Profiles" icon={<Layout />} fontSize={fontSize}>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                placeholder="Profile Name"
                className="flex-1 border-2 border-default rounded-lg px-3 py-2 font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                style={{
                  fontSize: `${fontSize * 0.875}px`,
                  backgroundColor: '#FFFFFF',
                  color: '#0A0A0A'
                }}
              />
              <button onClick={handleSaveProfile} disabled={!profileName} className="bg-primary text-white p-2.5 rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"><Save className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin">
              {savedProfiles.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-card border border-default hover:bg-secondary rounded-lg group transition-colors">
                  <span className="font-semibold truncate flex-1 text-foreground" style={{ fontSize: `${fontSize * 0.875}px` }}>{p.name}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <button onClick={() => handleLoadProfile(p)} className="p-1.5 hover:text-primary rounded hover:bg-background"><Download className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteProfile(p.id)} className="p-1.5 hover:text-destructive rounded hover:bg-background"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </SidebarSection>
        </div>

        <div className="border-t-2 border-strong p-4 bg-card">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold uppercase flex items-center gap-2 text-foreground" style={{ fontSize: `${fontSize * 0.875}px` }}><Sparkles className="w-4 h-4" /> Status</span>
            <div className={`w-3 h-3 rounded-full ${agentStatus.active ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' : 'bg-muted-foreground'}`} />
          </div>
          <div className="space-y-2">
            {onOpenSettings && (
              <button onClick={onOpenSettings} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all font-bold shadow-sm" style={{ fontSize: `${fontSize * 0.875}px` }}>
                <Settings className="w-4 h-4" /> Settings
              </button>
            )}
            <button onClick={onOpenHelp} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-white hover:brightness-110 transition-all font-bold shadow-md" style={{ fontSize: `${fontSize * 0.875}px` }}>
              <HelpCircle className="w-4 h-4" /> Help
            </button>
          </div>
        </div>
      </div>
    </>
  );
};