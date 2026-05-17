import React from "react";
import { Check, X, Star, Zap, Shield, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useSubscriptionStore,
  PLANS,
  PlanType,
} from "../../stores/subscriptionStore";
import toast from "react-hot-toast";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentPlan, setPlan } = useSubscriptionStore();

  if (!isOpen) return null;

  const handleUpgrade = (plan: PlanType) => {
    setPlan(plan);
    toast.success(`Welcome to the ${PLANS[plan].name} plan!`);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-200"
        >
          <div className="p-8 text-center border-b border-stone-100 bg-stone-50/50">
            <h2 className="text-4xl font-black text-stone-900 tracking-tight mb-2">
              Upgrade Your <span className="text-indigo-600">Nexo</span>{" "}
              Experience
            </h2>
            <p className="text-stone-500 font-medium">
              Choose the plan that fits your ambition.
            </p>
          </div>

          <div className="p-10 grid grid-cols-1 md:grid-cols-4 gap-6">
            {(Object.keys(PLANS) as PlanType[]).map((key) => {
              const plan = PLANS[key];
              const isCurrent = currentPlan === key;

              return (
                <div
                  key={key}
                  className={`relative p-6 rounded-3xl border-2 flex flex-col transition-all ${isCurrent ? "border-indigo-500 bg-indigo-50/10" : "border-stone-100 hover:border-indigo-200"}`}
                >
                  {key === "pro" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest shadow-lg">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-xl font-black text-stone-900 mb-1">
                      {plan.name}
                    </h3>
                    <div className="text-3xl font-black text-stone-900">
                      {key === "free"
                        ? "$0"
                        : key === "pro"
                          ? "$29"
                          : key === "team"
                            ? "$99"
                            : "Custom"}
                      <span className="text-sm text-stone-400 font-normal">
                        /mo
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 mb-8">
                    <FeatureItem
                      label={`${plan.generationsLimit === Infinity ? "Unlimited" : plan.generationsLimit} Generations`}
                    />
                    <FeatureItem
                      label={`${plan.runtimeMinutesLimit === Infinity ? "Unlimited" : plan.runtimeMinutesLimit} Runtime Min`}
                    />
                    <FeatureItem
                      label={`${plan.deploymentLimit === Infinity ? "Unlimited" : plan.deploymentLimit} Deploys`}
                    />
                    <FeatureItem label={plan.models.join(", ")} muted />
                  </div>

                  <button
                    onClick={() => handleUpgrade(key)}
                    disabled={isCurrent}
                    className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${isCurrent ? "bg-stone-100 text-stone-400 cursor-default" : "bg-stone-900 text-white hover:bg-black shadow-xl active:scale-95"}`}
                  >
                    {isCurrent ? "Current Plan" : "Select Plan"}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="p-6 bg-stone-50 border-t border-stone-100 flex justify-center">
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600 font-bold text-xs uppercase tracking-widest transition-colors"
            >
              Close & Continue
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const FeatureItem = ({
  label,
  muted = false,
}: {
  label: string;
  muted?: boolean;
}) => (
  <div className="flex items-center gap-3">
    <div
      className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${muted ? "bg-stone-100" : "bg-emerald-50"}`}
    >
      <Check
        className={`w-3 h-3 ${muted ? "text-stone-400" : "text-emerald-600"}`}
      />
    </div>
    <span
      className={`text-[11px] font-bold ${muted ? "text-stone-400" : "text-stone-700"}`}
    >
      {label}
    </span>
  </div>
);
