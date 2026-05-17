import React, { useRef, useEffect } from "react";
import { useRuntimeStore } from "../../stores/runtimeStore";

export const Terminal: React.FC = () => {
  const { terminalLogs } = useRuntimeStore();
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  return (
    <div
      ref={terminalRef}
      className="h-full w-full bg-[#181818] p-4 font-mono text-xs text-stone-300 overflow-y-auto whitespace-pre-wrap selection:bg-indigo-500/30"
    >
      {terminalLogs.length === 0 ? (
        <div className="text-stone-600 italic">
          Waiting for process output...
        </div>
      ) : (
        terminalLogs.map((log, i) => (
          <div key={i} className="mb-1">
            <span className="text-stone-500 mr-2 opacity-50">
              [{new Date().toLocaleTimeString()}]
            </span>
            <span className={log.includes("error") ? "text-red-400" : ""}>
              {log}
            </span>
          </div>
        ))
      )}
    </div>
  );
};
