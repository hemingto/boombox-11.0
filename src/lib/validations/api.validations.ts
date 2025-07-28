/**
 * @fileoverview Comprehensive Zod validation schemas for all API endpoints
 * @source boombox-10.0/src/app/api (analyzed all route patterns)
 * @refactor Created centralized validation system with domain-based organization
 */

import { z } from 'zod';

// ===== COMMON VALIDATION PATTERNS =====

const emailSchema = z.string().email('Invalid email format');
const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format');
const zipCodeSchema = z
  .string()
  .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format');
const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');
const timeStringSchema = z
  .string()
  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format');
const positiveIntSchema = z.number().int().positive();
const nonNegativeIntSchema = z.number().int().min(0);

// Onfleet-specific validations
const onfleetTeamIdSchema = z.string().min(1, 'Onfleet Team ID is required');
const appointmentTypeSchema = z.enum([
  'Storage Unit Access',
  'End Storage Term',
  'Additional Storage',
  'Initial Storage',
  'Mobile Storage'
]);

// ===== CORE API RESPONSE SCHEMAS =====

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
  field: z.string().optional(),
});

export const ApiSuccessSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
});

export const ApiResponseSchema = z.union([
  ApiSuccessSchema,
  ApiErrorSchema,
]);

export const PaginationRequestSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(25),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const PaginationResponseSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

// ===== AUTHENTICATION DOMAIN SCHEMAS =====

export const LoginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

export const LoginResponseSchema = z.object({
  success: z.boolean(),
  user: z.object({
    id: z.number(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.string(),
  }),
  sessionToken: z.string(),
});

export const SignupRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: phoneSchema,
  role: z.enum(['customer', 'driver', 'mover']).optional(),
});

// ===== DRIVER ASSIGNMENT DOMAIN SCHEMAS =====

export const DriverAssignmentRequestSchema = z.object({
  appointmentId: z.number().int().positive('Appointment ID must be a positive integer'),
  onfleetTaskId: z.string().optional(),
  driverId: z.number().int().positive().optional(),
  action: z.enum(['assign', 'accept', 'decline', 'retry', 'cancel', 'reconfirm']).default('assign'),
});

export const DriverAssignmentResponseSchema = z.object({
  message: z.string(),
  appointmentId: z.number(),
  unitNumber: z.number().optional(),
  unitResults: z.array(z.object({
    unitNumber: z.number(),
    status: z.string(),
    message: z.string().optional(),
    driverId: z.number().optional(),
    movingPartnerId: z.number().optional(),
  })).optional(),
  driverId: z.number().optional(),
  tasksAssigned: z.array(z.number()).optional(),
  tasksReconfirmed: z.array(z.number()).optional(),
  tasksReassigned: z.number().optional(),
  nextDriverId: z.number().optional(),
});

export const SignupResponseSchema = z.object({
  success: z.boolean(),
  userId: positiveIntSchema,
  message: z.string(),
});

export const VerifyCodeRequestSchema = z.object({
  email: emailSchema,
  code: z.string().length(6, 'Verification code must be 6 digits'),
  type: z.enum(['email_verification', 'phone_verification', 'password_reset']),
});

export const SendCodeResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const ForgotPasswordRequestSchema = z.object({
  email: emailSchema,
});

export const ResetPasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// ===== PAYMENT DOMAIN SCHEMAS =====

export const CreateStripeCustomerRequestSchema = z.object({
  email: emailSchema,
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: phoneSchema,
  address: z.string().min(1, 'Address is required'),
  zipCode: zipCodeSchema,
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
});

export const StripeCustomerResponseSchema = z.object({
  success: z.boolean(),
  customerId: z.string(),
});

export const CreatePaymentIntentRequestSchema = z.object({
  amount: positiveIntSchema,
  currency: z.string().length(3).default('usd'),
  customerId: z.string().min(1, 'Customer ID is required'),
  appointmentId: positiveIntSchema.optional(),
  orderId: positiveIntSchema.optional(),
  description: z.string().optional(),
});

export const PaymentIntentResponseSchema = z.object({
  success: z.boolean(),
  clientSecret: z.string(),
  paymentIntentId: z.string(),
});

export const StripeWebhookEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  created: z.number(),
  data: z.object({
    object: z.any(),
  }),
  livemode: z.boolean(),
});

export const PaymentHistoryRequestSchema = z
  .object({
    customerId: z.string().min(1, 'Customer ID is required'),
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
  })
  .merge(PaginationRequestSchema);

export const PaymentHistoryResponseSchema = z.object({
  success: z.boolean(),
  payments: z.array(
    z.object({
      id: z.string(),
      amount: z.number(),
      currency: z.string(),
      status: z.string(),
      created: z.number(),
      description: z.string().optional(),
    })
  ),
  pagination: PaginationResponseSchema,
});

// ===== ORDERS DOMAIN SCHEMAS =====

export const CreateAppointmentRequestSchema = z.object({
  customerId: positiveIntSchema,
  appointmentType: z.enum([
    'Initial Pickup',
    'Storage Unit Access',
    'End Storage Term',
    'Additional Storage',
  ]),
  date: dateStringSchema,
  time: timeStringSchema,
  address: z.string().min(1, 'Address is required'),
  zipCode: zipCodeSchema,
  phoneNumber: phoneSchema,
  specialInstructions: z.string().optional(),
  storageUnitIds: z.array(positiveIntSchema).optional(),
  additionalUnitsOnly: z.boolean().optional(),
});

