"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CreditCard, Calculator, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface DemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  {
    icon: CreditCard,
    title: "Enter your purchase",
    description: "Paste a URL or type a merchant name. We identify the category instantly.",
  },
  {
    icon: Calculator,
    title: "Get the best card",
    description: "See which card maximizes rewards with detailed reasoning and expected value.",
  },
  {
    icon: Clock,
    title: "Optimize timing",
    description: "Know when to pay to keep utilization low and protect your credit score.",
  },
];

export function DemoModal({ open, onOpenChange }: DemoModalProps) {
  const navigate = useNavigate();

  const handleTryAnalyzer = () => {
    onOpenChange(false);
    navigate("/analyze");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-3xl p-0 overflow-hidden bg-card border-border">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-semibold text-foreground">
            How CardClutch works
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                className="flex gap-4 p-4 rounded-2xl bg-secondary/50 border border-border"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <step.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      Step {index + 1}
                    </span>
                  </div>
                  <h4 className="font-medium text-foreground mb-1">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Demo Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft-md">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Example Analysis</span>
                <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded-full">
                  Live Demo
                </span>
              </div>
              
              {/* Mock result */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                  <span className="text-xs text-white/80 font-mono">VISA</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground">Chase Sapphire Reserve</div>
                  <div className="text-sm text-muted-foreground">3× points on travel & dining</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-primary">$12.75</div>
                  <div className="text-xs text-muted-foreground">expected value</div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 rounded-xl"
            >
              Close
            </Button>
            <Button
              onClick={handleTryAnalyzer}
              className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              Try the Analyzer
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
