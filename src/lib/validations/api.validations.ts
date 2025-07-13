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

// ===== CORE API RESPONSE SCHEMAS =====

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
  field: z.string().optional(),
});

export const ResponseMetaSchema = z.object({
  timestamp: z.string(),
  requestId: z.string().optional(),
  pagination: z
    .object({
      page: positiveIntSchema,
      limit: positiveIntSchema,
      total: nonNegativeIntSchema,
      totalPages: nonNegativeIntSchema,
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    })
    .optional(),
  version: z.string().optional(),
});

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: ApiErrorSchema.optional(),
    meta: ResponseMetaSchema.optional(),
  });

// ===== AUTHENTICATION DOMAIN SCHEMAS =====

export const LoginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

export const LoginResponseSchema = z.object({
  user: z.object({
    id: positiveIntSchema,
    email: emailSchema,
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    role: z.string(),
    emailVerified: z.boolean(),
  }),
  session: z
    .object({
      token: z.string(),
      expiresAt: z.string(),
    })
    .optional(),
  redirectUrl: z.string().optional(),
});

export const SignupRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: phoneSchema,
  role: z.enum(['customer', 'driver', 'mover']).optional(),
});

export const SignupResponseSchema = z.object({
  user: z.object({
    id: positiveIntSchema,
    email: emailSchema,
    firstName: z.string(),
    lastName: z.string(),
  }),
  verificationRequired: z.boolean(),
  message: z.string(),
});

export const VerifyCodeRequestSchema = z.object({
  email: emailSchema,
  code: z.string().length(6, 'Verification code must be 6 digits'),
  type: z.enum(['email_verification', 'phone_verification', 'password_reset']),
});

export const VerifyCodeResponseSchema = z.object({
  verified: z.boolean(),
  token: z.string().optional(),
  message: z.string(),
});

export const ForgotPasswordRequestSchema = z.object({
  email: emailSchema,
});

export const ResetPasswordRequestSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
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

export const CreateStripeCustomerResponseSchema = z.object({
  customerId: z.string(),
  setupIntentClientSecret: z.string(),
  message: z.string(),
});

export const CreatePaymentIntentRequestSchema = z.object({
  amount: positiveIntSchema,
  currency: z.string().length(3).default('usd'),
  customerId: z.string().min(1, 'Customer ID is required'),
  appointmentId: positiveIntSchema.optional(),
  orderId: positiveIntSchema.optional(),
  description: z.string().optional(),
});

export const CreatePaymentIntentResponseSchema = z.object({
  clientSecret: z.string(),
  paymentIntentId: z.string(),
});

export const StripeWebhookRequestSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.any(),
  }),
  id: z.string(),
  created: nonNegativeIntSchema,
});

export const PaymentMethodRequestSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
});