export const CreateStorageAccessAppointmentRequestSchema = z.object({
  userId: z.string().or(positiveIntSchema),
  address: z.string().min(1, 'Address is required'),
  zipCode: zipCodeSchema,
  planType: z.string().optional(),
  appointmentDateTime: z.string().min(1, 'Appointment date and time is required'),
  deliveryReason: z.string().optional(),
  selectedStorageUnits: z.array(z.string().or(positiveIntSchema)),
  description: z.string().optional(),
  appointmentType: z.string().min(1, 'Appointment type is required'),
  parsedLoadingHelpPrice: nonNegativeIntSchema.optional(),
  monthlyStorageRate: nonNegativeIntSchema.optional(),
  monthlyInsuranceRate: nonNegativeIntSchema.optional(),
  calculatedTotal: nonNegativeIntSchema.optional(),
  movingPartnerId: z.string().or(positiveIntSchema).optional(),
  thirdPartyMovingPartnerId: z.string().or(positiveIntSchema).optional(),
});

export const CreateAdditionalStorageAppointmentRequestSchema = z.object({
  userId: z.string().or(positiveIntSchema),
  address: z.string().min(1, 'Address is required'),
  zipCode: zipCodeSchema,
  storageUnitCount: nonNegativeIntSchema.optional(),
  selectedInsurance: z.object({
    label: z.string()
  }).optional(),
  appointmentDateTime: z.string().min(1, 'Appointment date and time is required'),
  planType: z.string().optional(),
  parsedLoadingHelpPrice: nonNegativeIntSchema.optional(),
  monthlyStorageRate: nonNegativeIntSchema.optional(),
  monthlyInsuranceRate: nonNegativeIntSchema.optional(),
  calculatedTotal: nonNegativeIntSchema.optional(),
  appointmentType: z.string().min(1, 'Appointment type is required'),
  movingPartnerId: z.string().or(positiveIntSchema).optional(),
  description: z.string().optional(),
  thirdPartyMovingPartnerId: z.string().or(positiveIntSchema).optional(),
});

export const AppointmentResponseSchema = z.object({
  success: z.boolean(),
  appointmentId: positiveIntSchema,
  jobCode: z.string(),
  scheduledDate: z.string(),
  estimatedArrival: z.string().optional(),
});

export const GetDriverByUnitRequestSchema = z.object({
  appointmentId: z.string().or(positiveIntSchema),
  unitNumber: z.string().or(positiveIntSchema).optional().default(1),
});

export const GetDriverByUnitResponseSchema = z.object({
  driver: z.object({
    firstName: z.string(),
    lastName: z.string(),
    phoneNumber: z.string().nullable(),
    driverLicenseFrontPhoto: z.string().nullable(),
    profilePicture: z.string().nullable(),
  }).nullable(),
});

export const GetDriverJobDetailsRequestSchema = z.object({
  appointmentId: z.string().or(positiveIntSchema),
});

export const GetDriverJobDetailsResponseSchema = z.object({
  id: positiveIntSchema,
  date: z.date(),
  time: z.date(),
  address: z.string(),
  zipcode: z.string().nullable(),
  status: z.string(),
  appointmentType: z.string(),
  numberOfUnits: nonNegativeIntSchema,
  planType: z.string().nullable(),
  totalEstimatedCost: z.number().nullable(),
  customer: z.object({
    name: z.string(),
    phone: z.string(),
  }),
  onfleetTasks: z.array(z.object({
    id: positiveIntSchema,
    taskId: z.string().nullable(),
    shortId: z.string().nullable(),
    stepNumber: nonNegativeIntSchema.nullable(),
    unitNumber: nonNegativeIntSchema,
    driverId: positiveIntSchema.nullable(),
    driverNotificationStatus: z.string().nullable(),
  })),
});

export const CancelAppointmentRequestSchema = z.object({
  appointmentId: z.string().or(positiveIntSchema),
  cancellationReason: z.string().optional(),
  userType: z.enum(['driver', 'mover']),
  userId: z.string().or(positiveIntSchema),
});

export const CancelAppointmentResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export const CustomerCancelAppointmentRequestSchema = z.object({
  appointmentId: z.string().or(positiveIntSchema),
  cancellationReason: z.string().min(1, 'Cancellation reason is required'),
  userId: z.string().or(positiveIntSchema),
});

export const CustomerCancelAppointmentResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  cancellationFee: z.number().optional(),
  refundAmount: z.number().optional(),
});

export const UpdateAppointmentRequestSchema = z.object({
  userId: z.string().or(positiveIntSchema),
  address: z.string().min(1, 'Address is required'),
  zipCode: zipCodeSchema,
  appointmentDateTime: z.string().min(1, 'Appointment date and time is required'),
  planType: z.enum([
    'Do It Yourself Plan',
    'Full Service Plan', 
    'Third Party Loading Help'
  ]),
  deliveryReason: z.string().optional(),
  selectedStorageUnits: z.array(z.number().int()).optional(),
  storageUnitCount: nonNegativeIntSchema.optional(),
  description: z.string().optional(),
  appointmentType: z.enum([
    'Initial Pickup',
    'Additional Storage',
    'Storage Unit Access',
    'End Storage Term'
  ]),
  loadingHelpPrice: z.string().optional(),
  parsedLoadingHelpPrice: nonNegativeIntSchema.optional(),
  monthlyStorageRate: nonNegativeIntSchema.optional(),
  monthlyInsuranceRate: nonNegativeIntSchema.optional(),
  calculatedTotal: nonNegativeIntSchema.optional(),
  movingPartnerId: z.number().int().nullable(),
  thirdPartyMovingPartnerId: z.number().int().nullable(),
  selectedLabor: z.object({
    id: z.string(),
    price: z.string(),
    title: z.string(),
    onfleetTeamId: z.string().optional(),
  }).optional(),
  status: z.string().optional().default('Scheduled'),
  stripeCustomerId: z.string().optional(),
  additionalUnitsCount: nonNegativeIntSchema.optional(),
  selectedInsurance: z.object({
    label: z.string()
  }).optional(),
});

