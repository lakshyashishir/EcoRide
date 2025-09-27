'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Store,
  Coffee,
  Utensils,
  ShoppingBag,
  Fuel,
  Gift,
  Star,
  MapPin,
  Clock,
  Coins,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useHedera } from '@/hooks/useHedera';
import { formatTokenAmount } from '@/utils/carbonCalculator';
import { toast } from 'sonner';

interface Merchant {
  id: string;
  name: string;
  category: 'food' | 'retail' | 'transport' | 'services';
  description: string;
  logo: string;
  location: string;
  rating: number;
  totalRedeemed: number;
  offers: MerchantOffer[];
  isPartner: boolean;
  distance?: number;
}

interface MerchantOffer {
  id: string;
  title: string;
  description: string;
  tokenCost: number;
  value: string;
  discount?: number;
  category: string;
  validUntil?: string;
  termsAndConditions?: string;
  maxRedemptions?: number;
  currentRedemptions?: number;
}

interface MerchantInterfaceProps {
  className?: string;
  merchantId?: string;
}

const MOCK_MERCHANTS: Merchant[] = [
  {
    id: 'cafe_green_bean',
    name: 'Green Bean Café',
    category: 'food',
    description: 'Eco-friendly café serving organic coffee and sustainable snacks',
    logo: '☕',
    location: 'Connaught Place, New Delhi',
    rating: 4.5,
    totalRedeemed: 1250,
    isPartner: true,
    distance: 0.8,
    offers: [
      {
        id: 'coffee_10',
        title: '10% off any coffee',
        description: 'Get 10% discount on any coffee beverage',
        tokenCost: 50,
        value: '₹30-50',
        discount: 10,
        category: 'beverage',
        validUntil: '2024-12-31',
        maxRedemptions: 100,
        currentRedemptions: 23,
      },
      {
        id: 'free_pastry',
        title: 'Free pastry with coffee',
        description: 'Complimentary pastry with any coffee purchase',
        tokenCost: 100,
        value: '₹80',
        category: 'food',
        validUntil: '2024-12-31',
        maxRedemptions: 50,
        currentRedemptions: 12,
      },
    ],
  },
  {
    id: 'metro_mart',
    name: 'Metro Mart',
    category: 'retail',
    description: 'Sustainable retail store near metro stations',
    logo: '🛒',
    location: 'Rajiv Chowk Metro Station',
    rating: 4.2,
    totalRedeemed: 890,
    isPartner: true,
    distance: 0.2,
    offers: [
      {
        id: 'eco_products',
        title: '15% off eco-friendly products',
        description: 'Discount on sustainable and eco-friendly items',
        tokenCost: 75,
        value: '₹100-500',
        discount: 15,
        category: 'retail',
        validUntil: '2024-12-31',
        maxRedemptions: 200,
        currentRedemptions: 45,
      },
    ],
  },
  {
    id: 'green_wheels',
    name: 'Green Wheels',
    category: 'transport',
    description: 'Electric bike and scooter sharing service',
    logo: '🚲',
    location: 'Multiple Metro Stations',
    rating: 4.3,
    totalRedeemed: 2100,
    isPartner: true,
    distance: 0.1,
    offers: [
      {
        id: 'free_ride',
        title: 'Free 30-minute ride',
        description: 'Complimentary 30-minute electric bike ride',
        tokenCost: 150,
        value: '₹60',
        category: 'transport',
        validUntil: '2024-12-31',
        maxRedemptions: 75,
        currentRedemptions: 34,
      },
    ],
  },
  {
    id: 'eco_spa',
    name: 'EcoSpa Wellness',
    category: 'services',
    description: 'Sustainable wellness and spa services',
    logo: '🌿',
    location: 'Karol Bagh',
    rating: 4.7,
    totalRedeemed: 650,
    isPartner: true,
    distance: 1.5,
    offers: [
      {
        id: 'spa_discount',
        title: '20% off spa treatments',
        description: 'Discount on all eco-friendly spa treatments',
        tokenCost: 200,
        value: '₹500-2000',
        discount: 20,
        category: 'wellness',
        validUntil: '2024-12-31',
        maxRedemptions: 30,
        currentRedemptions: 8,
      },
    ],
  },
];

