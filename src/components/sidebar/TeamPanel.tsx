import React from "react";
import { useTeamStore } from "../../stores/teamStore";
import { Users, Sparkles, Circle, UserPlus, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const TeamPanel: React.FC = () => {
  const { members } = useTeamStore();

  return (
    <div className="p-8 space-y-8 h-full bg-[#fdfcfb]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-lg">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black text-stone-900 tracking-tight">
            AI Team
          </h2>
        </div>
        <button className="p-2 bg-white border border-stone-100 rounded-xl hover:shadow-md transition-all">
          <UserPlus className="w-4 h-4 text-stone-600" />
        </button>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
            Active Collaborators
          </span>
          <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
            {members.length}
          </span>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {members.map((member, i) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={member.id}
                className="group p-4 bg-white border border-stone-100 rounded-[2rem] hover:border-indigo-500 hover:shadow-2xl hover:shadow-stone-100 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-12 h-12 rounded-2xl bg-stone-50"
                    />
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${member.status === "idle" ? "bg-stone-300" : "bg-emerald-500 animate-pulse"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[13px] font-black text-stone-900 truncate">
                        {member.name}
                      </h3>
                      {member.isAI && (
                        <div className="p-1 bg-indigo-50 text-indigo-600 rounded-md">
                          <Sparkles className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      {member.role}
                    </p>
                  </div>
                  {member.status !== "idle" && (
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                      {member.status}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Invite Footer */}
      <div className="p-6 bg-stone-900 rounded-[2.5rem] text-white space-y-4 shadow-2xl shadow-stone-200">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-black uppercase tracking-widest">
            Share Workspace
          </span>
        </div>
        <p className="text-[10px] text-stone-400 leading-relaxed font-medium">
          Invite your human team members to build alongside NEXO's AI agents in
          real-time.
        </p>
        <button className="w-full py-3 bg-white text-stone-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all">
          Copy Invite Link
        </button>
      </div>
    </div>
  );
};