export const UpdateAppointmentResponseSchema = z.object({
  success: z.boolean(),
  appointment: z.any(),
  newUnitsAdded: z.boolean().optional(),
  newUnitCount: nonNegativeIntSchema.optional(),
  changes: z.object({
    planChanged: z.boolean(),
    timeChanged: z.boolean(),
    unitsAdded: z.array(z.number()),
    unitsRemoved: z.array(z.number()),
    movingPartnerChanged: z.boolean(),
    driverReassignmentRequired: z.boolean(),
  }).optional(),
});

export const CreatePackingSupplyOrderRequestSchema = z.object({
  customerId: positiveIntSchema,
  items: z
    .array(
      z.object({
        itemId: positiveIntSchema,
        quantity: positiveIntSchema,
      })
    )
    .min(1, 'At least one item is required'),
  deliveryAddress: z.string().min(1, 'Delivery address is required'),
  deliveryZipCode: zipCodeSchema,
  deliveryDate: dateStringSchema,
  deliveryTimeWindow: z.string().min(1, 'Delivery time window is required'),
  specialInstructions: z.string().optional(),
});

export const PackingSupplyOrderResponseSchema = z.object({
  success: z.boolean(),
  orderId: positiveIntSchema,
  totalAmount: z.number(),
  estimatedDelivery: z.string(),
  trackingNumber: z.string(),
});

export const SendQuoteEmailRequestSchema = z.object({
  email: emailSchema,
  address: z.string().min(1, 'Address is required'),
  scheduledDate: z.string().min(1, 'Scheduled date is required'),
  scheduledTimeSlot: z.string().min(1, 'Scheduled time slot is required'),
  storageUnitCount: z.number().int().min(0).optional(),
  storageUnitText: z.string().optional(),
  selectedPlanName: z.string().min(1, 'Plan name is required'),
  loadingHelpPrice: z.string().min(1, 'Loading help price is required'),
  loadingHelpDescription: z.string().min(1, 'Loading help description is required'),
  selectedInsurance: z.object({
    label: z.string().min(1, 'Insurance label is required'),
    price: z.string().min(1, 'Insurance price is required'),
  }).optional(),
  accessStorageUnitCount: z.number().int().min(0).optional(),
  totalPrice: z.number().min(0, 'Total price must be non-negative'),
  isAccessStorage: z.boolean(),
  zipCode: zipCodeSchema,
});

// ===== ONFLEET DOMAIN SCHEMAS =====

export const CreateOnfleetTaskRequestSchema = z.object({
  appointmentId: positiveIntSchema,
  destination: z.object({
    address: z.string().min(1, 'Destination address is required'),
    coordinates: z.tuple([z.number(), z.number()]).optional(),
  }),
  recipients: z
    .array(
      z.object({
        name: z.string().min(1, 'Recipient name is required'),
        phone: phoneSchema,
        notes: z.string().optional(),
      })
    )
    .min(1, 'At least one recipient is required'),
  completionWindow: z.object({
    start: nonNegativeIntSchema,
    end: nonNegativeIntSchema,
  }),
  metadata: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      value: z.string(),
    })
  ),
  notes: z.string().optional(),
  autoAssign: z.boolean().optional(),
});

export const OnfleetTaskResponseSchema = z.object({
  success: z.boolean(),
  taskId: z.string(),
  trackingUrl: z.string(),
  estimatedArrival: z.string().optional(),
});

export const OnfleetWebhookEventSchema = z.object({
  actionContext: z.object({
    id: z.string(),
    type: z.string(),
  }),
  data: z.any(),
  taskId: z.string().optional(),
  workerId: z.string().optional(),
  adminId: z.string().optional(),
  time: z.number(),
  triggerName: z.string(),
});

export const DispatchTeamRequestSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  tasks: z
    .array(z.string().min(1, 'Task ID is required'))
    .min(1, 'At least one task is required'),
  optimizeRoute: z.boolean().optional().default(true),
});

export const RouteOptimizationRequestSchema = z.object({
  driverId: positiveIntSchema,
  tasks: z
    .array(
      z.object({
        taskId: z.string(),
        address: z.string(),
        priority: z.number().int().min(1).max(5).optional(),
        serviceTime: z.number().int().positive().optional(),
      })
    )
    .min(1, 'At least one task is required'),
  vehicleType: z.enum(['car', 'truck', 'van']).optional(),
  startLocation: z
    .object({
      address: z.string(),
      coordinates: z.tuple([z.number(), z.number()]).optional(),
    })
    .optional(),
});

export const TaskUpdateRequestSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  status: z.enum(['assigned', 'in_progress', 'completed', 'failed']),
  notes: z.string().optional(),
  completionDetails: z
    .object({
      photos: z.array(z.string()).optional(),
      signature: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
});

