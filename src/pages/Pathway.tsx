/**
 * Pathway Page
 * Displays user's complete credit pathway with timeline and recommendations
 */

import { useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useCreditProfile, CreditProfile } from '@/hooks/useCreditProfile';
import { buildPathway, PathwayProfile } from '@/lib/pathway/engine';
import { PathwayOutput, STAGE_DISPLAY_NAMES, STAGE_DESCRIPTIONS } from '@/lib/pathway/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CreditCard,
  ShieldCheck,
  TrendingUp,
  Star,
  Rocket,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Clock,
  ArrowRight,
  Info,
  Calendar,
  Target,
  XCircle,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const STAGE_ICONS: Record<string, React.ReactNode> = {
  foundation: <CreditCard className="h-5 w-5" />,
  build: <ShieldCheck className="h-5 w-5" />,
  optimize: <TrendingUp className="h-5 w-5" />,
  scale: <Star className="h-5 w-5" />,
  elite: <Rocket className="h-5 w-5" />,
};

const STAGE_COLORS: Record<string, string> = {
  foundation: 'bg-slate-500',
  build: 'bg-blue-500',
  optimize: 'bg-emerald-500',
  scale: 'bg-amber-500',
  elite: 'bg-purple-500',
};

const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  now: { bg: 'bg-primary/10', text: 'text-primary' },
  soon: { bg: 'bg-amber-500/10', text: 'text-amber-600' },
  later: { bg: 'bg-muted', text: 'text-muted-foreground' },
};

function ConfidenceBadge({ confidence }: { confidence: 'low' | 'medium' | 'high' }) {
  const config = {
    high: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'High' },
    medium: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Medium' },
    low: { color: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Low' },
  };
  
  return (
    <Badge variant="outline" className={cn('text-xs', config[confidence].color)}>
      {config[confidence].label} confidence
    </Badge>
  );
}

function PathwayPage() {
  const { user } = useAuth();
  const { profile, loading } = useCreditProfile();
  
  const pathway = useMemo(() => {
    if (!profile) return null;
    
    try {
      const pathwayProfile: PathwayProfile = {
        age_bucket: profile.age_bucket ?? undefined,
        income_bucket: profile.income_bucket ?? undefined,
        experience_level: profile.experience_level,
        credit_history: profile.credit_history ?? undefined,
        has_derogatories: profile.has_derogatories,
        carry_balance: profile.carry_balance,
        bnpl_usage: profile.bnpl_usage ?? undefined,
        intent: profile.intent,
      };
      return buildPathway(pathwayProfile);
    } catch (err) {
      console.error('Pathway generation failed:', err);
      return null;
    }
  }, [profile]);
  
  const stageIndex = pathway 
    ? ['foundation', 'build', 'optimize', 'scale', 'elite'].indexOf(pathway.credit_stage)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-24">
          <div className="container-main py-12">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-24">
          <div className="container-main py-12 text-center">
            <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Your Credit Pathway</h1>
            <p className="text-muted-foreground mb-6">
              Sign in to see your personalized credit journey
            </p>
            <Link to="/auth">
              <Button variant="primary">Sign in</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!pathway) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-24">
          <div className="container-main py-12 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Complete Your Profile</h1>
            <p className="text-muted-foreground mb-6">
              We need a few more details to build your pathway
            </p>
            <Link to="/dashboard">
              <Button variant="primary">Go to Dashboard</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-24">
        <div className="container-main py-12">
          {/* Page Header */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <span className="mono-label text-muted-foreground mb-3 block">Pathway</span>
            <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4">
              Your Credit Journey
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Personalized roadmap based on your profile. Follow these steps to build strong credit.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Stage & Timeline */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Current Stage Card */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Current Stage</CardTitle>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-xs">
                            {pathway.stage_confidence}% confidence
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">
                            {pathway.stage_reasons.join('. ')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn('p-3 rounded-xl', STAGE_COLORS[pathway.credit_stage])}>
                        <div className="text-white">
                          {STAGE_ICONS[pathway.credit_stage]}
                        </div>
                      </div>
                      <div>
                        <p className="text-xl font-semibold">{STAGE_DISPLAY_NAMES[pathway.credit_stage]}</p>
                        <p className="text-sm text-muted-foreground">
                          {STAGE_DESCRIPTIONS[pathway.credit_stage]}
                        </p>
                      </div>
                    </div>
                    
                    {/* Progress Track */}
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            'h-2 flex-1 rounded-full transition-colors',
                            i <= stageIndex ? STAGE_COLORS[pathway.credit_stage] : 'bg-muted'
                          )}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>Foundation</span>
                      <span>Elite</span>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Immediate Focus */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Immediate Focus
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pathway.immediate_focus.map((focus, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{focus}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Your Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-3 top-3 bottom-3 w-px bg-border" />
                    
                    <div className="space-y-6">
                      {pathway.timeline.map((milestone, i) => (
                        <div key={i} className="flex gap-4 relative">
                          <div className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10',
                            i === 0 ? 'bg-primary' : 'bg-muted'
                          )}>
                            <div className={cn(
                              'w-2 h-2 rounded-full',
                              i === 0 ? 'bg-primary-foreground' : 'bg-muted-foreground'
                            )} />
                          </div>
                          <div className="flex-1 pb-2">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm">{milestone.title}</p>
                              <Badge variant="outline" className="text-xs">
                                {milestone.when}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Success: {milestone.success_metric}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-border text-center">
                    <p className="text-xs text-muted-foreground">
                      Next review: {pathway.next_review_date}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Next Moves */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ArrowRight className="h-5 w-5 text-primary" />
                    Next Moves
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pathway.next_moves.map((move, i) => (
                    <div key={i} className="p-4 rounded-xl border border-border bg-background hover:bg-muted/30 transition-colors">
                      <div className="flex items-start gap-3">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'text-xs flex-shrink-0 capitalize',
                            PRIORITY_STYLES[move.priority].bg,
                            PRIORITY_STYLES[move.priority].text
                          )}
                        >
                          {move.priority}
                        </Badge>
                        <div className="flex-1 space-y-2">
                          <p className="font-medium text-sm">{move.action}</p>
                          <p className="text-xs text-muted-foreground">
                            <span className="text-foreground">If:</span> {move.condition}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <span className="text-foreground">Why:</span> {move.rationale}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Right Column - Cards & Rules */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Recommended Cards */}
              {pathway.recommended_cards.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-emerald-500" />
                      Recommended Cards
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {pathway.recommended_cards.map((card, i) => (
                      <div 
                        key={i}
                        className="p-3 rounded-lg border border-border bg-background"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-medium text-sm">{card.name}</p>
                          <ConfidenceBadge confidence={card.confidence} />
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{card.reason}</p>
                        <p className="text-xs text-primary flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {card.timing}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Do Nots */}
              <Card className="border-destructive/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-destructive" />
                    Avoid These
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pathway.do_nots.map((doNot, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{doNot}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Behavior Rules */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Rules to Follow
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pathway.behavior_rules.map((rule, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{rule}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Privacy Note */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    All insights are based solely on your data. We never share your information.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default PathwayPage;
