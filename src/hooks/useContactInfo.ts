/**
 * @fileoverview Custom hook for managing contact information state and interactions
 * @source boombox-10.0/src/app/components/mover-account/contacttable.tsx (state and handler logic)
 * @refactor Extracted contact info state management and API interactions into reusable hook
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ContactInfo,
  MovingPartnerStatus,
  getContactInfo,
  getMovingPartnerStatus,
  updateContactInfoField,
  buildActivationMessage,
} from '@/lib/services/contactInfoService';
import { formatPhoneNumberForDisplay } from '@/lib/utils/phoneUtils';
import { isValidEmail } from '@/lib/utils/validationUtils';

interface UseContactInfoParams {
  userId: string;
  userType: 'driver' | 'mover';
}

interface UseContactInfoReturn {
  contactInfo: ContactInfo | null;
  movingPartnerStatus: MovingPartnerStatus | null;
  isLoading: boolean;
  error: string | null;
  editField: keyof ContactInfo | null;
  editedInfo: Partial<ContactInfo>;
  localHasError: boolean;
  errorMessage: string | null;
  isEditingServices: boolean;
  selectedServices: string[];
  availableServices: string[];
  activationMessage: string;
  handleEdit: (field: keyof ContactInfo) => void;
  handleSave: () => Promise<void>;
  handleCancel: () => void;
  handleChange: (field: keyof ContactInfo, value: string) => void;
  handleFocus: () => void;
  isEditable: (field: keyof ContactInfo) => boolean;
  isGrayedOut: (field: keyof ContactInfo) => boolean;
  handleServiceToggle: (service: string) => void;
  handleSaveServices: () => Promise<void>;
  setIsEditingServices: (value: boolean) => void;
  setSelectedServices: (services: string[]) => void;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing contact information
 */