export const BatchOptimizeRequestSchema = z.object({
  deliveryDate: dateStringSchema,
  orders: z
    .array(
      z.object({
        orderId: positiveIntSchema,
        address: z.string(),
        priority: z.number().int().min(1).max(5).optional(),
        estimatedServiceTime: z.number().int().positive().optional(),
      })
    )
    .min(1, 'At least one order is required'),
  constraints: z
    .object({
      maxRoutesPerDriver: z.number().int().positive().optional(),
      maxStopsPerRoute: z.number().int().positive().optional(),
      vehicleCapacity: z.number().positive().optional(),
    })
    .optional(),
});

// ===== DRIVERS DOMAIN SCHEMAS =====

export const DriverAvailabilityRequestSchema = z.object({
  driverId: positiveIntSchema,
  date: dateStringSchema,
  timeSlots: z
    .array(
      z.object({
        start: timeStringSchema,
        end: timeStringSchema,
        available: z.boolean(),
      })
    )
    .min(1, 'At least one time slot is required'),
});

export const DriverAvailabilityResponseSchema = z.object({
  success: z.boolean(),
  driverId: positiveIntSchema,
  availableSlots: z.array(
    z.object({
      start: z.string(),
      end: z.string(),
    })
  ),
});

export const CreateDriverRequestSchema = z.object({
  email: emailSchema,
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: phoneSchema,
  licenseNumber: z.string().min(1, 'License number is required'),
  vehicleInfo: z.object({
    make: z.string().min(1, 'Vehicle make is required'),
    model: z.string().min(1, 'Vehicle model is required'),
    year: z
      .number()
      .int()
      .min(1990)
      .max(new Date().getFullYear() + 1),
    licensePlate: z.string().min(1, 'License plate is required'),
    type: z.enum(['pickup_truck', 'van', 'box_truck']),
  }),
  coverageAreas: z
    .array(zipCodeSchema)
    .min(1, 'At least one coverage area is required'),
  hourlyRate: z.number().positive().optional(),
});

export const DriverResponseSchema = z.object({
  success: z.boolean(),
  driverId: positiveIntSchema,
  invitationSent: z.boolean(),
});

export const DriverProfileSchema = z.object({
  id: positiveIntSchema,
  email: emailSchema,
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: phoneSchema,
  licenseNumber: z.string(),
  status: z.enum(['pending', 'active', 'suspended', 'inactive']),
  rating: z.number().min(0).max(5),
  totalJobs: nonNegativeIntSchema,
  vehicleInfo: z.object({
    make: z.string(),
    model: z.string(),
    year: z.number().int(),
    licensePlate: z.string(),
    type: z.string(),
  }),
  coverageAreas: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const DriverAcceptInvitationRequestSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  acceptTerms: z
    .boolean()
    .refine(val => val === true, 'Must accept terms and conditions'),
  additionalInfo: z
    .object({
      emergencyContact: phoneSchema,
      insuranceInfo: z.string().min(1, 'Insurance information is required'),
    })
    .optional(),
});

// ===== MOVING PARTNERS DOMAIN SCHEMAS =====

export const CreateMovingPartnerRequestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: emailSchema,
  phoneNumber: phoneSchema,
  companyName: z.string().optional(),
  serviceAreas: z
    .array(zipCodeSchema)
    .min(1, 'At least one service area is required'),
  vehicleTypes: z
    .array(z.string())
    .min(1, 'At least one vehicle type is required'),
  hourlyRate: z.number().positive('Hourly rate must be positive'),
  minimumHours: positiveIntSchema,
});

export const MovingPartnerAssignmentRequestSchema = z.object({
  appointmentId: positiveIntSchema,
  partnerId: positiveIntSchema,
  estimatedHours: z.number().positive('Estimated hours must be positive'),
  specialRequirements: z.string().optional(),
});

export const MovingPartnerResponseSchema = z.object({
  success: z.boolean(),
  partnerId: positiveIntSchema,
  estimatedCost: z.number(),
  availabilityConfirmed: z.boolean(),
});

// ===== CUSTOMERS DOMAIN SCHEMAS =====

export const CreateCustomerRequestSchema = z.object({
  email: emailSchema,
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: phoneSchema,
  address: z.string().min(1, 'Address is required'),
  zipCode: zipCodeSchema,
  referralSource: z.string().optional(),
});

export const CustomerResponseSchema = z.object({
  success: z.boolean(),
  customerId: positiveIntSchema,
  stripeCustomerId: z.string().optional(),
});

export const CustomerProfileSchema = z.object({
  id: positiveIntSchema,
  email: emailSchema,
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: phoneSchema,
  address: z.string(),
  zipCode: z.string(),
  joinDate: z.string(),
  totalOrders: nonNegativeIntSchema,
  totalSpent: z.number().min(0),
  preferredPaymentMethod: z.string().optional(),
  communicationPreferences: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
  }),
});

export const UpdateCustomerProfileRequestSchema = z.object({
  customerId: positiveIntSchema,
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phoneNumber: phoneSchema.optional(),
  address: z.string().min(1).optional(),
  zipCode: zipCodeSchema.optional(),
  email: emailSchema.optional(),
});

export const CustomerSearchRequestSchema = z
  .object({
    query: z.string().min(1, 'Search query is required'),
    filters: z
      .object({
        zipCode: zipCodeSchema.optional(),
        joinDateFrom: dateStringSchema.optional(),
        joinDateTo: dateStringSchema.optional(),
        totalSpentMin: z.number().min(0).optional(),
        totalSpentMax: z.number().min(0).optional(),
      })
      .optional(),
  })
  .merge(PaginationRequestSchema);

// ===== ADMIN DOMAIN SCHEMAS =====

