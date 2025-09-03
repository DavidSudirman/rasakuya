import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Sparkles } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export const PricingPlans: React.FC = () => {
  const { t, language } = useLanguage();

  const plans = [
    {
      name: t('pricing.free.name'),
      price: t('pricing.free.price'),
      popular: false,
      features: [
        t('pricing.free.feature1'),
        t('pricing.free.feature2'),
        t('pricing.free.feature3'),
        t('pricing.free.feature4')
      ],
      buttonText: t('pricing.free.button'),
      buttonVariant: 'outline' as const
    },
    {
      name: t('pricing.premium.name'),
      price: language === 'id' ? 'Rp 40.000/bulan' : '$2.44/month',
      popular: true,
      features: [
        t('pricing.premium.feature1'),
        t('pricing.premium.feature2'),
        t('pricing.premium.feature3')
      ],
      buttonText: t('pricing.premium.button'),
      buttonVariant: 'default' as const
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">{t('pricing.title')}</h2>
        <p className="text-muted-foreground">{t('pricing.subtitle')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {plans.map((plan, index) => (
          <Card key={index} className={`relative p-6 ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                <Star className="h-3 w-3 mr-1" />
                {t('pricing.popular')}
              </Badge>
            )}
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold text-primary mb-2">{plan.price}</div>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              variant={plan.buttonVariant} 
              className="w-full"
              onClick={() => {
                // TODO: Implement payment logic
                console.log(`Selected ${plan.name} plan`);
              }}
            >
              {plan.popular && <Sparkles className="h-4 w-4 mr-2" />}
              {plan.buttonText}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};