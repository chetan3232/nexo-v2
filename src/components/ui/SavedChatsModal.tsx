import React from "react";
import { X, Globe, Trash } from "lucide-react";

interface SavedChatsModalProps {
  onClose: () => void;
  savedChatsList: any[];
  onRestoreChat: (chat: any) => void;
  onDeleteChat: (id: string, e: React.MouseEvent) => void;
}

export const SavedChatsModal: React.FC<SavedChatsModalProps> = ({
  onClose,
  savedChatsList,
  onRestoreChat,
  onDeleteChat,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-bold text-xl text-stone-900">
            Saved Chats History
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-stone-400" />
          </button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
          {savedChatsList.length === 0 ? (
            <p className="text-center text-stone-400 py-8">
              No saved chats found.
            </p>
          ) : (
            savedChatsList.map((chat, index) => (
              <div
                key={chat.id || index}
                className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-200 hover:border-indigo-300 transition-all cursor-pointer group hover:shadow-md"
                onClick={() => onRestoreChat(chat)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-800">
                      {chat.name || "Untitled Project"}
                    </h4>
                    <p className="text-[10px] text-stone-500 mt-0.5 font-medium uppercase tracking-wider">
                      {chat.date} • {chat.messages.length} interactions
                    </p>
                    {chat.content && (
                      <div className="flex gap-1 mt-2">
                        {Object.keys(chat.content.files)
                          .slice(0, 3)
                          .map((f, i) => (
                            <span
                              key={i}
                              className="text-[8px] px-1.5 py-0.5 bg-white border border-stone-200 rounded text-stone-400 font-mono"
                            >
                              {f}
                            </span>
                          ))}
                        {Object.keys(chat.content.files).length > 3 && (
                          <span className="text-[8px] text-stone-300">
                            +{Object.keys(chat.content.files).length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => onDeleteChat(chat.id, e)}
                  className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