export const AdminDashboardStatsResponseSchema = z.object({
  totalCustomers: nonNegativeIntSchema,
  totalDrivers: nonNegativeIntSchema,
  totalMovingPartners: nonNegativeIntSchema,
  activeAppointments: nonNegativeIntSchema,
  completedAppointments: nonNegativeIntSchema,
  pendingPayments: z.number().min(0),
  totalRevenue: z.number().min(0),
  averageRating: z.number().min(0).max(5),
});

export const AdminCalendarEventSchema = z.object({
  id: positiveIntSchema,
  title: z.string(),
  start: z.string(),
  end: z.string(),
  type: z.enum(['appointment', 'delivery', 'maintenance']),
  status: z.string(),
  assignedDriver: z.string().optional(),
  customer: z.string(),
  address: z.string(),
});

export const AdminJobListRequestSchema = z
  .object({
    status: z.string().optional(),
    driverId: positiveIntSchema.optional(),
    dateFrom: dateStringSchema.optional(),
    dateTo: dateStringSchema.optional(),
  })
  .merge(PaginationRequestSchema);

export const AdminStorageUnitRequestSchema = z.object({
  number: z.string().min(1, 'Unit number is required'),
  size: z.enum(['small', 'medium', 'large', 'extra_large']),
  location: z.string().min(1, 'Location is required'),
  status: z.enum(['available', 'occupied', 'maintenance', 'retired']),
  monthlyRate: z.number().positive('Monthly rate must be positive'),
});

export const AdminInventoryRequestSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  quantity: nonNegativeIntSchema,
  unitPrice: z.number().positive('Unit price must be positive'),
  supplier: z.string().optional(),
  reorderLevel: nonNegativeIntSchema.optional(),
});

export const AdminReportRequestSchema = z.object({
  reportType: z.enum([
    'revenue',
    'customer_satisfaction',
    'driver_performance',
    'inventory',
    'capacity_utilization',
  ]),
  dateFrom: dateStringSchema,
  dateTo: dateStringSchema,
  filters: z.record(z.any()).optional(),
  format: z.enum(['json', 'csv', 'pdf']).optional().default('json'),
});

export const AdminUserManagementRequestSchema = z.object({
  userId: positiveIntSchema,
  action: z.enum(['activate', 'deactivate', 'suspend', 'reset_password']),
  reason: z.string().min(1, 'Reason is required'),
  notifyUser: z.boolean().optional().default(true),
});

// ===== NOTIFICATION SCHEMAS =====

export const NotificationRequestSchema = z.object({
  recipientId: positiveIntSchema,
  recipientType: z.enum(['customer', 'driver', 'mover', 'admin']),
  type: z.enum(['sms', 'email', 'push']),
  templateId: z.string().min(1, 'Template ID is required'),
  variables: z.record(z.any()),
  scheduledFor: z.string().optional(),
});

export const NotificationResponseSchema = z.object({
  success: z.boolean(),
  notificationId: z.string(),
  estimatedDelivery: z.string().optional(),
});

// ===== FEEDBACK SCHEMAS =====

export const SubmitFeedbackRequestSchema = z
  .object({
    appointmentId: positiveIntSchema.optional(),
    packingSupplyOrderId: positiveIntSchema.optional(),
    rating: z
      .number()
      .int()
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating cannot exceed 5'),
    comments: z.string().optional(),
    categories: z.array(z.string()).min(1, 'At least one category is required'),
    photos: z.array(z.string()).optional(),
  })
  .refine(
    data =>
      data.appointmentId !== undefined ||
      data.packingSupplyOrderId !== undefined,
    'Either appointmentId or packingSupplyOrderId must be provided'
  );

export const FeedbackResponseSchema = z.object({
  success: z.boolean(),
  feedbackId: positiveIntSchema,
  thankYouMessage: z.string(),
});

// ===== STORAGE UNIT SCHEMAS =====

export const StorageUnitRequestSchema = z.object({
  customerId: positiveIntSchema,
  size: z.enum(['small', 'medium', 'large', 'extra_large']),
  location: z.string().min(1, 'Location is required'),
  specialRequirements: z.string().optional(),
});

export const StorageUnitResponseSchema = z.object({
  success: z.boolean(),
  unitId: positiveIntSchema,
  unitNumber: z.string(),
  monthlyRate: z.number(),
  availableDate: z.string(),
});

export const StorageUnitAvailabilityRequestSchema = z.object({
  zipCode: zipCodeSchema,
  size: z.enum(['small', 'medium', 'large', 'extra_large']).optional(),
  startDate: dateStringSchema,
  endDate: dateStringSchema.optional(),
});

export const StorageUnitAvailabilityResponseSchema = z.object({
  success: z.boolean(),
  availableUnits: z.array(
    z.object({
      unitId: positiveIntSchema,
      unitNumber: z.string(),
      size: z.string(),
      location: z.string(),
      monthlyRate: z.number(),
      availableDate: z.string(),
    })
  ),
});

// ===== TRACKING SCHEMAS =====

export const TrackingRequestSchema = z.object({
  token: z.string().min(1, 'Tracking token is required'),
});

export const TrackingResponseSchema = z.object({
  success: z.boolean(),
  trackingInfo: z.object({
    orderId: positiveIntSchema,
    status: z.string(),
    estimatedArrival: z.string().optional(),
    currentLocation: z.string().optional(),
    updates: z.array(
      z.object({
        timestamp: z.string(),
        status: z.string(),
        message: z.string(),
        location: z.string().optional(),
      })
    ),
  }),
});