export function useContactInfo({
  userId,
  userType,
}: UseContactInfoParams): UseContactInfoReturn {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [movingPartnerStatus, setMovingPartnerStatus] =
    useState<MovingPartnerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editField, setEditField] = useState<keyof ContactInfo | null>(null);
  const [editedInfo, setEditedInfo] = useState<Partial<ContactInfo>>({});
  const [localHasError, setLocalHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableServices] = useState<string[]>([
    'Storage Unit Delivery',
    'Packing Supply Delivery',
  ]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isEditingServices, setIsEditingServices] = useState(false);

  // Fetch contact info data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch contact info
      const contactData = await getContactInfo(userId, userType);
      setContactInfo(contactData);
      if (contactData.services) {
        setSelectedServices(contactData.services);
      }

      // Fetch moving partner status if user is a driver
      if (userType === 'driver') {
        const partnerData = await getMovingPartnerStatus(userId);
        setMovingPartnerStatus(partnerData);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [userId, userType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build activation message
  const activationMessage = buildActivationMessage(contactInfo, userType);

  // Handle edit field
  const handleEdit = useCallback(
    (field: keyof ContactInfo) => {
      setEditField(field);

      if (field === 'firstName' || field === 'lastName') {
        setEditedInfo({
          firstName: contactInfo?.firstName || '',
          lastName: contactInfo?.lastName || '',
        });
      } else if (field === 'description') {
        setEditedInfo({ [field]: contactInfo?.[field] || '' });
      } else {
        setEditedInfo({ [field]: contactInfo?.[field] });
      }
      setErrorMessage(null);
      setLocalHasError(false);
    },
    [contactInfo]
  );

  // Validate and save
  const handleSave = useCallback(async () => {
    if (!editField) {
      setErrorMessage('No field selected for editing.');
      setLocalHasError(true);
      return;
    }

    // Validation
    switch (editField) {
      case 'phoneNumber': {
        const phoneNumberDigits =
          editedInfo.phoneNumber?.replace(/\D/g, '') || '';
        if (phoneNumberDigits.length !== 10) {
          setErrorMessage('Phone number must be 10 digits.');
          setLocalHasError(true);
          return;
        }
        break;
      }
      case 'email':
        if (!isValidEmail(editedInfo.email || '')) {
          setErrorMessage('Please enter a valid email address.');
          setLocalHasError(true);
          return;
        }
        break;
      case 'firstName':
      case 'lastName':
        if (!editedInfo.firstName || !editedInfo.lastName) {
          setErrorMessage('Both first name and last name are required.');
          setLocalHasError(true);
          return;
        }
        break;
      case 'name':
        if (!editedInfo.name) {
          setErrorMessage('Company name is required.');
          setLocalHasError(true);
          return;
        }
        break;
      case 'hourlyRate': {
        const rate = Number(editedInfo.hourlyRate);
        if (isNaN(rate) || rate <= 0) {
          setErrorMessage('Please enter a valid hourly rate.');
          setLocalHasError(true);
          return;
        }
        break;
      }
      default:
        break;
    }

    try {
      // API call to update field
      const apiRoute =
        userType === 'driver'
          ? `/api/drivers/${userId}/profile`
          : `/api/moving-partners/${userId}/profile`;

      const response = await fetch(apiRoute, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [editField]: editedInfo[editField] }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update contact info');
      }

      const updatedData = await response.json();
      setContactInfo((prev) =>
        prev
          ? { ...prev, ...updatedData, verifiedPhoneNumber: false }
          : prev
      );
      setEditField(null);
      setLocalHasError(false);
      setErrorMessage(null);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
      setLocalHasError(true);
    }
  }, [editField, editedInfo, userId, userType]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setEditedInfo({});
    setEditField(null);
    setLocalHasError(false);
    setErrorMessage(null);
  }, []);

  // Handle focus
  const handleFocus = useCallback(() => {
    setLocalHasError(false);
  }, []);

  // Handle field change
  const handleChange = useCallback((field: keyof ContactInfo, value: string) => {
    if (field === 'phoneNumber') {
      setEditedInfo((prev) => ({
        ...prev,
        phoneNumber: formatPhoneNumberForDisplay(value),
      }));
    } else {
      setEditedInfo((prev) => ({ ...prev, [field]: value }));
    }
  }, []);

  // Check if field is editable
  const isEditable = useCallback(
    (field: keyof ContactInfo) => {
      return editField === field;
    },
    [editField]
  );

  // Check if field is grayed out
  const isGrayedOut = useCallback(
    (field: keyof ContactInfo) => {
      return editField !== null && editField !== field;
    },
    [editField]
  );

  // Handle service toggle
  const handleServiceToggle = useCallback((service: string) => {
    setSelectedServices((prev) => {
      if (prev.includes(service)) {
        return prev.filter((s) => s !== service);
      } else {
        return [...prev, service];
      }
    });
  }, []);

  // Handle save services
  const handleSaveServices = useCallback(async () => {
    try {
      // Use specific services endpoint for drivers to handle Onfleet sync
      const apiRoute =
        userType === 'driver'
          ? `/api/drivers/${userId}/services`
          : `/api/moving-partners/${userId}/profile`;

      const response = await fetch(apiRoute, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: selectedServices }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update services');
      }

      const updatedData = await response.json();

      // Handle different response structures
      const driverData = updatedData.driver || updatedData;
      setContactInfo((prev) => (prev ? { ...prev, ...driverData } : prev));
      setIsEditingServices(false);
      setErrorMessage(null);
      setLocalHasError(false);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
      setLocalHasError(true);
    }
  }, [selectedServices, userId, userType]);

  return {
    contactInfo,
    movingPartnerStatus,
    isLoading,
    error,
    editField,
    editedInfo,
    localHasError,
    errorMessage,
    isEditingServices,
    selectedServices,
    availableServices,
    activationMessage,
    handleEdit,
    handleSave,
    handleCancel,
    handleChange,
    handleFocus,
    isEditable,
    isGrayedOut,
    handleServiceToggle,
    handleSaveServices,
    setIsEditingServices,
    setSelectedServices,
    refetch: fetchData,
  };
}

