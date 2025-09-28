'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, Zap, Blocks, Globe, Coins, Sparkles, Leaf } from 'lucide-react';

interface ProcessingPageProps {
  onNavigate: (section: string) => void;
  journeyData?: {
    carbonSaved: number; // in grams
    tokensEarned: number;
    fromStation?: string;
    toStation?: string;
    distance?: number;
  };
}

const processingSteps = [
  {
    id: 'hts',
    label: 'Hedera Token Service',
    description: 'Initializing smart contract',
    icon: Zap,
    duration: 1500,
  },
  {
    id: 'hcs',
    label: 'Hedera Consensus Service',
    description: 'Recording journey data',
    icon: Blocks,
    duration: 2000,
  },
  {
    id: 'mirror',
    label: 'Mirror Node Verification',
    description: 'Validating transaction',
    icon: Globe,
    duration: 1800,
  },
  {
    id: 'minting',
    label: 'Minting GREEN Tokens',
    description: 'Creating your rewards',
    icon: Coins,
    duration: 2200,
  },
  {
    id: 'complete',
    label: 'Journey Verified',
    description: 'Rewards distributed',
    icon: Check,
    duration: 800,
  },
];

export default function ProcessingPage({ onNavigate, journeyData }: ProcessingPageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showMintingEffect, setShowMintingEffect] = useState(false);
  const [tokensEarned, setTokensEarned] = useState(0);
  const [carbonSaved, setCarbonSaved] = useState(0);

  useEffect(() => {
    let totalTime = 0;
    let currentTime = 0;

    const interval = setInterval(() => {
      const step = processingSteps[currentStep];
      if (!step) return;

      currentTime += 100;
      totalTime = processingSteps.reduce((acc, s, i) => acc + (i <= currentStep ? s.duration : 0), 0);

      const stepProgress = Math.min((currentTime / totalTime) * 100, 100);
      setProgress(stepProgress);

      if (currentTime >= step.duration) {
        if (currentStep < processingSteps.length - 1) {

          if (step.id === 'minting') {
            setShowMintingEffect(true);
          
            let tokenCount = 0;
            let carbonCount = 0;
            const targetTokens = journeyData?.tokensEarned || 0;
            const targetCarbon = journeyData?.carbonSaved || 0;
            const tokenInterval = setInterval(() => {
              tokenCount += 0.1;
              carbonCount += 10;
              if (tokenCount <= targetTokens) {
                setTokensEarned(Math.min(tokenCount, targetTokens));
              }
              if (carbonCount <= targetCarbon) {
                setCarbonSaved(Math.min(carbonCount, targetCarbon));
              }
              if (tokenCount >= targetTokens && carbonCount >= targetCarbon) {
                clearInterval(tokenInterval);
              }
            }, 50);
          }
          setCurrentStep(prev => prev + 1);
          currentTime = 0;
        } else {
          clearInterval(interval);
          setTimeout(() => onNavigate('success'), 800);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentStep, onNavigate]);

  return (
    <div className="min-h-screen bg-background flex items-center">
      <div className="container mx-auto px-4 pt-20">
        <div className="max-w-md mx-auto space-y-6">

          
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg animate-pulse">
              <Clock className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Processing Journey</h1>
            <p className="text-muted-foreground text-sm">
              {journeyData?.fromStation && journeyData?.toStation
                ? `${journeyData.fromStation} → ${journeyData.toStation}`
                : 'Validating your metro ticket on Hedera network'
              }
            </p>
          </div>

         
          <Card className="border-border shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-6">

                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

               
                <div className="space-y-4">
                  {processingSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;

                    return (
                      <div key={step.id} className="flex items-center space-x-3">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center transition-all
                          ${isCompleted
                            ? 'bg-primary text-primary-foreground'
                            : isActive
                              ? 'bg-chart-2 text-primary-foreground animate-pulse'
                              : 'bg-secondary text-muted-foreground'
                          }
                        `}>
                          {isCompleted ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className={`font-medium ${isActive ? 'text-chart-2' : isCompleted ? 'text-primary' : 'text-muted-foreground'}`}>
                              {step.label}
                            </h3>
                            {isActive && (
                              <Badge variant="secondary" className="text-xs bg-chart-2/10 text-chart-2">
                                Processing
                              </Badge>
                            )}
                            {isCompleted && (
                              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                Complete
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>


                <div className="bg-secondary rounded-lg p-4 border border-border">
                  <div className="flex items-start space-x-2">
                    <Blocks className="w-4 h-4 text-chart-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Blockchain Processing
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Your journey is being securely recorded on the Hedera network for transparency and carbon credit verification.
                      </p>
                    </div>
                  </div>
                </div>

               
                {showMintingEffect && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 animate-fade-in">
                    <div className="text-center space-y-3">
                      <div className="flex justify-center relative">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                          <Coins className="w-6 h-6 text-white coin-float" />
                        </div>
                       
                        <div className="absolute -top-2 -left-2">
                          <Sparkles className="w-4 h-4 text-yellow-400 sparkle-animation" />
                        </div>
                        <div className="absolute -bottom-2 -right-2">
                          <Sparkles className="w-3 h-3 text-yellow-300 sparkle-animation" style={{ animationDelay: '0.5s' }} />
                        </div>
                        <div className="absolute top-0 right-0">
                          <Sparkles className="w-2 h-2 text-yellow-500 sparkle-animation" style={{ animationDelay: '1s' }} />
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-green-600 animate-spin" />
                        <p className="text-sm font-semibold text-green-800">Minting Rewards</p>
                        <Sparkles className="w-4 h-4 text-green-600 animate-spin" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            +{tokensEarned.toFixed(1)}
                          </div>
                          <div className="text-xs text-green-700 flex items-center justify-center gap-1">
                            <Coins className="w-3 h-3" />
                            GREEN Tokens
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-emerald-600">
                            {carbonSaved.toFixed(0)}g
                          </div>
                          <div className="text-xs text-emerald-700 flex items-center justify-center gap-1">
                            <Leaf className="w-3 h-3" />
                            CO₂ Saved
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center space-x-1">
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.1}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}


              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}