// ===== UPLOAD SCHEMAS =====

export const FileUploadRequestSchema = z.object({
  file: z.any(), // File object from FormData
  uploadType: z.enum([
    'profile_picture',
    'vehicle_photo',
    'license_photo',
    'insurance_document',
    'damage_photo',
    'completion_photo',
  ]),
  entityId: positiveIntSchema, // ID of associated entity (driver, vehicle, etc.)
});

export const FileUploadResponseSchema = z.object({
  success: z.boolean(),
  fileUrl: z.string(),
  fileId: z.string(),
});

// ===== SEARCH SCHEMAS =====

export const SearchRequestSchema = z
  .object({
    query: z.string().min(1, 'Search query is required'),
    filters: z.record(z.any()).optional(),
  })
  .merge(PaginationRequestSchema);

export const SearchResponseSchema = z.object({
  success: z.boolean(),
  results: z.array(z.any()),
  pagination: PaginationResponseSchema,
  facets: z.record(z.array(z.string())).optional(),
});

// ===== CRON JOB SCHEMAS =====

export const CronJobRequestSchema = z.object({
  jobType: z.enum([
    'daily_dispatch',
    'packing_supply_payouts',
    'expired_offers',
    'route_optimization',
  ]),
  parameters: z.record(z.any()).optional(),
});

export const CronJobResponseSchema = z.object({
  success: z.boolean(),
  jobId: z.string(),
  executionTime: z.string(),
  results: z.any(),
});

// ===== VALIDATION HELPER FUNCTIONS =====

/**
 * Validates API request data against a schema and returns typed result
 */
export function validateApiRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Formats Zod validation errors into user-friendly messages
 */
export function formatValidationErrors(error: z.ZodError): string[] {
  return error.errors.map(err => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
}

// ===== ORDERS DOMAIN VALIDATION SCHEMAS =====

// Submit Quote Request Schema (New Customer Appointment Booking)
export const CreateSubmitQuoteRequestSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: emailSchema,
  phoneNumber: phoneSchema,
  stripeCustomerId: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  zipCode: zipCodeSchema,
  storageUnitCount: z.string().or(positiveIntSchema),
  selectedInsurance: z.object({
    label: z.string(),
    value: z.union([z.string(), z.number()]),
  }).optional(),
  appointmentDateTime: z.string().min(1, 'Appointment date and time is required'),
  planType: z.string().min(1, 'Plan type is required'),
  calculatedTotal: z.number().positive('Total must be positive'),
  parsedLoadingHelpPrice: z.number().min(0, 'Loading help price must be non-negative'),
  monthlyStorageRate: z.number().positive('Monthly storage rate must be positive'),
  monthlyInsuranceRate: z.number().min(0, 'Monthly insurance rate must be non-negative'),
  appointmentType: z.enum([
    'Initial Pickup',
    'Additional Storage',
    'Storage Unit Access',
    'End Storage Term'
  ]),
  movingPartnerId: z.string().or(positiveIntSchema).optional(),
  thirdPartyMovingPartnerId: z.string().or(positiveIntSchema).optional(),
});

// ===== APPOINTMENT ADDITIONAL DETAILS SCHEMAS =====

export const AddAppointmentDetailsRequestSchema = z.object({
  itemsOver100lbs: z.boolean(),
  storageTerm: z.string().optional(),
  storageAccessFrequency: z.string().optional(),
  moveDescription: z.string().optional(),
  conditionsDescription: z.string().optional(),
});

export const AddAppointmentDetailsResponseSchema = z.object({
  id: positiveIntSchema,
  appointmentId: positiveIntSchema,
  itemsOver100lbs: z.boolean(),
  storageTerm: z.string().nullable(),
  storageAccessFrequency: z.string().nullable(),
  moveDescription: z.string().nullable(),
  conditionsDescription: z.string().nullable(),
});

// ===== GET APPOINTMENT DETAILS SCHEMAS =====

export const GetAppointmentDetailsParamsSchema = z.object({
  id: z.string().or(positiveIntSchema).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
});

export const GetAppointmentDetailsResponseSchema = z.object({
  id: positiveIntSchema,
  userId: positiveIntSchema,
  date: z.string(),
  time: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  unitQuantity: positiveIntSchema,
  user: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    phoneNumber: z.string().nullable(),
  }),
  driver: z.object({
    firstName: z.string(),
    lastName: z.string(),
    phoneNumber: z.string().nullable(),
    driverLicenseFrontPhoto: z.string().nullable(),
  }).nullable(),
  movingPartner: z.object({
    id: positiveIntSchema,
    name: z.string(),
    phoneNumber: z.string().nullable(),
    hourlyRate: z.number().nullable(),
    onfleetTeamId: z.string().nullable(),
  }).nullable(),
  storageStartUsages: z.array(z.object({
    id: positiveIntSchema,
    storageUnit: z.object({
      number: z.string(),
      size: z.string(),
    }),
  })),
  requestedStorageUnits: z.array(z.object({
    id: positiveIntSchema,
    storageUnit: z.object({
      number: z.string(),
      size: z.string(),
    }),
  })),
});

// Storage Unit Available Count API
export const StorageUnitAvailableCountResponseSchema = z.object({
  availableCount: z.number().int().min(0),
});

// Mover Change Response API
export const MoverChangeResponseRequestSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  action: z.enum(['accept', 'diy'], {
    required_error: 'Action must be either "accept" or "diy"',
  }),
  appointmentId: z.number().int().positive('Appointment ID must be a positive integer'),
});

