import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronRight, FolderPlus, FilePlus, Sparkles } from "lucide-react";
import { CustomContext, SubContext } from "../types/context";
import {
  loadCustomContexts,
  addCustomContext,
  updateCustomContext,
  deleteCustomContext,
  addSubContext,
  updateSubContext,
  deleteSubContext,
  saveContextSelection,
  loadContextSelection
} from "../utils/context-storage";
import { MOOD_OPTIONS, STYLE_OPTIONS, COMPLEXITY_OPTIONS, RHYME_SCHEME_OPTIONS, SINGER_CONFIG_OPTIONS } from "../config";

interface ContextManagerProps {
  onSelectContext: (contextId: string, subContextId: string) => void;
  selectedContextId?: string;
  selectedSubContextId?: string;
  fontSize?: number;
}

export const ContextManager: React.FC<ContextManagerProps> = ({
  onSelectContext,
  selectedContextId,
  selectedSubContextId,
  fontSize = 16
}) => {
  const [contexts, setContexts] = useState<CustomContext[]>([]);
  const [expandedContexts, setExpandedContexts] = useState<Set<string>>(new Set());
  const [editingContext, setEditingContext] = useState<string | null>(null);
  const [editingSubContext, setEditingSubContext] = useState<{ contextId: string; subContextId: string } | null>(null);
  const [isAddingContext, setIsAddingContext] = useState(false);
  const [isAddingSubContext, setIsAddingSubContext] = useState<string | null>(null);

  // Form states
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

  useEffect(() => {
    loadContexts();
    const selection = loadContextSelection();
    if (selection && !selectedContextId) {
      onSelectContext(selection.contextId, selection.subContextId);
    }
  }, []);

  const loadContexts = () => {
    const loaded = loadCustomContexts();
    setContexts(loaded);
  };

  const toggleContext = (contextId: string) => {
    const newExpanded = new Set(expandedContexts);
    if (newExpanded.has(contextId)) {
      newExpanded.delete(contextId);
    } else {
      newExpanded.add(contextId);
    }
    setExpandedContexts(newExpanded);
  };

  const handleAddContext = () => {
    if (!contextForm.name.trim()) return;
    
    addCustomContext({
      name: contextForm.name,
      description: contextForm.description,
      icon: contextForm.icon,
      subContexts: []
    });
    
    setContextForm({ name: "", description: "", icon: "📚" });
    setIsAddingContext(false);
    loadContexts();
  };

  const handleUpdateContext = (contextId: string) => {
    if (!contextForm.name.trim()) return;
    
    updateCustomContext(contextId, {
      name: contextForm.name,
      description: contextForm.description,
      icon: contextForm.icon
    });
    
    setContextForm({ name: "", description: "", icon: "📚" });
    setEditingContext(null);
    loadContexts();
  };

  const handleDeleteContext = (contextId: string) => {
    if (confirm("Are you sure you want to delete this context and all its sub-contexts?")) {
      deleteCustomContext(contextId);
      loadContexts();
    }
  };

  const handleAddSubContext = (contextId: string) => {
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
    loadContexts();
  };

  const handleUpdateSubContext = (contextId: string, subContextId: string) => {
    if (!subContextForm.name.trim() || !subContextForm.promptContext.trim()) return;
    
    const keywords = subContextForm.suggestedKeywords
      .split(",")
      .map(k => k.trim())
      .filter(k => k);
    
    updateSubContext(contextId, subContextId, {
      name: subContextForm.name,
      value: subContextForm.value || subContextForm.name,
      promptContext: subContextForm.promptContext,
      defaultMood: subContextForm.defaultMood || undefined,
      defaultStyle: subContextForm.defaultStyle || undefined,
      defaultComplexity: subContextForm.defaultComplexity || undefined,
      defaultRhyme: subContextForm.defaultRhyme || undefined,
      defaultSinger: subContextForm.defaultSinger || undefined,
      suggestedKeywords: keywords.length > 0 ? keywords : undefined
    });
    
    resetSubContextForm();
    setEditingSubContext(null);
    loadContexts();
  };

  const handleDeleteSubContext = (contextId: string, subContextId: string) => {
    if (confirm("Are you sure you want to delete this sub-context?")) {
      deleteSubContext(contextId, subContextId);
      loadContexts();
    }
  };

  const handleSelectSubContext = (contextId: string, subContextId: string) => {
    saveContextSelection(contextId, subContextId);
    onSelectContext(contextId, subContextId);
  };

  const startEditContext = (context: CustomContext) => {
    setContextForm({
      name: context.name,
      description: context.description || "",
      icon: context.icon || "📚"
    });
    setEditingContext(context.id);
  };

  const startEditSubContext = (contextId: string, subContext: SubContext) => {
    setSubContextForm({
      name: subContext.name,
      value: subContext.value,
      promptContext: subContext.promptContext,
      defaultMood: subContext.defaultMood || "",
      defaultStyle: subContext.defaultStyle || "",
      defaultComplexity: subContext.defaultComplexity || "",
      defaultRhyme: subContext.defaultRhyme || "",
      defaultSinger: subContext.defaultSinger || "",
      suggestedKeywords: subContext.suggestedKeywords?.join(", ") || ""
    });
    setEditingSubContext({ contextId, subContextId: subContext.id });
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

  const cancelEdit = () => {
    setEditingContext(null);
    setEditingSubContext(null);
    setIsAddingContext(false);
    setIsAddingSubContext(null);
    setContextForm({ name: "", description: "", icon: "📚" });
    resetSubContextForm();
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Custom Contexts</span>
        {!isAddingContext && (
          <button
            onClick={() => setIsAddingContext(true)}
            className="p-1.5 bg-primary text-white rounded-md hover:brightness-110 transition-all flex items-center gap-1 text-xs font-medium"
            title="Add new context category"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            New
          </button>
        )}
      </div>

      {/* Add Context Form */}
      {isAddingContext && (
        <div className="p-3 bg-secondary/50 rounded-lg border-2 border-primary animate-in slide-in-from-top-2">
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
              placeholder="Description (optional)"
              value={contextForm.description}
              onChange={(e) => setContextForm({ ...contextForm, description: e.target.value })}
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
            <div className="flex gap-2">
              <button
                onClick={handleAddContext}
                className="flex-1 px-3 py-1.5 bg-primary text-white rounded text-sm font-medium hover:brightness-110 flex items-center justify-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="px-3 py-1.5 bg-secondary text-foreground rounded text-sm font-medium hover:bg-secondary/80 flex items-center justify-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context List */}
      <div className="space-y-2">
        {contexts.length === 0 && !isAddingContext && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No custom contexts yet.</p>
            <p className="text-xs mt-1">Click "New" to create your first context.</p>
          </div>
        )}

        {contexts.map((context) => (
          <div key={context.id} className="border border-default rounded-lg overflow-hidden bg-background">
            {/* Context Header */}
            <div className="flex items-center justify-between p-2 bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <button
                onClick={() => toggleContext(context.id)}
                className="flex items-center gap-2 flex-1 text-left"
              >
                {expandedContexts.has(context.id) ? (
                  <ChevronDown className="w-4 h-4 text-foreground flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-foreground flex-shrink-0" />
                )}
                <span className="text-lg">{context.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground truncate">{context.name}</div>
                  {context.description && (
                    <div className="text-xs text-muted-foreground truncate">{context.description}</div>
                  )}
                </div>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {context.subContexts.length}
                </span>
              </button>
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => startEditContext(context)}
                  className="p-1.5 hover:bg-secondary rounded transition-colors"
                  title="Edit context"
                >
                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                </button>
                <button
                  onClick={() => handleDeleteContext(context.id)}
                  className="p-1.5 hover:bg-secondary rounded transition-colors"
                  title="Delete context"
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            </div>

            {/* Edit Context Form */}
            {editingContext === context.id && (
              <div className="p-3 bg-primary/5 border-t border-default">
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Context name"
                    value={contextForm.name}
                    onChange={(e) => setContextForm({ ...contextForm, name: e.target.value })}
                    className="w-full px-2 py-1.5 rounded border border-default text-sm focus:ring-2 focus:ring-primary outline-none"
                    style={{ backgroundColor: '#FFFFFF', color: '#0A0A0A' }}
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={contextForm.description}
                    onChange={(e) => setContextForm({ ...contextForm, description: e.target.value })}
                    className="w-full px-2 py-1.5 rounded border border-default text-sm focus:ring-2 focus:ring-primary outline-none"
                    style={{ backgroundColor: '#FFFFFF', color: '#0A0A0A' }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateContext(context.id)}
                      className="flex-1 px-3 py-1.5 bg-primary text-white rounded text-sm font-medium hover:brightness-110"
                    >
                      Update
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1.5 bg-secondary text-foreground rounded text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-contexts */}
            {expandedContexts.has(context.id) && (
              <div className="p-2 space-y-1">
                {context.subContexts.map((subContext) => (
                  <div key={subContext.id}>
                    {editingSubContext?.contextId === context.id && editingSubContext?.subContextId === subContext.id ? (
                      <SubContextForm
                        form={subContextForm}
                        onChange={setSubContextForm}
                        onSave={() => handleUpdateSubContext(context.id, subContext.id)}
                        onCancel={cancelEdit}
                      />
                    ) : (
                      <div
                        className={`flex items-center justify-between p-2 rounded hover:bg-secondary/50 transition-colors group ${
                          selectedContextId === context.id && selectedSubContextId === subContext.id
                            ? "bg-primary/10 border border-primary"
                            : "border border-transparent"
                        }`}
                      >
                        <button
                          onClick={() => handleSelectSubContext(context.id, subContext.id)}
                          className="flex-1 text-left min-w-0"
                        >
                          <div className="font-medium text-sm text-foreground truncate">{subContext.name}</div>
                          <div className="text-xs text-muted-foreground truncate mt-0.5">
                            {subContext.promptContext.substring(0, 60)}...
                          </div>
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <button
                            onClick={() => startEditSubContext(context.id, subContext)}
                            className="p-1 hover:bg-secondary rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-3 h-3 text-muted-foreground hover:text-primary" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubContext(context.id, subContext.id)}
                            className="p-1 hover:bg-secondary rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Sub-context Button/Form */}
                {isAddingSubContext === context.id ? (
                  <SubContextForm
                    form={subContextForm}
                    onChange={setSubContextForm}
                    onSave={() => handleAddSubContext(context.id)}
                    onCancel={cancelEdit}
                  />
                ) : (
                  <button
                    onClick={() => setIsAddingSubContext(context.id)}
                    className="w-full p-2 border-2 border-dashed border-default rounded hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary font-medium"
                  >
                    <FilePlus className="w-4 h-4" />
                    Add Sub-Context
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Sub-context form component
const SubContextForm: React.FC<{
  form: any;
  onChange: (form: any) => void;
  onSave: () => void;
  onCancel: () => void;
}> = ({ form, onChange, onSave, onCancel }) => {
  return (
    <div className="p-3 bg-primary/5 rounded-lg border-2 border-primary space-y-2 animate-in slide-in-from-top-2">
      <input
        type="text"
        placeholder="Sub-context name *"
        value={form.name}
        onChange={(e) => onChange({ ...form, name: e.target.value })}
        className="w-full px-2 py-1.5 rounded border border-default text-sm focus:ring-2 focus:ring-primary outline-none"
        style={{ backgroundColor: '#FFFFFF', color: '#0A0A0A' }}
      />
      <textarea
        placeholder="Prompt context (What AI should know about this) *"
        value={form.promptContext}
        onChange={(e) => onChange({ ...form, promptContext: e.target.value })}
        className="w-full px-2 py-1.5 rounded border border-default text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
        rows={3}
        style={{ backgroundColor: '#FFFFFF', color: '#0A0A0A' }}
      />
      <input
        type="text"
        placeholder="Suggested keywords (comma-separated)"
        value={form.suggestedKeywords}
        onChange={(e) => onChange({ ...form, suggestedKeywords: e.target.value })}
        className="w-full px-2 py-1.5 rounded border border-default text-sm focus:ring-2 focus:ring-primary outline-none"
        style={{ backgroundColor: '#FFFFFF', color: '#0A0A0A' }}
      />
      
      {/* Default Settings */}
      <div className="space-y-1.5 pt-2 border-t border-default">
        <div className="text-xs font-semibold text-muted-foreground uppercase">Default Settings (Optional)</div>
        <select
          value={form.defaultMood}
          onChange={(e) => onChange({ ...form, defaultMood: e.target.value })}
          className="w-full px-2 py-1.5 rounded border border-default text-xs focus:ring-2 focus:ring-primary outline-none"
          style={{ backgroundColor: '#FFFFFF', color: '#0A0A0A' }}
        >
          <option value="">Default Mood (none)</option>
          {MOOD_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select
          value={form.defaultStyle}
          onChange={(e) => onChange({ ...form, defaultStyle: e.target.value })}
          className="w-full px-2 py-1.5 rounded border border-default text-xs focus:ring-2 focus:ring-primary outline-none"
          style={{ backgroundColor: '#FFFFFF', color: '#0A0A0A' }}
        >
          <option value="">Default Style (none)</option>
          {STYLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select
          value={form.defaultComplexity}
          onChange={(e) => onChange({ ...form, defaultComplexity: e.target.value })}
          className="w-full px-2 py-1.5 rounded border border-default text-xs focus:ring-2 focus:ring-primary outline-none"
          style={{ backgroundColor: '#FFFFFF', color: '#0A0A0A' }}
        >
          <option value="">Default Complexity (none)</option>
          {COMPLEXITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onSave}
          className="flex-1 px-3 py-1.5 bg-primary text-white rounded text-sm font-medium hover:brightness-110 flex items-center justify-center gap-1"
        >
          <Save className="w-3.5 h-3.5" />
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 bg-secondary text-foreground rounded text-sm font-medium hover:bg-secondary/80 flex items-center justify-center gap-1"
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
      </div>
    </div>
  );
};