export const PaymentHistoryResponseSchema = z.object({
  payments: z.array(
    z.object({
      id: z.string(),
      amount: nonNegativeIntSchema,
      currency: z.string(),
      status: z.string(),
      created: nonNegativeIntSchema,
      description: z.string().optional(),
      appointmentId: positiveIntSchema.optional(),
    })
  ),
  total: nonNegativeIntSchema,
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

export const CreateAppointmentResponseSchema = z.object({
  appointment: z.object({
    id: positiveIntSchema,
    jobCode: z.string(),
    appointmentType: z.string(),
    date: z.string(),
    time: z.string(),
    status: z.string(),
  }),
  onfleetTasks: z
    .array(
      z.object({
        id: z.string(),
        shortId: z.string(),
        state: nonNegativeIntSchema,
      })
    )
    .optional(),
});

export const EditAppointmentRequestSchema = z.object({
  appointmentId: positiveIntSchema,
  date: dateStringSchema.optional(),
  time: timeStringSchema.optional(),
  address: z.string().min(1).optional(),
  specialInstructions: z.string().optional(),
  notifyDriver: z.boolean().optional(),
});

export const CancelAppointmentRequestSchema = z.object({
  appointmentId: positiveIntSchema,
  reason: z.string().min(1, 'Cancellation reason is required'),
  refundRequested: z.boolean().optional(),
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

export const CreatePackingSupplyOrderResponseSchema = z.object({
  order: z.object({
    id: positiveIntSchema,
    orderNumber: z.string(),
    status: z.string(),
    totalAmount: nonNegativeIntSchema,
    deliveryDate: z.string(),
  }),
  onfleetTask: z
    .object({
      id: z.string(),
      shortId: z.string(),
    })
    .optional(),
});

export const PackingSupplyOrderUpdateSchema = z.object({
  orderId: positiveIntSchema,
  status: z
    .enum(['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'])
    .optional(),
  trackingInfo: z.string().optional(),
  deliveryNotes: z.string().optional(),
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

export const CreateOnfleetTaskResponseSchema = z.object({
  task: z.object({
    id: z.string(),
    shortId: z.string(),
    state: nonNegativeIntSchema,
    worker: z.string().optional(),
    estimatedArrivalTime: nonNegativeIntSchema.optional(),
    estimatedCompletionTime: nonNegativeIntSchema.optional(),
  }),
  trackingUrl: z.string(),
});

export const OnfleetWebhookDataSchema = z.object({
  triggerId: nonNegativeIntSchema,
  triggerName: z.string(),
  taskId: z.string(),
  workerId: z.string().optional(),
  adminId: z.string().optional(),
  data: z.object({
    task: z
      .object({
        id: z.string(),
        shortId: z.string(),
        state: nonNegativeIntSchema,
        metadata: z.array(
          z.object({
            name: z.string(),
            type: z.string(),
            value: z.string(),
          })
        ),
        destination: z.object({
          address: z.object({
            unparsed: z.string(),
          }),
        }),
        completionDetails: z
          .object({
            photoUploadIds: z.array(z.string()).optional(),
            signatureUploadId: z.string().optional(),
            notes: z.string().optional(),
            time: nonNegativeIntSchema.optional(),
          })
          .optional(),
      })
      .optional(),
    worker: z
      .object({
        id: z.string(),
        name: z.string(),
        phone: z.string(),
        vehicle: z
          .object({
            type: z.string(),
            licensePlate: z.string(),
          })
          .optional(),
      })
      .optional(),
  }),
  time: nonNegativeIntSchema,
});

export const UpdateOnfleetTaskRequestSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  notes: z.string().optional(),
  metadata: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        value: z.string(),
      })
    )
    .optional(),
  destination: z
    .object({
      address: z.string().min(1),
      coordinates: z.tuple([z.number(), z.number()]).optional(),
    })
    .optional(),
});

export const OnfleetWorkerResponseSchema = z.object({
  workers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      phone: z.string(),
      isActive: z.boolean(),
      onDuty: z.boolean(),
      location: z.tuple([z.number(), z.number()]).optional(),
      vehicle: z
        .object({
          type: z.string(),
          licensePlate: z.string(),
        })
        .optional(),
    })
  ),
});

// ===== DRIVERS DOMAIN SCHEMAS =====

export const DriverAssignmentRequestSchema = z.object({
  appointmentId: positiveIntSchema,
  onfleetTaskId: z.string().optional(),
  driverId: positiveIntSchema.optional(),
  action: z.enum([
    'assign',
    'accept',
    'decline',
    'retry',
    'cancel',
    'reconfirm',
  ]),
});

export const DriverAssignmentResponseSchema = z.object({
  success: z.boolean(),
  assignment: z
    .object({
      driverId: positiveIntSchema,
      appointmentId: positiveIntSchema,
      taskId: z.string(),
      estimatedPayment: nonNegativeIntSchema,
    })
    .optional(),
  nextAction: z
    .enum(['wait_for_acceptance', 'find_new_driver', 'notify_admin'])
    .optional(),
  message: z.string(),
});

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
  updated: z.boolean(),
  conflicts: z
    .array(
      z.object({
        appointmentId: positiveIntSchema,
        time: z.string(),
      })
    )
    .optional(),
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

