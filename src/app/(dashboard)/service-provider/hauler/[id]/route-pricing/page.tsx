'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/primitives/Input';
import { Button } from '@/components/ui/primitives/Button';

export default function RoutePricingPage() {
  const params = useParams();
  const [priceSsfToStockton, setPriceSsfToStockton] = useState('');
  const [priceStocktonToSsf, setPriceStocktonToSsf] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPricing() {
      try {
        const res = await fetch(
          `/api/hauling-partners/${params.id}/route-pricing`
        );
        if (res.ok) {
          const data = await res.json();
          setPriceSsfToStockton(data.priceSsfToStockton?.toString() || '');
          setPriceStocktonToSsf(data.priceStocktonToSsf?.toString() || '');
        }
      } catch (err) {
        console.error('Error fetching pricing:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPricing();
  }, [params.id]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch(
        `/api/hauling-partners/${params.id}/route-pricing`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            priceSsfToStockton: priceSsfToStockton
              ? parseFloat(priceSsfToStockton)
              : null,
            priceStocktonToSsf: priceStocktonToSsf
              ? parseFloat(priceStocktonToSsf)
              : null,
          }),
        }
      );

      if (res.ok) {
        setSaveMessage('Pricing updated successfully.');
      } else {
        setSaveMessage('Failed to update pricing.');
      }
    } catch {
      setSaveMessage('An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-tertiary rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-text-primary mb-6">
        Route Pricing
      </h1>

      <div className="bg-surface-primary rounded-lg p-6 shadow-custom-shadow space-y-6">
        <div>
          <Input
            type="number"
            value={priceSsfToStockton}
            onChange={e => setPriceSsfToStockton(e.target.value)}
            label="South San Francisco → Stockton (per trip)"
            placeholder="Enter price"
            fullWidth
            aria-label="Price SSF to Stockton"
          />
        </div>

        <div>
          <Input
            type="number"
            value={priceStocktonToSsf}
            onChange={e => setPriceStocktonToSsf(e.target.value)}
            label="Stockton → South San Francisco (per trip)"
            placeholder="Enter price"
            fullWidth
            aria-label="Price Stockton to SSF"
          />
        </div>

        <div className="flex justify-end">
          <Button variant="primary" onClick={handleSave} loading={isSaving}>
            Save Pricing
          </Button>
        </div>

        {saveMessage && (
          <p
            className={`text-sm ${saveMessage.includes('success') ? 'text-green-600' : 'text-status-error'}`}
          >
            {saveMessage}
          </p>
        )}
      </div>
    </div>
  );
}
