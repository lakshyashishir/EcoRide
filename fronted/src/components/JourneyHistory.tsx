'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Clock,
  MapPin,
  Leaf,
  Coins,
  Shield,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  History,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useHedera } from '@/hooks/useHedera';
import { formatCarbonAmount, formatTokenAmount } from '@/utils/carbonCalculator';

interface JourneyHistoryProps {
  className?: string;
  maxItems?: number;
  showHeader?: boolean;
}

export default function JourneyHistory({
  className = '',
  maxItems,
  showHeader = true,
}: JourneyHistoryProps) {
  const { journeys, isConnected, isLoading } = useHedera();
  const [showAll, setShowAll] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  
  const mockJourneys = [
    {
      id: '1',
      fromStation: 'Rajiv Chowk',
      toStation: 'Connaught Place',
      distance: 2.5,
      carbonSaved: 0.425,
      tokensEarned: 4.25,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      hcsMessageId: '0.0.789-1234567890',
      verified: true,
    },
    {
      id: '2',
      fromStation: 'Kashmere Gate',
      toStation: 'Red Fort',
      distance: 3.2,
      carbonSaved: 0.544,
      tokensEarned: 5.44,
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      hcsMessageId: '0.0.789-1234567891',
      verified: true,
    },
    {
      id: '3',
      fromStation: 'New Delhi',
      toStation: 'India Gate',
      distance: 4.1,
      carbonSaved: 0.697,
      tokensEarned: 6.97,
      timestamp: new Date(Date.now() - 259200000).toISOString(),
      hcsMessageId: '0.0.789-1234567892',
      verified: true,
    },
    {
      id: '4',
      fromStation: 'AIIMS',
      toStation: 'Green Park',
      distance: 1.8,
      carbonSaved: 0.306,
      tokensEarned: 3.06,
      timestamp: new Date(Date.now() - 345600000).toISOString(),
      hcsMessageId: '0.0.789-1234567893',
      verified: true,
    },
    {
      id: '5',
      fromStation: 'Dwarka Mor',
      toStation: 'Rajouri Garden',
      distance: 5.2,
      carbonSaved: 0.884,
      tokensEarned: 8.84,
      timestamp: new Date(Date.now() - 432000000).toISOString(),
      hcsMessageId: '0.0.789-1234567894',
      verified: true,
    },
  ];

  
  const displayJourneys = isConnected ? journeys : mockJourneys;

  if (isLoading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (displayJourneys.length === 0) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              Journey History
            </CardTitle>
            <CardDescription>
              Track your metro journeys and their environmental impact
            </CardDescription>
          </CardHeader>
        )}
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MapPin className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No Journeys Yet
          </h3>
          <p className="text-gray-500 text-center max-w-md mb-6">
            Start scanning metro tickets to build your journey history and track your carbon savings.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sortedJourneys = [...displayJourneys].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const visibleJourneys = maxItems && !showAll
    ? sortedJourneys.slice(0, maxItems)
    : sortedJourneys;

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

    if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInMinutes < 1440) { // 24 hours
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                Journey History
              </CardTitle>
              <CardDescription>
                {displayJourneys.length} journey{displayJourneys.length !== 1 ? 's' : ''} with HCS verification
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                className="flex items-center gap-1"
              >
                <Filter className="w-3 h-3" />
                {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                {sortOrder === 'newest' ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronUp className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Route</TableHead>
                <TableHead className="w-[120px]">Distance</TableHead>
                <TableHead className="w-[120px]">Carbon Saved</TableHead>
                <TableHead className="w-[120px]">Tokens</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[120px]">Time</TableHead>
                <TableHead className="w-[80px]">HCS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleJourneys.map((journey) => (
                <TableRow key={journey.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 text-sm">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium">{journey.fromStation}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">{journey.toStation}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-sm font-medium">
                      {journey.distance.toFixed(1)} km
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Leaf className="w-3 h-3 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        {formatCarbonAmount(journey.carbonSaved)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Coins className="w-3 h-3 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        {formatTokenAmount(journey.tokensEarned)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={journey.verified ? "default" : "secondary"}
                      className={
                        journey.verified
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                      }
                    >
                      {journey.verified ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <AlertCircle className="w-3 h-3 mr-1" />
                      )}
                      {journey.verified ? 'Verified' : 'Pending'}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{formatDate(journey.timestamp)}</div>
                      <div className="text-xs text-muted-foreground">
                        {getRelativeTime(journey.timestamp)}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {journey.hcsMessageId ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => window.open(
                          `https://hashscan.io/testnet/topic/${journey.hcsMessageId}`,
                          '_blank'
                        )}
                        title="View on HashScan"
                      >
                        <div className="flex items-center">
                          <Shield className="w-3 h-3 text-blue-600" />
                          <ExternalLink className="w-2 h-2 text-blue-600 ml-0.5" />
                        </div>
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center">
                        <AlertCircle className="w-3 h-3 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        
        {maxItems && displayJourneys.length > maxItems && (
          <div className="border-t p-4">
            <Button
              variant="outline"
              onClick={() => setShowAll(!showAll)}
              className="w-full"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Show All {displayJourneys.length} Journeys
                </>
              )}
            </Button>
          </div>
        )}

              
        <div className="border-t bg-muted/20 p-4">
          <div className="flex items-start space-x-2">
            <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Hedera Consensus Service (HCS)</p>
              <p className="text-blue-700">
                All journeys are permanently recorded on Hedera for transparency and verification.
                Click the HCS icon to view the consensus record on HashScan.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}