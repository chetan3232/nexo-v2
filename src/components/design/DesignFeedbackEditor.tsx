import React, { useState } from "react";
import { X, Send, Sparkles } from "lucide-react";
import { useGenerationWorkflowStore } from "../../stores/generationWorkflowStore";

interface DesignFeedbackEditorProps {
  designId: string;
  designName: string;
  onClose: () => void;
}

export const DesignFeedbackEditor: React.FC<DesignFeedbackEditorProps> = ({
  designId,
  designName,
  onClose,
}) => {
  const [feedback, setFeedback] = useState("");
  const submitFeedback = useGenerationWorkflowStore((s) => s.submitDesignFeedback);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    submitFeedback(`Feedback for ${designName} (${designId}): ${feedback}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
            <h3 className="font-bold text-lg text-stone-900">
              Refine {designName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-400 hover:text-stone-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-stone-500 font-medium">
            Explain what changes you would like to make to this design (colors, layouts, spacing, fonts, etc.). Nexo will regenerate both design options based on your feedback.
          </p>
          
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g., Make it look cleaner, use a vibrant violet primary accent color, and add card shadows..."
            className="w-full h-32 p-4 text-sm bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none font-medium text-stone-800"
            required
            autoFocus
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-bold uppercase tracking-wider text-stone-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!feedback.trim()}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              Regenerate Options
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
