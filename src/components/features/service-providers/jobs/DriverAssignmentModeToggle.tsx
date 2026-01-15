/**
 * @fileoverview Toggle component for switching between manual and automatic driver assignment modes
 * Used by moving partners to control how drivers are assigned to new jobs.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { Modal } from '@/components/ui/primitives/Modal';
import { Button } from '@/components/ui/primitives/Button';

interface DriverAssignmentModeToggleProps {
  userId: string;
}

export function DriverAssignmentModeToggle({ userId }: DriverAssignmentModeToggleProps) {
  const [driverAssignmentMode, setDriverAssignmentMode] = useState<'MANUAL' | 'AUTO'>('MANUAL');
  const [isLoadingAssignmentMode, setIsLoadingAssignmentMode] = useState(false);
  const [isUpdatingAssignmentMode, setIsUpdatingAssignmentMode] = useState(false);
  const [isAssignmentInfoModalOpen, setIsAssignmentInfoModalOpen] = useState(false);

  // Fetch driver assignment mode on mount
  useEffect(() => {
    const fetchDriverAssignmentMode = async () => {
      if (!userId) return;
      
      setIsLoadingAssignmentMode(true);
      try {
        const response = await fetch(`/api/moving-partners/${userId}/driver-assignment-mode`);
        if (response.ok) {
          const data = await response.json();
          setDriverAssignmentMode(data.mode);
        }
      } catch (error) {
        console.error('Error fetching driver assignment mode:', error);
      } finally {
        setIsLoadingAssignmentMode(false);
      }
    };

    fetchDriverAssignmentMode();
  }, [userId]);

  // Update driver assignment mode
  const updateDriverAssignmentMode = async (newMode: 'MANUAL' | 'AUTO') => {
    if (!userId) return;
    
    setIsUpdatingAssignmentMode(true);
    try {
      const response = await fetch(`/api/moving-partners/${userId}/driver-assignment-mode`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      });
      
      if (response.ok) {
        setDriverAssignmentMode(newMode);
      } else {
        console.error('Failed to update driver assignment mode');
      }
    } catch (error) {
      console.error('Error updating driver assignment mode:', error);
    } finally {
      setIsUpdatingAssignmentMode(false);
    }
  };

  return (
    <>
      <div className="flex items-center">
        
        <span className="text-sm text-text-primary block font-medium mr-2">Assign Drivers</span>
        <div 
          className={`relative flex items-center bg-surface-secondary rounded-full p-1 ${
            isLoadingAssignmentMode || isUpdatingAssignmentMode ? 'opacity-80' : ''
          }`}
          role="radiogroup"
          aria-label="Driver assignment mode"
        >
          <button
            onClick={() => updateDriverAssignmentMode('MANUAL')}
            disabled={isLoadingAssignmentMode || isUpdatingAssignmentMode}
            className={`px-4 py-1.5 rounded-full text-sm ${
              driverAssignmentMode === 'MANUAL'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-secondary'
            }`}
            role="radio"
            aria-checked={driverAssignmentMode === 'MANUAL'}
            aria-label="Manual driver assignment"
          >
            Manual
          </button>
          <button
            onClick={() => updateDriverAssignmentMode('AUTO')}
            disabled={isLoadingAssignmentMode || isUpdatingAssignmentMode}
            className={`px-4 py-1.5 rounded-full text-sm ${
              driverAssignmentMode === 'AUTO'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-secondary'
            }`}
            role="radio"
            aria-checked={driverAssignmentMode === 'AUTO'}
            aria-label="Automatic driver assignment"
          >
            Auto
          </button>
        </div>
        <button
            onClick={() => setIsAssignmentInfoModalOpen(true)}
            className="text-text-primary ml-2"
            aria-label="Learn more about driver assignment modes"
          >
          <InformationCircleIcon className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Driver Assignment Info Modal */}
      <Modal
        open={isAssignmentInfoModalOpen}
        onClose={() => setIsAssignmentInfoModalOpen(false)}
        title="Driver Assignment Modes"
        size="md"
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-base font-medium text-text-primary">Manual</h3>
            <p className="text-sm text-text-tertiary">
              When a new job is booked, you will be notified via SMS and in-app notification. 
              You must manually assign a driver to each job through your Jobs page. 
              This gives you full control over which driver handles each appointment.
            </p>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-base font-medium text-text-primary">Auto</h3>
            <p className="text-sm text-text-tertiary">
              Boombox will automatically assign the next available driver from your team when a new job is booked. 
              Driver assignment is based on availability and existing schedule. 
              Both you and the assigned driver will be notified when a job is booked.
            </p>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              onClick={() => setIsAssignmentInfoModalOpen(false)}
              variant="primary"
            >
              Got it
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
