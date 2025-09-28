"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, User, AlertTriangle, CheckCircle, Activity } from 'lucide-react';

interface FraudAnalysis {
  accountId: string;
  fraudScore: number;
  riskLevel: string;
  approved: boolean;
  timestamp: string;
  summary: {
    accountRisk: number;
    journeyRisk: number;
    recommendations: string[];
  };
}

interface AgentStats {
  agentName: string;
  version: string;
  network: string;
  capabilities: string[];
}

export default function FraudDetection() {
  const [accountId, setAccountId] = useState('');
  const [analysis, setAnalysis] = useState<FraudAnalysis | null>(null);
  const [agentStats, setAgentStats] = useState<AgentStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAgentStats();
  }, []);

  const loadAgentStats = async () => {
    try {
      // Mock stats - would connect to your backend API
      const mockStats: AgentStats = {
        agentName: "EcoRide Anti-Fraud Agent",
        version: "1.0.0",
        network: "hedera-testnet",
        capabilities: [
          "Account age analysis",
          "Transaction history review",
          "Journey pattern validation",
          "Real-time fraud scoring"
        ]
      };
      setAgentStats(mockStats);
    } catch (error) {
      console.error('Failed to load agent stats:', error);
    }
  };

  const analyzeAccount = async () => {
    if (!accountId.trim()) {
      setError('Please enter a valid account ID');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Mock analysis - would connect to your fraud detection API
      const mockAnalysis: FraudAnalysis = {
        accountId,
        fraudScore: Math.floor(Math.random() * 100),
        riskLevel: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
        approved: true,
        timestamp: new Date().toISOString(),
        summary: {
          accountRisk: Math.floor(Math.random() * 50),
          journeyRisk: Math.floor(Math.random() * 50),
          recommendations: [
            "Account validation completed",
            "No suspicious patterns detected",
            "Approved for journey rewards"
          ]
        }
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      setAnalysis(mockAnalysis);
    } catch (error) {
      setError('Failed to analyze account. Please try again.');
      console.error('Analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel.toUpperCase()) {
      case 'LOW': return 'bg-green-100 text-green-800 border-green-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel.toUpperCase()) {
      case 'LOW': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'MEDIUM': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'HIGH': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Shield className="text-blue-600" />
          Anti-Fraud Detection
        </h1>
        <p className="text-muted-foreground">
          AI-powered fraud detection using Hedera Agent Kit
        </p>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          🤖 Powered by Hedera Agent Kit
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Account Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="text-blue-600" />
              Account Analysis
            </CardTitle>
            <CardDescription>
              Analyze Hedera account for fraud indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Hedera Account ID</label>
              <div className="flex gap-2">
                <Input
                  placeholder="0.0.123456"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  onClick={analyzeAccount}
                  disabled={isLoading || !accountId.trim()}
                >
                  {isLoading ? 'Analyzing...' : 'Analyze'}
                </Button>
              </div>
            </div>

            {error && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {analysis && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Risk Assessment</span>
                    <div className="flex items-center gap-2">
                      {getRiskIcon(analysis.riskLevel)}
                      <Badge className={getRiskBadgeColor(analysis.riskLevel)}>
                        {analysis.riskLevel} RISK
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Fraud Score:</span>
                      <span className="font-medium">{analysis.fraudScore}/100</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Account Risk:</span>
                      <span className="font-medium">{analysis.summary.accountRisk}/100</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Status:</span>
                      <Badge variant={analysis.approved ? "outline" : "destructive"}>
                        {analysis.approved ? "✅ Approved" : "❌ Rejected"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Recommendations</h4>
                  <ul className="space-y-1">
                    {analysis.summary.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-xs text-muted-foreground">
                  Analysis completed: {new Date(analysis.timestamp).toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Information</CardTitle>
            <CardDescription>
              Fraud detection agent capabilities and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {agentStats && (
              <>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Agent Name:</span>
                    <span className="font-medium">{agentStats.agentName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Version:</span>
                    <Badge variant="outline">{agentStats.version}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Network:</span>
                    <Badge variant="secondary">{agentStats.network}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Capabilities</h4>
                  <div className="grid gap-2">
                    {agentStats.capabilities.map((capability, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{capability}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-800">Agent Online</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Ready to analyze accounts and journeys
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Anti-Fraud Detection Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="font-medium">Account Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Examine account age, balance, and transaction history
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <span className="text-2xl">🚇</span>
              </div>
              <h3 className="font-medium">Journey Validation</h3>
              <p className="text-sm text-muted-foreground">
                Verify journey distance, timing, and station validity
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="font-medium">AI Scoring</h3>
              <p className="text-sm text-muted-foreground">
                Calculate fraud risk score using rule-based logic
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="font-medium">Decision</h3>
              <p className="text-sm text-muted-foreground">
                Approve or reject based on risk assessment
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}