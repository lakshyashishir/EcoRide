'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gift, MapPin, Clock, Star, Coffee, ShoppingBag, Utensils, Fuel, Award } from 'lucide-react';
import { useHedera } from '@/hooks/useHedera';
import { formatTokenAmount } from '@/utils/carbonCalculator';

interface WebsiteRewardsPageProps {
  onNavigate: (section: string) => void;
}

const partnerStores = [
  {
    name: 'Café Delhi',
    category: 'Coffee & Snacks',
    distance: '200m from Rajiv Chowk Metro',
    discount: '10% off all beverages',
    tokensRequired: 5,
    icon: Coffee,
    rating: 4.5,
    location: 'CP',
    featured: true,
  },
  {
    name: 'Green Grocers',
    category: 'Organic Store',
    distance: '150m from Connaught Place',
    discount: '₹50 off on ₹300',
    tokensRequired: 8,
    icon: ShoppingBag,
    rating: 4.7,
    location: 'CP',
    featured: false,
  },
  {
    name: 'Metro Meals',
    category: 'Restaurant',
    distance: '100m from CP Metro',
    discount: '15% off meals',
    tokensRequired: 12,
    icon: Utensils,
    rating: 4.3,
    location: 'CP',
    featured: true,
  },
  {
    name: 'Eco Fuel Station',
    category: 'CNG/EV Charging',
    distance: '500m from AIIMS Metro',
    discount: '₹20 off fuel',
    tokensRequired: 15,
    icon: Fuel,
    rating: 4.6,
    location: 'South Delhi',
    featured: false,
  },
  {
    name: 'BookWorm Café',
    category: 'Books & Coffee',
    distance: '300m from Kashmere Gate',
    discount: '20% off books',
    tokensRequired: 10,
    icon: Coffee,
    rating: 4.4,
    location: 'North Delhi',
    featured: false,
  },
  {
    name: 'Fresh Mart',
    category: 'Supermarket',
    distance: '250m from Hauz Khas',
    discount: '₹100 off on ₹500',
    tokensRequired: 20,
    icon: ShoppingBag,
    rating: 4.2,
    location: 'South Delhi',
    featured: true,
  },
];

const tierBenefits = [
  { tier: 'Green Starter', required: 0, current: true, color: 'bg-green-500', perks: ['Basic rewards', '5% extra discounts'] },
  { tier: 'Eco Warrior', required: 50, current: false, color: 'bg-emerald-500', perks: ['Premium rewards', '10% extra discounts', 'Monthly bonus tokens'] },
  { tier: 'Carbon Champion', required: 150, current: false, color: 'bg-teal-500', perks: ['Exclusive rewards', '15% extra discounts', 'Priority support'] },
  { tier: 'Planet Protector', required: 300, current: false, color: 'bg-blue-500', perks: ['All rewards unlocked', '20% extra discounts', 'Early access to features'] },
];

export default function WebsiteRewardsPage({ onNavigate }: WebsiteRewardsPageProps) {
  const { totalTokens } = useHedera();

  const featuredStores = partnerStores.filter(store => store.featured);
  const allStores = partnerStores;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">

        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Partner Store Rewards
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover exclusive offers and redeem your GREEN tokens at partner stores near Delhi Metro stations
          </p>
        </div>

        {/* Featured Stores */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
            <Gift className="w-8 h-8 text-chart-3" />
            Featured Offers
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredStores.map((store, index) => {
              const Icon = store.icon;
              const canRedeem = totalTokens >= store.tokensRequired;

              return (
                <Card key={index} className={`shadow-lg hover:shadow-xl transition-all ${canRedeem ? 'border-primary bg-primary/5' : 'border-border opacity-75'} ${store.featured ? 'ring-2 ring-chart-3' : ''}`}>
                  <CardContent className="p-6">
                    {store.featured && (
                      <Badge className="mb-3 bg-chart-3 text-primary-foreground">⭐ Featured</Badge>
                    )}
                    <div className="flex items-start space-x-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${canRedeem ? 'bg-primary/10' : 'bg-secondary'}`}>
                        <Icon className={`w-7 h-7 ${canRedeem ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-lg">{store.name}</h3>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-chart-3 fill-current" />
                            <span className="text-sm text-muted-foreground">{store.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{store.category}</p>
                        <div className="flex items-center space-x-2 mb-4">
                          <MapPin className="w-4 h-4 text-chart-2" />
                          <span className="text-sm text-chart-2">{store.distance}</span>
                        </div>
                        <div className="space-y-3">
                          <Badge variant={canRedeem ? "default" : "secondary"} className="text-sm">
                            {store.discount}
                          </Badge>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {store.tokensRequired} tokens required
                            </span>
                            <Button
                              size="sm"
                              disabled={!canRedeem}
                              className={`${canRedeem ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                            >
                              {canRedeem ? 'Redeem Now' : 'Locked'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* All Partner Stores */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-chart-2" />
              All Partner Stores
            </h2>

            <div className="space-y-4">
              {allStores.map((store, index) => {
                const Icon = store.icon;
                const canRedeem = totalTokens >= store.tokensRequired;

                return (
                  <Card key={index} className={`${canRedeem ? 'border-primary bg-primary/5' : 'border-border opacity-75'} hover:shadow-md transition-all`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${canRedeem ? 'bg-primary/10' : 'bg-secondary'}`}>
                            <Icon className={`w-6 h-6 ${canRedeem ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{store.name}</h3>
                              {store.featured && <Badge variant="secondary" className="text-xs bg-chart-3/10 text-chart-3">Featured</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{store.category} • {store.location}</p>
                            <p className="text-xs text-chart-2">{store.distance}</p>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <Badge variant={canRedeem ? "default" : "secondary"} className="text-xs">
                            {store.discount}
                          </Badge>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">
                              {store.tokensRequired} tokens
                            </span>
                            <Button
                              size="sm"
                              disabled={!canRedeem}
                              className={`text-xs ${canRedeem ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                            >
                              {canRedeem ? 'Redeem' : 'Locked'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tier Benefits */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-chart-4" />
                  Tier Benefits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tierBenefits.map((tier, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${tier.current ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{tier.tier}</h4>
                      {tier.current && <Badge className="text-xs bg-primary text-primary-foreground">Current</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{tier.required} tokens required</p>
                    <div className="space-y-1">
                      {tier.perks.map((perk, i) => (
                        <div key={i} className="flex items-center gap-1 text-xs">
                          <div className="w-1 h-1 bg-primary rounded-full"></div>
                          <span>{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* How to Redeem */}
            <Card className="shadow-lg border-border bg-secondary">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-chart-2 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">How to Redeem</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>1. Visit any partner store near metro stations</p>
                      <p>2. Show your EcoRide app to the cashier</p>
                      <p>3. Select the reward and confirm redemption</p>
                      <p>4. Enjoy your discount!</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        </div>
      </div>
    </div>
  );
}