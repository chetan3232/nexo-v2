import React from "react";
import { Rocket, X, CheckCircle, ExternalLink, Download } from "lucide-react";

interface DeployModalProps {
  status: "idle" | "deploying" | "done" | "error";
  url: string;
  onClose: () => void;
  onDownloadHtml: () => void;
  onDownloadZip: () => void;
}

export const DeployModal: React.FC<DeployModalProps> = ({
  status,
  url,
  onClose,
  onDownloadHtml,
  onDownloadZip,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Rocket className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900">Deploy Website</h3>
              <p className="text-xs text-stone-400">
                Launch your project to the web
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-stone-400" />
          </button>
        </div>

        <div className="p-6">
          {status === "deploying" && (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 mx-auto border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-stone-600">
                Building & deploying your website...
              </p>
              <div className="flex justify-center gap-1">
                {["Bundling files", "Optimizing assets", "Going live"].map(
                  (step, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-1 bg-stone-100 rounded-full text-stone-400"
                    >
                      {step}
                    </span>
                  ),
                )}
              </div>
            </div>
          )}

          {status === "done" && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-bold text-lg text-stone-900">
                  Website is Ready! 🎉
                </h4>
                <p className="text-sm text-stone-500 mt-1">
                  Your website has been built successfully
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => window.open(url, "_blank")}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Open Website
                </button>

                <button
                  onClick={onDownloadHtml}
                  className="w-full flex items-center justify-center gap-2 bg-stone-100 text-stone-900 py-3 rounded-xl font-bold hover:bg-stone-200 transition-colors"
                >
                  <Download className="w-4 h-4" /> Download as HTML
                </button>

                <button
                  onClick={onDownloadZip}
                  className="w-full flex items-center justify-center gap-2 bg-stone-50 text-stone-600 py-3 rounded-xl font-medium hover:bg-stone-100 transition-colors border border-stone-200"
                >
                  <Download className="w-4 h-4" /> Download ZIP (All Files)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