export const DriverProfileResponseSchema = z.object({
  driver: z.object({
    id: positiveIntSchema,
    firstName: z.string(),
    lastName: z.string(),
    email: emailSchema,
    phoneNumber: phoneSchema,
    isActive: z.boolean(),
    onfleetWorkerId: z.string().optional(),
    rating: z.number().min(0).max(5),
    totalJobs: nonNegativeIntSchema,
    vehicle: z
      .object({
        make: z.string(),
        model: z.string(),
        year: z.number(),
        licensePlate: z.string(),
        type: z.string(),
      })
      .optional(),
    coverageAreas: z.array(z.string()),
  }),
  stats: z.object({
    completedJobs: nonNegativeIntSchema,
    cancelledJobs: nonNegativeIntSchema,
    totalEarnings: nonNegativeIntSchema,
    averageRating: z.number().min(0).max(5),
  }),
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

export const MovingPartnerAvailabilityRequestSchema = z.object({
  partnerId: positiveIntSchema,
  date: dateStringSchema,
  available: z.boolean(),
  blockedTimeSlots: z
    .array(
      z.object({
        start: timeStringSchema,
        end: timeStringSchema,
        reason: z.string().min(1, 'Reason for blocking is required'),
      })
    )
    .optional(),
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

export const CustomerProfileResponseSchema = z.object({
  customer: z.object({
    id: positiveIntSchema,
    firstName: z.string(),
    lastName: z.string(),
    email: emailSchema,
    phoneNumber: phoneSchema,
    address: z.string(),
    zipCode: zipCodeSchema,
    stripeCustomerId: z.string().optional(),
    createdAt: z.string(),
  }),
  stats: z.object({
    totalAppointments: nonNegativeIntSchema,
    activeStorageUnits: nonNegativeIntSchema,
    totalSpent: nonNegativeIntSchema,
    memberSince: z.string(),
  }),
  recentActivity: z.array(
    z.object({
      type: z.enum(['appointment', 'payment', 'storage_access']),
      description: z.string(),
      date: z.string(),
    })
  ),
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

// ===== ADMIN DOMAIN SCHEMAS =====

export const AdminTasksResponseSchema = z.object({
  tasks: z.object({
    unassignedJobs: z.array(
      z.object({
        id: positiveIntSchema,
        jobCode: z.string(),
        address: z.string(),
        date: z.string(),
        time: z.string(),
        customerName: z.string(),
        movingPartner: z
          .object({
            name: z.string(),
            phoneNumber: phoneSchema,
          })
          .optional(),
      })
    ),
    negativeFeedback: z.array(
      z.object({
        id: positiveIntSchema,
        appointmentId: positiveIntSchema,
        rating: z.number().min(1).max(5),
        comments: z.string(),
        customerName: z.string(),
        date: z.string(),
      })
    ),
    pendingCleaning: z.array(
      z.object({
        id: positiveIntSchema,
        unitNumber: z.string(),
        location: z.string(),
        lastAccessed: z.string(),
        priority: z.enum(['low', 'medium', 'high']),
      })
    ),
    storageUnitNeeded: z.array(
      z.object({
        id: positiveIntSchema,
        appointmentId: positiveIntSchema,
        customerName: z.string(),
        appointmentDate: z.string(),
        unitsRequested: positiveIntSchema,
      })
    ),
    pendingLocationUpdate: z.array(
      z.object({
        id: positiveIntSchema,
        unitNumber: z.string(),
        currentLocation: z.string(),
        requestedLocation: z.string(),
        reason: z.string(),
      })
    ),
  }),
  counts: z.object({
    unassignedJobs: nonNegativeIntSchema,
    negativeFeedback: nonNegativeIntSchema,
    pendingCleaning: nonNegativeIntSchema,
    storageUnitNeeded: nonNegativeIntSchema,
    pendingLocationUpdate: nonNegativeIntSchema,
  }),
});

export const AdminDashboardStatsResponseSchema = z.object({
  today: z.object({
    appointments: nonNegativeIntSchema,
    revenue: nonNegativeIntSchema,
    activeDrivers: nonNegativeIntSchema,
    completedJobs: nonNegativeIntSchema,
  }),
  thisWeek: z.object({
    appointments: nonNegativeIntSchema,
    revenue: nonNegativeIntSchema,
    newCustomers: nonNegativeIntSchema,
    driverUtilization: z.number().min(0).max(100),
  }),
  thisMonth: z.object({
    appointments: nonNegativeIntSchema,
    revenue: nonNegativeIntSchema,
    storageUnitsActive: nonNegativeIntSchema,
    customerRetention: z.number().min(0).max(100),
  }),
  trends: z.object({
    appointmentGrowth: z.number(),
    revenueGrowth: z.number(),
    customerSatisfaction: z.number().min(0).max(5),
  }),
});

export const AdminReportsRequestSchema = z.object({
  reportType: z.enum(['revenue', 'drivers', 'customers', 'operations']),
  dateRange: z.object({
    start: dateStringSchema,
    end: dateStringSchema,
  }),
  filters: z
    .object({
      driverId: positiveIntSchema.optional(),
      customerId: positiveIntSchema.optional(),
      zipCode: zipCodeSchema.optional(),
      appointmentType: z.string().optional(),
    })
    .optional(),
});

export const TaskCompletionRequestSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  taskType: z.enum([
    'storage',
    'feedback',
    'cleaning',
    'access',
    'prep-delivery',
  ]),
  completedBy: positiveIntSchema,
  notes: z.string().optional(),
  followUpRequired: z.boolean().optional(),
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
  notificationId: z.string(),
  status: z.enum(['sent', 'scheduled', 'failed']),
  deliveredAt: z.string().optional(),
  error: z.string().optional(),
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
  feedbackId: positiveIntSchema,
  processed: z.boolean(),
  followUpRequired: z.boolean(),
  adminNotified: z.boolean(),
});

// ===== STORAGE UNIT SCHEMAS =====

export const StorageUnitRequestSchema = z.object({
  customerId: positiveIntSchema,
  size: z.enum(['small', 'medium', 'large', 'extra_large']),
  location: z.string().min(1, 'Location is required'),
  specialRequirements: z.string().optional(),
});

export const StorageUnitResponseSchema = z.object({
  unit: z.object({
    id: positiveIntSchema,
    unitNumber: z.string(),
    size: z.string(),
    location: z.string(),
    status: z.enum(['available', 'occupied', 'maintenance', 'cleaning']),
    assignedCustomerId: positiveIntSchema.optional(),
    lastAccessed: z.string().optional(),
  }),
});

export const AccessStorageUnitRequestSchema = z.object({
  customerId: positiveIntSchema,
  storageUnitIds: z
    .array(positiveIntSchema)
    .min(1, 'At least one storage unit ID is required'),
  accessDate: dateStringSchema,
  accessTime: timeStringSchema,
  reason: z.string().min(1, 'Access reason is required'),
  specialInstructions: z.string().optional(),
});

// ===== UTILITY SCHEMAS =====

export const FileUploadResponseSchema = z.object({
  uploadId: z.string(),
  fileName: z.string(),
  fileSize: nonNegativeIntSchema,
  mimeType: z.string(),
  url: z.string(),
});

export const BulkOperationRequestSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  z.object({
    operation: z.enum(['create', 'update', 'delete']),
    items: z.array(itemSchema).min(1, 'At least one item is required'),
    validateOnly: z.boolean().optional(),
  });

export const BulkOperationResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  z.object({
    successful: z.array(itemSchema),
    failed: z.array(
      z.object({
        item: itemSchema,
        error: ApiErrorSchema,
      })
    ),
    summary: z.object({
      total: nonNegativeIntSchema,
      successful: nonNegativeIntSchema,
      failed: nonNegativeIntSchema,
    }),
  });

// ===== PAGINATION SCHEMAS =====

export const PaginationRequestSchema = z.object({
  page: positiveIntSchema.default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const SearchRequestSchema = z
  .object({
    query: z.string().min(1, 'Search query is required'),
    filters: z.record(z.any()).optional(),
  })
  .merge(PaginationRequestSchema);

// ===== EXPORT ALL SCHEMAS =====

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type SignupRequest = z.infer<typeof SignupRequestSchema>;
export type VerifyCodeRequest = z.infer<typeof VerifyCodeRequestSchema>;
export type CreateStripeCustomerRequest = z.infer<
  typeof CreateStripeCustomerRequestSchema
>;
export type CreateAppointmentRequest = z.infer<
  typeof CreateAppointmentRequestSchema
>;
export type CreatePackingSupplyOrderRequest = z.infer<
  typeof CreatePackingSupplyOrderRequestSchema
>;
export type CreateOnfleetTaskRequest = z.infer<
  typeof CreateOnfleetTaskRequestSchema
>;
export type DriverAssignmentRequest = z.infer<
  typeof DriverAssignmentRequestSchema
>;
export type CreateDriverRequest = z.infer<typeof CreateDriverRequestSchema>;
export type CreateMovingPartnerRequest = z.infer<
  typeof CreateMovingPartnerRequestSchema
>;
export type CreateCustomerRequest = z.infer<typeof CreateCustomerRequestSchema>;
export type AdminReportsRequest = z.infer<typeof AdminReportsRequestSchema>;
export type NotificationRequest = z.infer<typeof NotificationRequestSchema>;
export type SubmitFeedbackRequest = z.infer<typeof SubmitFeedbackRequestSchema>;
export type StorageUnitRequest = z.infer<typeof StorageUnitRequestSchema>;
export type AccessStorageUnitRequest = z.infer<
  typeof AccessStorageUnitRequestSchema
>;

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
 * Creates a standardized API error response from Zod validation errors
 */
export function createValidationErrorResponse(error: z.ZodError) {
  const firstError = error.errors[0];
  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: firstError.message,
      field: firstError.path.join('.'),
      details: error.errors,
    },
  };
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: Record<string, unknown>
) {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>
) {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}
