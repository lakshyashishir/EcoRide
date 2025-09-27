'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, Zap, Blocks, Globe } from 'lucide-react';

interface ProcessingPageProps {
  onNavigate: (section: string) => void;
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
    id: 'complete',
    label: 'Journey Verified',
    description: 'Processing rewards',
    icon: Check,
    duration: 1000,
  },
];

export default function ProcessingPage({ onNavigate }: ProcessingPageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

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
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto space-y-6">

          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg animate-pulse">
              <Clock className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Processing Journey</h1>
            <p className="text-muted-foreground text-sm">
              Validating your metro ticket on Hedera network
            </p>
          </div>

          {/* Progress Card */}
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

              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}