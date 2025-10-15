/**
 * @fileoverview Custom React Hooks
 * @source Created for boombox-11.0 hooks system
 * @refactor Custom React hooks exports
 */

// Form input hooks
export { useEmailInput } from './useEmailInput';
export type { EmailValidator, UseEmailInputOptions, UseEmailInputReturn } from './useEmailInput';

// Vehicle management hooks
export { useAddVehicleForm } from './useAddVehicleForm';
export type { 
  VehicleFormData, 
  VehicleFormErrors, 
  VehiclePhotos,
  UseAddVehicleFormOptions,
  UseAddVehicleFormReturn 
} from './useAddVehicleForm';
export { useNameInput } from './useNameInput';
export type { NameValidator, UseNameInputOptions, UseNameInputReturn } from './useNameInput';
export { useRoutingNumberInput } from './useRoutingNumberInput';
export type { RoutingNumberValidator, UseRoutingNumberInputOptions, UseRoutingNumberInputReturn } from './useRoutingNumberInput';
export { useSendQuoteEmail } from './useSendQuoteEmail';
export type { UseSendQuoteEmailOptions, UseSendQuoteEmailReturn } from './useSendQuoteEmail';

// Vehicle management hooks
export { useVehicle } from './useVehicle';

// File upload hooks
export { usePhotoUpload } from './usePhotoUpload';
export type { UsePhotoUploadOptions, UsePhotoUploadReturn, UploadState } from './usePhotoUpload';

// Profile picture management hooks
export { useProfilePicture } from './useProfilePicture';
export type { UseProfilePictureOptions, UseProfilePictureReturn } from './useProfilePicture';

// Service provider data hooks
export { useServiceProviderData } from './useServiceProviderData';
export type { ServiceProviderDisplayData } from '@/lib/services/serviceProviderDataService';
export { useAccountSetupChecklist } from './useAccountSetupChecklist';
export { useContactInfo } from './useContactInfo';

// Storage unit hooks
export { useStorageUnitAvailability } from './useStorageUnitAvailability';
export type { UseStorageUnitAvailabilityReturn } from './useStorageUnitAvailability';

// Third-party moving partner hooks
export { useThirdPartyMovingPartners } from './useThirdPartyMovingPartners';
export type { default as UseThirdPartyMovingPartnersReturn } from './useThirdPartyMovingPartners';

// Quote management hooks
export { useQuote } from './useQuote';

// Labor and moving partner hooks
export { useMovingPartners } from './useMovingPartners';
export { useLaborSelection } from './useLaborSelection';

// Access Storage form hooks
export { useAccessStorageForm } from './useAccessStorageForm';
export { useAccessStorageNavigation } from './useAccessStorageNavigation';
export { useStorageUnits } from './useStorageUnits';
export { useFormPersistence } from './useFormPersistence';

// Tracking hooks
export { useTrackingData } from './useTrackingData';
export type { UseTrackingDataReturn, AppointmentTrackingProps, DeliveryUnit, TrackingStep, TimerData } from './useTrackingData';
export { useExpandableHeight } from './useExpandableHeight';
export type { UseExpandableHeightReturn } from './useExpandableHeight';

// Content hooks
export { useBlogPagination } from './useBlogPagination';
export type { UseBlogPaginationParams, UseBlogPaginationReturn } from './useBlogPagination';
export { useBlogCategories } from './useBlogCategories';
export type { UseBlogCategoriesParams, UseBlogCategoriesReturn } from './useBlogCategories';
export { usePopularArticlesPagination } from './usePopularArticlesPagination';
export type { UsePopularArticlesPaginationParams, UsePopularArticlesPaginationReturn } from './usePopularArticlesPagination';

// Responsive Grid Pagination
export { useResponsiveGridPagination, DEFAULT_CITY_GRID_BREAKPOINTS } from './useResponsiveGridPagination';
export type { 
  ResponsiveBreakpoint, 
  ResponsiveGridPaginationConfig, 
  UseResponsiveGridPaginationReturn 
} from './useResponsiveGridPagination';
export { useChecklist } from './useChecklist';
export type { ChecklistItem, UseChecklistOptions, UseChecklistReturn } from './useChecklist';

// Database-driven blog hooks
export { 
  useBlogData, 
  useBlogCategories as useBlogCategoriesData, 
  usePopularArticles, 
  useFeaturedArticles, 
  useRecentArticles 
} from './useBlogData';

// UI interaction hooks
export { useClickOutside } from './useClickOutside';
export { useHorizontalScroll } from './useHorizontalScroll';
export type { UseHorizontalScrollOptions, UseHorizontalScrollReturn } from './useHorizontalScroll';

// Feedback hooks
export { useFeedbackForm } from './useFeedbackForm';
export type { UseFeedbackFormOptions, UseFeedbackFormReturn, SubmissionResponse } from './useFeedbackForm';

// GetQuote flow hooks (TASK_005 completed)
export { useGetQuoteForm } from './useGetQuoteForm';
export { useStorageUnitSelection } from './useStorageUnitSelection';
export { useScheduling } from './useScheduling';
export { usePhoneVerification } from './usePhoneVerification';
export { useQuoteSubmission } from './useQuoteSubmission';

// Authentication hooks
export { useLogin } from './useLogin';
export type { 
  LoginAccount, 
  LoginFormData, 
  LoginErrors, 
  UseLoginReturn 
} from './useLogin';

export { useAdminLogin } from './useAdminLogin';
export type {
  AdminLoginFormData,
  AdminLoginErrors,
  UseAdminLoginReturn
} from './useAdminLogin';

// Admin table management hooks
export { useAdminTable } from './useAdminTable';
export { useAdminDataFetch } from './useAdminDataFetch';

// Admin task management hooks
export { useTask } from './useTask';
export type { Task } from './useTask';

// Note: Additional custom hooks will be added here as they are created
// Examples: useAuth, useBooking, useOnfleet, etc.