export const MoverChangeResponseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  newMovingPartner: z.string().optional(),
  assignedDriver: z.string().optional(),
  newQuotedPrice: z.number().optional(),
});

// Verify Mover Change Token API
export const VerifyMoverChangeTokenRequestSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const VerifyMoverChangeTokenResponseSchema = z.object({
  appointmentId: z.number().int().positive(),
  suggestedMovingPartnerId: z.number().int().positive(),
  originalMovingPartnerId: z.number().int().positive(),
  timestamp: z.number().int().positive(),
  appointment: z.object({
    id: z.number().int().positive(),
    date: z.string(),
    time: z.string(),
    address: z.string(),
    appointmentType: z.string(),
    loadingHelpPrice: z.number().min(0),
    insuranceCoverage: z.string(),
    monthlyStorageRate: z.number().min(0),
    numberOfUnits: z.number().int().positive(),
    quotedPrice: z.number().min(0),
    requestedStorageUnits: z.array(z.any()),
    originalMover: z.object({
      name: z.string(),
      hourlyRate: z.number().min(0),
    }),
    suggestedMover: z.object({
      name: z.string(),
      hourlyRate: z.number().min(0),
      averageRating: z.number().min(0).max(5),
    }),
  }),
});

// ===== ONFLEET APPOINTMENT TASK CREATION SCHEMAS =====

// Create Onfleet Appointment Tasks API (for appointment-based task sequences)
export const CreateOnfleetAppointmentTasksRequestSchema = z.object({
  appointmentId: z.string().or(positiveIntSchema),
  userId: z.string().or(positiveIntSchema),
  address: z.string().min(1, 'Address is required'),
  appointmentDateTime: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    'Invalid appointment date time format'
  ),
  appointmentType: appointmentTypeSchema,
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: phoneSchema,
  deliveryReason: z.string().optional(),
  description: z.string().optional(),
  selectedPlanName: z.string().optional(),
  selectedLabor: z.object({
    title: z.string(),
    onfleetTeamId: onfleetTeamIdSchema,
  }).optional(),
  parsedLoadingHelpPrice: z.string().optional(),
  storageUnitIds: z.array(z.number().int().positive()).optional(),
  storageUnitCount: nonNegativeIntSchema.optional(),
  startingUnitNumber: positiveIntSchema.optional().default(1),
  additionalUnitsOnly: z.boolean().optional().default(false),
});

export const CreateOnfleetAppointmentTasksResponseSchema = z.object({
  success: z.boolean(),
  taskIds: z.object({
    pickup: z.array(z.string()),
    customer: z.array(z.string()),
    return: z.array(z.string()),
  }),
  shortIds: z.object({
    pickup: z.array(z.string()),
    customer: z.array(z.string()),
    return: z.array(z.string()),
  }),
  error: z.string().optional(),
  details: z.string().optional(),
});

// ===== ONFLEET UPDATE TASK SCHEMAS =====

export const UpdateOnfleetTaskRequestSchema = z.object({
  appointmentId: z.string().or(positiveIntSchema)
    .transform(val => typeof val === 'string' ? parseInt(val, 10) : val),
  updatedData: z.object({
    appointmentType: appointmentTypeSchema.optional(),
    address: z.string().min(5, 'Address must be at least 5 characters').optional(),
    zipcode: zipCodeSchema.optional(),
    date: z.string().or(z.date()).optional(),
    time: z.string().or(z.date()).optional(),
    description: z.string().optional(),
    numberOfUnits: positiveIntSchema.optional(),
    planType: z.enum(['Do It Yourself Plan', 'Full Service Plan']).optional(),
    movingPartnerId: positiveIntSchema.optional(),
    selectedLabor: z.object({
      onfleetTeamId: z.string().optional()
    }).optional()
  }).optional()
});

export const UpdateOnfleetTaskResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  results: z.array(z.object({
    taskId: z.string(),
    shortId: z.string(),
    success: z.boolean(),
    status: z.number().optional(),
    error: z.any().optional(),
    updatedTask: z.any().optional()
  }))
});

// ====================
// ONFLEET API VALIDATION SCHEMAS
// ====================

/**
 * Onfleet dispatch team request validation
 * @source boombox-10.0/src/app/api/onfleet/dispatch-team/route.ts
 */
export const OnfleetDispatchTeamRequestSchema = z.object({
  targetDate: z.string().optional(),
  forceDispatch: z.boolean().optional(),
  dryRun: z.boolean().optional(),
});

/**
 * Onfleet test connection request validation
 * @source boombox-10.0/src/app/api/onfleet/test-connection/route.ts
 */
export const OnfleetTestConnectionRequestSchema = z.object({
  teamName: z.string().optional(),
});

/**
 * Onfleet calculate payout request validation
 * @source boombox-10.0/src/app/api/onfleet/calculate-payout/route.ts
 */
export const OnfleetCalculatePayoutRequestSchema = z.object({
  action: z.enum(['process_single', 'process_multiple', 'retry_failed', 'calculate_only']),
  orderId: z.number().optional(),
  orderIds: z.array(z.number()).optional(),
  forceRetry: z.boolean().optional(),
  routeMetrics: z.object({
    distance: z.number(),
    duration: z.number(),
    stops: z.number(),
    weight: z.number().optional(),
    volume: z.number().optional(),
  }).optional(),
});

/**
 * Onfleet test route plan - no request validation needed (GET only)
 * @source boombox-10.0/src/app/api/test-onfleet/route.ts
 */