export default function MerchantInterface({ className = '', merchantId }: MerchantInterfaceProps) {
  const { totalTokens, redeemTokens, isConnected, isLoading } = useHedera();
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(
    merchantId ? MOCK_MERCHANTS.find(m => m.id === merchantId) || null : null
  );
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);
  const [redeemAmount, setRedeemAmount] = useState<string>('');

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Store className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Connect Wallet to Redeem Tokens
          </h3>
          <p className="text-gray-500 text-center max-w-md">
            Connect your wallet to explore merchant offers and redeem your GREEN tokens for rewards.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleRedeemOffer = async (merchant: Merchant, offer: MerchantOffer) => {
    if (totalTokens < offer.tokenCost) {
      toast.error('Insufficient GREEN tokens for this offer');
      return;
    }

    setIsRedeeming(offer.id);

    try {
      await redeemTokens(offer.tokenCost, merchant.id);
      toast.success(`Successfully redeemed: ${offer.title}`);

      setTimeout(() => {
        toast.info(`Redemption code: RDM${Date.now().toString().slice(-6)}`, {
          description: 'Show this code to the merchant',
          duration: 10000,
        });
      }, 1000);

    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Redemption failed');
    } finally {
      setIsRedeeming(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food':
        return <Utensils className="w-4 h-4" />;
      case 'retail':
        return <ShoppingBag className="w-4 h-4" />;
      case 'transport':
        return <Fuel className="w-4 h-4" />;
      case 'services':
        return <Gift className="w-4 h-4" />;
      default:
        return <Store className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'food':
        return 'bg-orange-100 text-orange-800';
      case 'retail':
        return 'bg-blue-100 text-blue-800';
      case 'transport':
        return 'bg-green-100 text-green-800';
      case 'services':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (selectedMerchant) {
    return (
      <div className={className}>
        <Button
          variant="outline"
          onClick={() => setSelectedMerchant(null)}
          className="mb-4"
        >
          ← Back to Merchants
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="text-4xl">{selectedMerchant.logo}</div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {selectedMerchant.name}
                    {selectedMerchant.isPartner && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Partner
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {selectedMerchant.description}
                  </CardDescription>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {selectedMerchant.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      {selectedMerchant.rating}
                    </div>
                    {selectedMerchant.distance && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {selectedMerchant.distance} km away
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Badge variant="outline" className={getCategoryColor(selectedMerchant.category)}>
                {getCategoryIcon(selectedMerchant.category)}
                <span className="ml-1 capitalize">{selectedMerchant.category}</span>
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Your GREEN Balance</p>
                  <p className="text-lg font-bold text-green-700">
                    {formatTokenAmount(totalTokens)} GREEN
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Redeemed</p>
                  <p className="text-lg font-bold">
                    {formatTokenAmount(selectedMerchant.totalRedeemed)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Available Offers</h3>
                <div className="grid gap-4">
                  {selectedMerchant.offers.map((offer) => (
                    <Card key={offer.id} className="border border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{offer.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {offer.description}
                            </p>

                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-1">
                                <Coins className="w-4 h-4 text-green-600" />
                                <span className="font-bold text-green-700">
                                  {offer.tokenCost} GREEN
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Value: {offer.value}
                              </div>
                              {offer.discount && (
                                <Badge variant="secondary" className="bg-red-100 text-red-800">
                                  {offer.discount}% OFF
                                </Badge>
                              )}
                            </div>

                            {offer.maxRedemptions && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>
                                    {offer.currentRedemptions}/{offer.maxRedemptions} redeemed
                                  </span>
                                  <span>
                                    {Math.round(((offer.currentRedemptions || 0) / offer.maxRedemptions) * 100)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                  <div
                                    className="bg-green-600 h-1.5 rounded-full"
                                    style={{
                                      width: `${Math.min(((offer.currentRedemptions || 0) / offer.maxRedemptions) * 100, 100)}%`
                                    }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="ml-4">
                            <Button
                              onClick={() => handleRedeemOffer(selectedMerchant, offer)}
                              disabled={
                                totalTokens < offer.tokenCost ||
                                isRedeeming === offer.id ||
                                Boolean(offer.maxRedemptions && (offer.currentRedemptions || 0) >= offer.maxRedemptions)
                              }
                              className="gradient-green text-white"
                            >
                              {isRedeeming === offer.id ? (
                                'Redeeming...'
                              ) : totalTokens < offer.tokenCost ? (
                                'Insufficient Tokens'
                              ) : (offer.maxRedemptions && (offer.currentRedemptions || 0) >= offer.maxRedemptions) ? (
                                'Sold Out'
                              ) : (
                                'Redeem'
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5 text-green-600" />
            Partner Merchants
          </CardTitle>
          <CardDescription>
            Redeem your GREEN tokens at eco-friendly partner locations
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_MERCHANTS.map((merchant) => (
              <Card
                key={merchant.id}
                className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-green-300"
                onClick={() => setSelectedMerchant(merchant)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{merchant.logo}</div>
                    <Badge variant="outline" className={getCategoryColor(merchant.category)}>
                      {getCategoryIcon(merchant.category)}
                      <span className="ml-1 capitalize">{merchant.category}</span>
                    </Badge>
                  </div>

                  <h3 className="font-semibold mb-1">{merchant.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {merchant.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{merchant.rating}</span>
                      </div>
                      {merchant.distance && (
                        <span className="text-muted-foreground">{merchant.distance} km</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {merchant.offers.length} offer{merchant.offers.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-green-600 font-medium">
                        from {Math.min(...merchant.offers.map(o => o.tokenCost))} GREEN
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CheckCircle className="w-3 h-3" />
                      {formatTokenAmount(merchant.totalRedeemed)} redeemed
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info Section */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">How Token Redemption Works</p>
                <ul className="text-blue-700 mt-1 space-y-1">
                  <li>• Choose an offer from a partner merchant</li>
                  <li>• Redeem your GREEN tokens for a discount code</li>
                  <li>• Show the code at the merchant location</li>
                  <li>• Enjoy your eco-reward!</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}