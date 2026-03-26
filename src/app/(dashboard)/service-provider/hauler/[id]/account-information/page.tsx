'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/primitives/Input';
import { Button } from '@/components/ui/primitives/Button';

export default function HaulerAccountInformationPage() {
  const params = useParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    website: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/hauling-partners/${params.id}/profile`);
        if (res.ok) {
          const data = await res.json();
          setFormData({
            name: data.name || '',
            email: data.email || '',
            phoneNumber: data.phoneNumber || '',
            website: data.website || '',
            description: data.description || '',
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [params.id]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`/api/hauling-partners/${params.id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSaveMessage('Profile updated successfully.');
      } else {
        const data = await res.json();
        setSaveMessage(
          data.error || data.message || 'Failed to update profile.'
        );
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
        Account Information
      </h1>

      <div className="bg-surface-primary rounded-lg p-6 shadow-custom-shadow space-y-6">
        <Input
          type="text"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          label="Company Name"
          fullWidth
        />
        <Input
          type="email"
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          label="Email"
          fullWidth
        />
        <Input
          type="tel"
          value={formData.phoneNumber}
          onChange={e =>
            setFormData({ ...formData, phoneNumber: e.target.value })
          }
          label="Phone Number"
          fullWidth
        />
        <Input
          type="url"
          value={formData.website}
          onChange={e => setFormData({ ...formData, website: e.target.value })}
          label="Website"
          fullWidth
        />

        <div>
          <label className="form-label">Description</label>
          <textarea
            className="input-field w-full h-24"
            value={formData.description}
            onChange={e =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe your hauling services"
          />
        </div>

        <div className="flex justify-end">
          <Button variant="primary" onClick={handleSave} loading={isSaving}>
            Save Changes
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
