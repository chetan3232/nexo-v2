import React, { useState } from "react";
import { Sparkles, Check, Edit, Trash2, Plus, RefreshCw, Layers, ShieldAlert, Cpu } from "lucide-react";
import { useGenerationWorkflowStore } from "../../stores/generationWorkflowStore";
import { useAgentStore } from "../../stores/agentStore";
import { ImplementationPlanService, ImplementationPlan } from "../../services/implementationPlanService";
import toast from "react-hot-toast";

export const ImplementationPlanPanel: React.FC = () => {
  const {
    parsedImplementationPlan,
    setParsedImplementationPlan,
    selectedDesignSnapshot,
    approvePlan,
  } = useGenerationWorkflowStore();
  const { projectMode } = useAgentStore();

  const [aiFeedback, setAiFeedback] = useState("");
  const [refining, setRefining] = useState(false);

  // Local state edit fields for new item additions
  const [newPage, setNewPage] = useState("");
  const [newComponent, setNewComponent] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [newTech, setNewTech] = useState("");
  const [newApi, setNewApi] = useState("");
  const [newSecurity, setNewSecurity] = useState("");
  const [newStep, setNewStep] = useState("");

  if (!parsedImplementationPlan) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-stone-50 p-6 select-none">
        <Cpu className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-bold text-stone-500 uppercase tracking-widest">
          Analyzing Requirements & Building Technical Plan...
        </p>
      </div>
    );
  }

  const plan = parsedImplementationPlan as ImplementationPlan;

  // Local state update functions (for simple inline edits)
  const updateField = (field: keyof ImplementationPlan, value: any) => {
    setParsedImplementationPlan({
      ...plan,
      [field]: value,
    });
  };

  const handleArrayItemChange = (field: keyof ImplementationPlan, index: number, value: string) => {
    const arr = [...(plan[field] as string[])];
    arr[index] = value;
    updateField(field, arr);
  };

  const removeArrayItem = (field: keyof ImplementationPlan, index: number) => {
    const arr = (plan[field] as string[]).filter((_, i) => i !== index);
    updateField(field, arr);
  };

  const addArrayItem = (field: keyof ImplementationPlan, value: string, resetFn: () => void) => {
    if (!value.trim()) return;
    const arr = [...(plan[field] as string[]), value.trim()];
    updateField(field, arr);
    resetFn();
  };

  // AI Refinement handler
  const handleAiRefinement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiFeedback.trim()) return;

    setRefining(true);
    const toastId = toast.loading("AI is refining the implementation plan...");
    try {
      const refined = await ImplementationPlanService.getInstance().refineImplementationPlan(
        plan,
        aiFeedback,
        projectMode,
        3
      );
      setParsedImplementationPlan(refined);
      setAiFeedback("");
      toast.success("Implementation plan refined successfully! ✨", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(`Refinement failed: ${err.message || "Unknown error"}`, { id: toastId });
    } finally {
      setRefining(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-stone-50 overflow-hidden relative">
      {/* Top Header */}
      <div className="h-[64px] border-b border-stone-200 bg-white flex items-center justify-between px-6 shrink-0 shadow-sm z-10 select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-stone-900 text-sm uppercase tracking-tight">Technical Review</h3>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
              Selected Design: {selectedDesignSnapshot?.designName || "Default"}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            approvePlan();
            toast.success("Implementation plan approved! Launching agents... 🚀");
          }}
          className="flex items-center gap-1.5 px-6 py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
        >
          <Check className="w-4 h-4" />
          Approve & Implement
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        
        {/* Project Summary Section */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h4 className="font-black text-stone-900 text-sm uppercase tracking-wider border-b border-stone-100 pb-2">
            Project Summary
          </h4>
          <textarea
            value={plan.projectSummary}
            onChange={(e) => updateField("projectSummary", e.target.value)}
            className="w-full min-h-[80px] p-3 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-stone-800"
          />
        </div>

        {/* Selected Design Section */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h4 className="font-black text-stone-900 text-sm uppercase tracking-wider border-b border-stone-100 pb-2">
            Selected Design Style
          </h4>
          <textarea
            value={plan.selectedDesignSummary}
            onChange={(e) => updateField("selectedDesignSummary", e.target.value)}
            className="w-full min-h-[60px] p-3 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-stone-800"
          />
        </div>

        {/* Dynamic List Sections: Pages, Components, Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Technology Stack */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="font-black text-stone-900 text-sm uppercase tracking-wider border-b border-stone-100 pb-2 mb-3">
                Technology Stack
              </h4>
              <div className="flex flex-wrap gap-2">
                {plan.technologyStack.map((tech, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 text-stone-800 text-[10px] font-bold uppercase rounded-full border border-stone-200"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeArrayItem("technologyStack", idx)}
                      className="text-stone-400 hover:text-stone-700 font-bold ml-1 text-xs"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-4 border-t border-stone-100">
              <input
                type="text"
                placeholder="Add technology..."
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                className="flex-1 p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
              />
              <button
                type="button"
                onClick={() => addArrayItem("technologyStack", newTech, () => setNewTech(""))}
                className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Architecture Summary */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="font-black text-stone-900 text-sm uppercase tracking-wider border-b border-stone-100 pb-2">
              Architecture Overview
            </h4>
            <textarea
              value={plan.architecture}
              onChange={(e) => updateField("architecture", e.target.value)}
              className="w-full min-h-[100px] p-3 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none font-mono text-stone-800"
            />
          </div>

          {/* Pages */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="font-black text-stone-900 text-sm uppercase tracking-wider border-b border-stone-100 pb-2">
              Application Pages
            </h4>
            <div className="space-y-2 max-h-[250px] overflow-y-auto no-scrollbar">
              {plan.pages.map((page, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={page}
                    onChange={(e) => handleArrayItemChange("pages", idx, e.target.value)}
                    className="flex-grow p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none font-semibold text-stone-800"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem("pages", idx)}
                    className="p-2 text-stone-400 hover:text-red-500 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-stone-100">
              <input
                type="text"
                placeholder="Add page description..."
                value={newPage}
                onChange={(e) => setNewPage(e.target.value)}
                className="flex-grow p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
              />
              <button
                type="button"
                onClick={() => addArrayItem("pages", newPage, () => setNewPage(""))}
                className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-xl"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Components */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="font-black text-stone-900 text-sm uppercase tracking-wider border-b border-stone-100 pb-2">
              Key Components
            </h4>
            <div className="space-y-2 max-h-[250px] overflow-y-auto no-scrollbar">
              {plan.components.map((comp, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={comp}
                    onChange={(e) => handleArrayItemChange("components", idx, e.target.value)}
                    className="flex-grow p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none font-semibold text-stone-800"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem("components", idx)}
                    className="p-2 text-stone-400 hover:text-red-500 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-stone-100">
              <input
                type="text"
                placeholder="Add component..."
                value={newComponent}
                onChange={(e) => setNewComponent(e.target.value)}
                className="flex-grow p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl"
              />
              <button
                type="button"
                onClick={() => addArrayItem("components", newComponent, () => setNewComponent(""))}
                className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-xl"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="font-black text-stone-900 text-sm uppercase tracking-wider border-b border-stone-100 pb-2">
              Required Features
            </h4>
            <div className="space-y-2 max-h-[250px] overflow-y-auto no-scrollbar">
              {plan.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={feat}
                    onChange={(e) => handleArrayItemChange("features", idx, e.target.value)}
                    className="flex-grow p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none font-semibold text-stone-800"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem("features", idx)}
                    className="p-2 text-stone-400 hover:text-red-500 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-stone-100">
              <input
                type="text"
                placeholder="Add feature..."
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                className="flex-grow p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl"
              />
              <button
                type="button"
                onClick={() => addArrayItem("features", newFeature, () => setNewFeature(""))}
                className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-xl"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* API Requirements */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="font-black text-stone-900 text-sm uppercase tracking-wider border-b border-stone-100 pb-2">
              API / Backend Endpoints
            </h4>
            <div className="space-y-2 max-h-[250px] overflow-y-auto no-scrollbar">
              {plan.apiRequirements.map((api, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={api}
                    onChange={(e) => handleArrayItemChange("apiRequirements", idx, e.target.value)}
                    className="flex-grow p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none font-semibold text-stone-800"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem("apiRequirements", idx)}
                    className="p-2 text-stone-400 hover:text-red-500 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-stone-100">
              <input
                type="text"
                placeholder="Add endpoint..."
                value={newApi}
                onChange={(e) => setNewApi(e.target.value)}
                className="flex-grow p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl"
              />
              <button
                type="button"
                onClick={() => addArrayItem("apiRequirements", newApi, () => setNewApi(""))}
                className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-xl"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Security Requirements */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="font-black text-stone-900 text-sm uppercase tracking-wider border-b border-stone-100 pb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" /> Security Controls
            </h4>
            <div className="space-y-2 max-h-[250px] overflow-y-auto no-scrollbar">
              {plan.securityRequirements.map((sec, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={sec}
                    onChange={(e) => handleArrayItemChange("securityRequirements", idx, e.target.value)}
                    className="flex-grow p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none font-semibold text-stone-800"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem("securityRequirements", idx)}
                    className="p-2 text-stone-400 hover:text-red-500 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-stone-100">
              <input
                type="text"
                placeholder="Add security check..."
                value={newSecurity}
                onChange={(e) => setNewSecurity(e.target.value)}
                className="flex-grow p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl"
              />
              <button
                type="button"
                onClick={() => addArrayItem("securityRequirements", newSecurity, () => setNewSecurity(""))}
                className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-xl"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Implementation Steps */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4 md:col-span-2">
            <h4 className="font-black text-stone-900 text-sm uppercase tracking-wider border-b border-stone-100 pb-2">
              Implementation Timeline & Steps
            </h4>
            <div className="space-y-2">
              {plan.implementationSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl">
                    Step {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => handleArrayItemChange("implementationSteps", idx, e.target.value)}
                    className="flex-grow p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none font-semibold text-stone-800"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem("implementationSteps", idx)}
                    className="p-2 text-stone-400 hover:text-red-500 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-stone-100">
              <input
                type="text"
                placeholder="Add implementation step..."
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
                className="flex-grow p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl"
              />
              <button
                type="button"
                onClick={() => addArrayItem("implementationSteps", newStep, () => setNewStep(""))}
                className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-xl"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Semantic Refinement Form */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-2 select-none">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            <h4 className="font-black text-stone-900 text-sm uppercase tracking-wider">
              Semantic AI Refinement
            </h4>
          </div>
          <form onSubmit={handleAiRefinement} className="space-y-4">
            <p className="text-xs text-stone-500 font-medium">
              Request high-level architectural changes, structural shifts, or complex refinements. The AI will resturcture the plan while leaving unrelated sections intact.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={aiFeedback}
                onChange={(e) => setAiFeedback(e.target.value)}
                placeholder="e.g. Reorganize the architecture for better scalability and add a dedicated router..."
                disabled={refining}
                className="flex-grow p-3 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-stone-800 disabled:opacity-75"
                required
              />
              <button
                type="submit"
                disabled={!aiFeedback.trim() || refining}
                className="flex items-center gap-1.5 px-6 py-3 bg-stone-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50"
              >
                {refining ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Refining...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Refine
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
