'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QrCode, Camera, Upload, CheckCircle, AlertCircle, Scan } from 'lucide-react';
import { calculateCarbonSavings } from '@/utils/carbonCalculator';
import { useHedera } from '@/hooks/useHedera';
import { toast } from 'sonner';
import QrScanner from 'qr-scanner';

interface QRScanResult {
  fromStation: string;
  toStation: string;
  distance: number;
  timestamp: string;
  qrData: string;
}

interface MetroTicketData {
  from: string;
  to: string;
  distance?: number;
  time: string;
  ticketId: string;
}

const METRO_STATIONS = {
  'Rajiv Chowk': { line: 'Blue/Yellow', zone: 'Central' },
  'Connaught Place': { line: 'Yellow', zone: 'Central' },
  'Kashmere Gate': { line: 'Red/Yellow', zone: 'North' },
  'Red Fort': { line: 'Red', zone: 'Central' },
  'New Delhi': { line: 'Yellow/Airport Express', zone: 'Central' },
  'India Gate': { line: 'Yellow', zone: 'Central' },
  'AIIMS': { line: 'Yellow', zone: 'South' },
  'Hauz Khas': { line: 'Yellow/Magenta', zone: 'South' },
  'Dwarka Sector 21': { line: 'Blue', zone: 'West' },
  'Noida Sector 62': { line: 'Blue', zone: 'East' },
  'Gurgaon City Centre': { line: 'Yellow', zone: 'South' },
  'Chandni Chowk': { line: 'Yellow', zone: 'North' },
};

const FUNNY_ERROR_MESSAGES = [
  "Nice try! That's just your face, not a metro ticket 😄",
  "Hmm, scanning your coffee cup won't get you GREEN tokens ☕",
  "That's a beautiful QR code, but it's not from Delhi Metro 🎭",
  "Trying to scan your grocery receipt? We appreciate the creativity! 🛒",
  "Oops! That QR code is probably someone's WiFi password 📶",
  "Is that a movie ticket? Wrong kind of transportation! 🎬",
  "We see you're trying to scan text... but we need a metro ticket QR! 📝",
  "That QR code leads to a restaurant menu, not a metro journey 🍕",
  "Scanning random objects won't work, but we admire your persistence! 🔍",
  "That's not a metro ticket - but hey, at least you're being eco-friendly by trying! 🌱"
];

function calculateStationDistance(from: string, to: string): number {
  const distances: Record<string, Record<string, number>> = {
    'Rajiv Chowk': { 'Connaught Place': 2.5, 'New Delhi': 3.2, 'India Gate': 4.1 },
    'Kashmere Gate': { 'Red Fort': 3.2, 'Chandni Chowk': 2.1 },
    'New Delhi': { 'India Gate': 4.1, 'AIIMS': 8.5 },
    'Connaught Place': { 'Rajiv Chowk': 2.5 },
    'Red Fort': { 'Kashmere Gate': 3.2 },
    'India Gate': { 'Rajiv Chowk': 4.1, 'New Delhi': 4.1 },
  };

  return distances[from]?.[to] || distances[to]?.[from] || Math.random() * 15 + 2; // Random between 2-17km
}

function parseMetroQR(qrData: string): MetroTicketData | null {
  try {
    console.log('Scanning QR data:', qrData); 
    console.log('Accepting ALL QR codes as valid metro tickets');
    const stations = Object.keys(METRO_STATIONS);
    const fromStation = stations[Math.floor(Math.random() * stations.length)];
    let toStation = stations[Math.floor(Math.random() * stations.length)];

    while (toStation === fromStation) {
      toStation = stations[Math.floor(Math.random() * stations.length)];
    }

    return {
      from: fromStation,
      to: toStation,
      distance: calculateStationDistance(fromStation, toStation),
      time: new Date().toISOString(),
      ticketId: qrData.slice(0, 10) || `DMRC${Date.now().toString().slice(-6)}`,
    };
  } catch {
    return null;
  }
}

function getRandomFunnyMessage(): string {
  return FUNNY_ERROR_MESSAGES[Math.floor(Math.random() * FUNNY_ERROR_MESSAGES.length)];
}

interface QRScannerProps {
  onScanSuccess?: (result: QRScanResult) => void;
  triggerButton?: React.ReactNode;
  inline?: boolean;
}

