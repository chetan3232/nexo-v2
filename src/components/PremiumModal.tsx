import React, { useState } from "react";
import { Key, X, Sparkles, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PremiumModalProps {
  onClose: () => void;
  onSuccess: () => void;
  defaultType?: "deepseek" | "all";
}

export const PremiumModal: React.FC<PremiumModalProps> = ({
  onClose,
  onSuccess,
  defaultType = "all",
}) => {
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState({ text: "", type: "" });
  const [discount, setDiscount] = useState(0);
  const [selectedType, setSelectedType] = useState<"deepseek" | "all">(
    defaultType,
  );

  const price = selectedType === "deepseek" ? 50 : 80;
  const planName =
    selectedType === "deepseek"
      ? "Expert Mode Premium"
      : "Full Workspace Access";

  const handleApplyCoupon = () => {
    const code = couponCode.toUpperCase().trim();
    if (code === "NEXO-V3") {
      setDiscount(100);
      setCouponMessage({ text: "100% OFF APPLIED!", type: "success" });
    } else if (code === "SAVE10") {
      setDiscount(10);
      setCouponMessage({ text: "10% OFF APPLIED!", type: "success" });
    } else if (code === "SAVE20") {
      setDiscount(20);
      setCouponMessage({ text: "20% OFF APPLIED!", type: "success" });
    } else if (code === "SAVE30") {
      setDiscount(30);
      setCouponMessage({ text: "30% OFF APPLIED!", type: "success" });
    } else {
      setDiscount(0);
      setCouponMessage({ text: "Invalid Code", type: "error" });
    }
  };

  const handleUnlock = () => {
    const unlockTime = new Date();
    unlockTime.setDate(unlockTime.getDate() + 1); // 1 Day
    if (selectedType === "deepseek") {
      localStorage.setItem(
        "nexo_deepseek_premium_until",
        unlockTime.toISOString(),
      );
    } else {
      localStorage.setItem("nexo_all_premium_until", unlockTime.toISOString());
    }

    window.dispatchEvent(new Event("storage"));
    onSuccess();
  };

  const featuresList =
    selectedType === "deepseek"
      ? [
          "Expert Mode Premium Access",
          "Ultra-advanced logical reasoning",
          "Expanded 8K Context Window",
          "Priority API Routing",
        ]
      : [
          "All Advanced Models",
          "Maximum 16K Context Windows",
          "Advanced multimodal reasoning",
          "Top-Tier Priority Routing",
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-white/40 animate-in zoom-in-95 duration-300">
        {/* Dynamic Header Background based on type */}
        <div
          className={`relative h-32 w-full transition-colors duration-500 overflow-hidden ${selectedType === "deepseek" ? "bg-gradient-to-br from-indigo-500 to-blue-600" : "bg-gradient-to-br from-amber-500 to-orange-600"}`}
        >
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="p-2 bg-black/10 hover:bg-black/20 text-white rounded-full transition-colors backdrop-blur-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="absolute bottom-[-1.5rem] left-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-stone-900 shadow-xl border-4 border-white">
              <Key className="w-7 h-7" />
            </div>
          </div>
        </div>

        <div className="p-6 pt-10">
          <h3 className="font-black text-3xl text-stone-900 leading-tight mb-2 tracking-tight">
            Unlock Premium
          </h3>
          <p className="text-sm text-stone-500 font-medium mb-6 leading-relaxed">
            Get full access to top-tier AI reasoning. Valid for{" "}
            <strong className="text-stone-800">1 Day</strong>.
          </p>

          {/* Plan Selector */}
          <div className="flex gap-2 mb-6 bg-stone-100/80 p-1.5 rounded-2xl backdrop-blur-sm">
            <button
              onClick={() => setSelectedType("deepseek")}
              className={`relative flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors z-10 ${selectedType === "deepseek" ? "text-indigo-700" : "text-stone-500 hover:text-stone-800"}`}
            >
              {selectedType === "deepseek" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1] border border-stone-200/50"
                ></motion.div>
              )}
              Expert Only
            </button>
            <button
              onClick={() => setSelectedType("all")}
              className={`relative flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors z-10 ${selectedType === "all" ? "text-amber-700" : "text-stone-500 hover:text-stone-800"}`}
            >
              {selectedType === "all" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1] border border-stone-200/50"
                ></motion.div>
              )}
              All Models
            </button>
          </div>

          {/* Feature List (Animated) */}
          <div className="mb-6 h-32 relative">
            <AnimatePresence mode="popLayout">
              <motion.ul
                key={selectedType}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 absolute inset-0"
              >
                {featuresList.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-3 text-sm text-stone-700 font-medium"
                  >
                    <CheckCircle2
                      className={`w-4 h-4 ${selectedType === "deepseek" ? "text-indigo-500" : "text-amber-500"}`}
                    />
                    {feature}
                  </li>
                ))}
              </motion.ul>
            </AnimatePresence>
          </div>

          {/* Price Details */}
          <div
            className={`border rounded-2xl p-4 mb-6 relative overflow-hidden transition-colors duration-500 ${selectedType === "deepseek" ? "bg-indigo-50/50 border-indigo-100" : "bg-amber-50/50 border-amber-100"}`}
          >
            <div className="flex justify-between items-center relative z-10">
              <span className="text-stone-600 font-bold text-sm">
                Price per Day
              </span>
              <div className="text-right flex items-center gap-3">
                {discount > 0 && (
                  <span className="text-sm font-bold text-stone-400 line-through">
                    ₹{price}
                  </span>
                )}
                <span
                  className={`text-3xl font-black ${selectedType === "deepseek" ? "text-indigo-900" : "text-amber-900"}`}
                >
                  ₹{Math.max(0, price - (price * discount) / 100).toFixed(0)}
                </span>
              </div>
            </div>
          </div>

          {/* Coupon Section */}
          <div className="mb-6 space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1">
              Coupon Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. NEXO-V3"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 uppercase font-mono text-sm shadow-inner"
              />
              <button
                onClick={handleApplyCoupon}
                className="px-6 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-colors shadow-lg"
              >
                Apply
              </button>
            </div>
            {couponMessage.text && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-[10px] pl-1 font-bold uppercase tracking-widest ${couponMessage.type === "success" ? "text-green-500" : "text-red-500"}`}
              >
                {couponMessage.text}
              </motion.p>
            )}
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleUnlock}
            className={`w-full py-4 text-white shadow-xl rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-2 overflow-hidden relative group`}
          >
            {/* Button background gradient depending on type */}
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${selectedType === "deepseek" ? "bg-gradient-to-r from-indigo-600 to-blue-700" : "bg-gradient-to-r from-amber-500 to-orange-600"}`}
            ></div>

            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>

            <Sparkles className="w-5 h-5 relative z-10" />
            <span className="relative z-10 text-lg">
              Pay & Unlock {planName}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