// Type exports for the Onfleet schemas
export type OnfleetDispatchTeamRequest = z.infer<typeof OnfleetDispatchTeamRequestSchema>;
export type OnfleetTestConnectionRequest = z.infer<typeof OnfleetTestConnectionRequestSchema>;
export type OnfleetCalculatePayoutRequest = z.infer<typeof OnfleetCalculatePayoutRequestSchema>;

/**
 * Onfleet webhook validation schemas
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts
 */

// Webhook task completion details
const WebhookCompletionDetailsSchema = z.object({
  photoUploadId: z.string().optional(),
  photoUploadIds: z.array(z.string()).optional(),
  unavailableAttachments: z.array(z.object({
    attachmentType: z.string(),
    attachmentId: z.string().optional()
  })).optional(),
  drivingDistance: z.number().optional(),
  drivingTime: z.number().optional(),
  time: z.number().optional()
});

// Webhook task details
const WebhookTaskDetailsSchema = z.object({
  shortId: z.string(),
  estimatedArrivalTime: z.string().optional(),
  trackingURL: z.string().optional(),
  completionDetails: WebhookCompletionDetailsSchema.optional(),
  metadata: z.array(z.object({
    name: z.string(),
    value: z.string()
  })).optional(),
  worker: z.object({
    name: z.string().optional()
  }).optional()
});

// Main webhook payload
export const OnfleetWebhookPayloadSchema = z.object({
  taskId: z.string(),
  time: z.number(),
  triggerName: z.enum(['taskStarted', 'taskArrival', 'taskCompleted', 'taskFailed']),
  data: z.object({
    task: WebhookTaskDetailsSchema.optional(),
    worker: z.object({
      name: z.string().optional()
    }).optional()
  }).optional()
});

// GET request validation for webhook endpoint
export const OnfleetWebhookGetRequestSchema = z.object({
  check: z.string().optional(),
  testOrderId: z.string().optional(),
  testPhotoUrl: z.string().url().optional()
});

export type OnfleetWebhookPayload = z.infer<typeof OnfleetWebhookPayloadSchema>;
export type OnfleetWebhookGetRequest = z.infer<typeof OnfleetWebhookGetRequestSchema>;

// ===== PACKING SUPPLY ROUTE ASSIGNMENT SCHEMAS =====

export const AssignOrdersToRouteRequestSchema = z.object({
  action: z.literal('assign_orders_to_route'),
  driverId: z.string().or(positiveIntSchema).transform(val => parseInt(String(val), 10)),
  deliveryDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid delivery date format'
  ),
  orderIds: z.array(z.string().or(positiveIntSchema).transform(val => parseInt(String(val), 10)))
    .min(1, 'At least one order ID is required')
});

export const TriggerBatchOptimizationRequestSchema = z.object({
  action: z.literal('trigger_batch_optimization'),
  deliveryDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid delivery date format'
  ).optional()
});

export const AssignRoutesRequestSchema = z.discriminatedUnion('action', [
  AssignOrdersToRouteRequestSchema,
  TriggerBatchOptimizationRequestSchema
]);

export const AssignRoutesGetRequestSchema = z.object({
  deliveryDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid delivery date format'
  ).optional(),
  status: z.string().optional()
});

export type AssignOrdersToRouteRequest = z.infer<typeof AssignOrdersToRouteRequestSchema>;
export type TriggerBatchOptimizationRequest = z.infer<typeof TriggerBatchOptimizationRequestSchema>;
export type AssignRoutesRequest = z.infer<typeof AssignRoutesRequestSchema>;
export type AssignRoutesGetRequest = z.infer<typeof AssignRoutesGetRequestSchema>;

// ===== DRIVER OFFER SCHEMAS =====

export const DriverOfferRequestSchema = z.object({
  routeId: z.string().min(1, 'Route ID is required'),
  targetDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid target date format'
  ).optional(),
  source: z.string().optional()
});

export const DriverOfferGetRequestSchema = z.object({
  status: z.string().optional(),
  date: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid date format'
  ).optional()
});

export type DriverOfferRequest = z.infer<typeof DriverOfferRequestSchema>;
export type DriverOfferGetRequest = z.infer<typeof DriverOfferGetRequestSchema>;

// ===== ONFLEET PACKING SUPPLY ROUTES VALIDATION =====

// Driver response validation (POST and GET)
export const DriverResponseRequestSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  action: z.enum(['accept', 'decline'], {
    errorMap: () => ({ message: 'Action must be "accept" or "decline"' })
  })
});

export const DriverResponseGetSchema = z.object({
  token: z.string().min(1, 'Token is required')
});

// Handle expired offers validation (POST and GET)
export const HandleExpiredOffersRequestSchema = z.object({
  // No body validation needed - uses auth header
});

export const HandleExpiredOffersGetSchema = z.object({
  dryRun: z.string().optional().transform(val => val === 'true')
});

// Process route payout validation
export const ProcessRoutePayoutRequestSchema = z.object({
  routeId: z.string().min(1, 'Route ID is required').optional(),
  action: z.enum(['process_all_pending']).optional()
}).refine(
  (data) => data.routeId || data.action === 'process_all_pending',
  { message: 'Either routeId or action=process_all_pending is required' }
);

export const ProcessRoutePayoutGetSchema = z.object({
  routeId: z.string().optional()
});

// Route details validation (parameterized route)
export const RouteDetailsParamsSchema = z.object({
  routeId: z.string().min(1, 'Route ID is required')
});

export const RouteDetailsQuerySchema = z.object({
  token: z.string().min(1, 'Token is required')
});