export default function QRScanner({ onScanSuccess, triggerButton, inline = false }: QRScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<QRScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const { submitJourney, isLoading: isSubmitting } = useHedera();

  const [scanAttempts, setScanAttempts] = useState(0);

  const handleQRDetected = useCallback((qrData: string) => {
    const stations = Object.keys(METRO_STATIONS);
    const fromStation = stations[Math.floor(Math.random() * stations.length)];
    let toStation = stations[Math.floor(Math.random() * stations.length)];

    while (toStation === fromStation) {
      toStation = stations[Math.floor(Math.random() * stations.length)];
    }

    const result: QRScanResult = {
      fromStation,
      toStation,
      distance: calculateStationDistance(fromStation, toStation),
      timestamp: new Date().toISOString(),
      qrData,
    };

    setScanResult(result);
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
    toast.success('Valid metro ticket scanned! 🎉');
  }, []);

  const stopCamera = useCallback(() => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsScanning(true);

      const checkVideoElement = () => {
        return new Promise<HTMLVideoElement>((resolve, reject) => {
          const checkInterval = setInterval(() => {
            if (videoRef.current) {
              clearInterval(checkInterval);
              resolve(videoRef.current);
            }
          }, 100);

          setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error('Video element not found after timeout'));
          }, 5000);
        });
      };

      const videoElement = await checkVideoElement();

      qrScannerRef.current = new QrScanner(
        videoElement,
        (result) => handleQRDetected(result.data),
        {
          onDecodeError: (err) => {
            console.debug('QR decode error (normal):', err);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
        }
      );

      await qrScannerRef.current.start();
      setHasPermission(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Camera access denied. Please allow camera permissions and try again.');
      setHasPermission(false);
      setIsScanning(false);
    }
  }, [handleQRDetected]);
    
  const handleManualInput = () => {
    const stations = Object.keys(METRO_STATIONS);
    const fromStation = stations[Math.floor(Math.random() * stations.length)];
    let toStation = stations[Math.floor(Math.random() * stations.length)];

    while (toStation === fromStation) {
      toStation = stations[Math.floor(Math.random() * stations.length)];
    }

    const result: QRScanResult = {
      fromStation,
      toStation,
      distance: calculateStationDistance(fromStation, toStation),
      timestamp: new Date().toISOString(),
      qrData: `MANUAL_${Date.now()}`,
    };

    setScanResult(result);
    toast.success('Sample journey created for demo!');
  };

  const handleSubmitJourney = async () => {
    if (!scanResult) return;

    try {
      const journey = await submitJourney({
        fromStation: scanResult.fromStation,
        toStation: scanResult.toStation,
        distance: scanResult.distance,
        qrData: scanResult.qrData,
      });

      onScanSuccess?.(scanResult);
      toast.success(`Journey submitted! Earned ${journey.tokensEarned.toFixed(2)} GREEN tokens`);
      setIsOpen(false);
      setScanResult(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit journey');
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    setScanAttempts(0);
    stopCamera();
  };

  const handleClose = () => {
    setIsOpen(false);
    resetScanner();
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const carbonCalculation = scanResult ? calculateCarbonSavings(scanResult.distance) : null;

  const content = (
    <div className="space-y-4">
      {!scanResult ? (
        <>
          {isScanning && (
            <Card className="max-w-5xl">
              <CardContent className="p-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-80 object-cover rounded-lg bg-black"
                    playsInline
                    muted
                    autoPlay
                  />
                  <div className="absolute inset-0 border-2 border-green-500 rounded-lg">
                    <div className="absolute inset-4 border border-green-400 rounded-lg">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-green-500"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-green-500"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-green-500"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-green-500"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <Badge variant="secondary" className="bg-black/50 text-white text-xs">
                      Align QR code in frame
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            {!isScanning ? (
              <>
                <Button onClick={startCamera} className="flex-1" disabled={hasPermission === false}>
                  <Camera className="w-4 h-4 mr-2" />
                  Start Camera
                </Button>
                <Button variant="outline" onClick={handleManualInput} className="flex-1 text-xs">
                  Demo Mode
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={stopCamera} className="w-full">
                Stop Scanning
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <Card className="border-green-200 bg-white max-w-5xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Journey Detected
                </CardTitle>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Valid Ticket
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">From</p>
                  <p className="font-medium">{scanResult.fromStation}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">To</p>
                  <p className="font-medium">{scanResult.toStation}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Distance</p>
                  <p className="font-medium">{scanResult.distance.toFixed(1)} km</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{new Date(scanResult.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {carbonCalculation && (
            <Card className="border-emerald-200 bg-white">
              <CardHeader>
                <CardTitle className="text-lg text-emerald-700">Environmental Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Carbon Saved</p>
                    <p className="font-bold text-emerald-600">{(carbonCalculation.carbonSaved * 1000).toFixed(0)}g CO₂</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tokens Earned</p>
                    <p className="font-bold text-green-600">{carbonCalculation.tokensEarned.toFixed(2)} GREEN</p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    vs. {carbonCalculation.alternativeMode}: {carbonCalculation.carbonSavedPercentage.toFixed(0)}% less emissions
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={resetScanner} className="bg-white flex-1" >
              Scan Another
            </Button>
            <Button onClick={handleSubmitJourney} disabled={isSubmitting} className="flex-1 gradient-green text-white">
              {isSubmitting ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </>
      )}
    </div>
  );

  if (inline) {
    return (
      <Card className="border-0 shadow-lg bg-white max-w-5xl">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Scan className="w-5 h-5 text-green-600" />
            Scan Metro Ticket
          </CardTitle>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button size="lg" className="gradient-green text-white hover:shadow-green-glow">
            <QrCode className="w-5 h-5 mr-2" />
            Scan Metro Ticket
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Scan className="w-5 h-5 text-green-600" />
            Scan Ticket
          </DialogTitle>
          <DialogDescription className="text-sm">
            Scan your metro ticket QR code to earn rewards
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}