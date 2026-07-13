import React, { useState } from "react";
import { X, Send, Sparkles, Loader2 } from "lucide-react";
import { useGenerationWorkflowStore } from "../../stores/generationWorkflowStore";
import { useAgentStore } from "../../stores/agentStore";
import { DesignRefinementService } from "../../services/designRefinementService";
import { DesignConcept } from "../../types/designConcept";
import toast from "react-hot-toast";

interface DesignFeedbackEditorProps {
  concept: DesignConcept;
  onClose: () => void;
}

export const DesignFeedbackEditor: React.FC<DesignFeedbackEditorProps> = ({
  concept,
  onClose,
}) => {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const addDesignVersion = useGenerationWorkflowStore((s) => s.addDesignVersion);
  const { projectMode } = useAgentStore();
  const { userPrompt, analysisResult } = useGenerationWorkflowStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setLoading(true);
    const toastId = toast.loading(`Refining ${concept.name}...`);

    try {
      const context = `Original Prompt: ${userPrompt}\nAnalysis: ${JSON.stringify(analysisResult)}`;
      const refined = await DesignRefinementService.getInstance().refineDesign(
        concept,
        feedback,
        projectMode,
        context,
        3
      );

      addDesignVersion(concept.id, refined);
      toast.success(`${concept.name} refined successfully! Sparkles added. ✨`, { id: toastId });
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(`Refinement failed: ${err.message || "Unknown error"}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
            <h3 className="font-bold text-lg text-stone-900">
              Refine {concept.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-400 hover:text-stone-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-stone-500 font-medium">
            Explain what changes you would like to make to this specific design concept (colors, layouts, spacing, fonts, etc.). Sibling design will remain completely untouched.
          </p>
          
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g., Make it look darker and add soft glassmorphism card styling..."
            disabled={loading}
            className="w-full h-32 p-4 text-sm bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none font-medium text-stone-800 disabled:opacity-70"
            required
            autoFocus
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-bold uppercase tracking-wider text-stone-500 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!feedback.trim() || loading}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Refining...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Refine Design
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
