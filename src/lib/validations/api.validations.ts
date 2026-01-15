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
  // Source of the request - used to prevent duplicate SMS when accepting via inbound SMS
  source: z.enum(['web', 'inbound_sms']).optional(),
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
  notificationsSent: z.array(z.string()).optional(),
});

/**
 * Validation schema for storage unit reduction operations
 * Used by AppointmentUpdateOrchestrator to validate unit removal requests
 */
export const StorageUnitReductionSchema = z.object({
  appointmentId: positiveIntSchema,
  unitIdsToRemove: z.array(positiveIntSchema).min(1, 'At least one unit must be specified for removal'),
  unitNumbersToRemove: z.array(positiveIntSchema).min(1, 'At least one unit number must be specified'),
  reason: z.string().optional(),
}).refine(
  (data) => {
    // Validate that we're not trying to remove more units than exist
    return data.unitIdsToRemove.length === data.unitNumbersToRemove.length;
  },
  {
    message: 'Unit IDs and unit numbers must have matching lengths',
  }
);

/**
 * Validation schema for notification scope
 * Determines who should receive notifications for appointment changes
 */
export const AppointmentNotificationScopeSchema = z.object({
  notifyDriver: z.boolean(),
  notifyMovingPartner: z.boolean(),
  notifyCustomer: z.boolean(),
  notificationTypes: z.array(
    z.enum([
      'time_change',
      'plan_change',
      'unit_reduction',
      'driver_reassignment',
      'mover_reassignment',
      'cancellation',
    ])
  ),
  driverIds: z.array(positiveIntSchema).optional(),
  movingPartnerId: positiveIntSchema.nullable().optional(),
  customerId: positiveIntSchema.optional(),
});

/**
 * Validation schema for detailed appointment change information
 * Used by change detection utilities and notification orchestrator
 */
export const AppointmentChangeDetailsSchema = z.object({
  hasChanges: z.boolean(),
  timeChange: z.object({
    changed: z.boolean(),
    oldTime: z.date(),
    newTime: z.date(),
  }).nullable(),
  planChange: z.object({
    changed: z.boolean(),
    oldPlan: z.string(),
    newPlan: z.string(),
    switchType: z.enum(['diy_to_full_service', 'full_service_to_diy']),
  }).nullable(),
  movingPartnerChange: z.object({
    changed: z.boolean(),
    oldMovingPartnerId: z.number().int().nullable(),
    newMovingPartnerId: z.number().int().nullable(),
  }).nullable(),
  storageUnitChange: z.object({
    changed: z.boolean(),
    unitsAdded: z.array(z.number().int()),
    unitsRemoved: z.array(z.number().int()),
    countIncreased: z.boolean(),
    countDecreased: z.boolean(),
  }).nullable(),
  addressChange: z.object({
    changed: z.boolean(),
    oldAddress: z.string(),
    newAddress: z.string(),
    oldZipcode: z.string(),
    newZipcode: z.string(),
  }).nullable(),
});

/**
 * Validation schema for Onfleet task update operations
 * Used by OnfleetTaskUpdateService to validate task update payloads
 */
export const OnfleetTaskUpdatePayloadSchema = z.object({
  notes: z.string().optional(),
  completeAfter: z.number().int().positive().optional(),
  completeBefore: z.number().int().positive().optional(),
  destination: z.object({
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string(),
    }),
    location: z.tuple([z.number(), z.number()]), // [longitude, latitude]
  }).optional(),
  container: z.object({
    type: z.enum(['TEAM', 'WORKER', 'ORGANIZATION']),
    team: z.string().optional(),
    worker: z.string().optional(),
  }).optional(),
  metadata: z.array(
    z.object({
      name: z.string(),
      type: z.enum(['string', 'number', 'boolean']),
      value: z.string(),
      visibility: z.array(z.string()),
    })
  ).optional(),
}).refine(
  (data) => {
    // If container type is TEAM, team must be provided
    if (data.container?.type === 'TEAM' && !data.container?.team) {
      return false;
    }
    // If container type is WORKER, worker must be provided
    if (data.container?.type === 'WORKER' && !data.container?.worker) {
      return false;
    }
    return true;
  },
  {
    message: 'Container must have team ID when type is TEAM, or worker ID when type is WORKER',
  }
);

/**
 * Validation refinement: Ensure unit count doesn't go below 1
 */
export const validateUnitCountNotBelowOne = (data: { numberOfUnits?: number }) => {
  if (data.numberOfUnits !== undefined && data.numberOfUnits < 1) {
    return false;
  }
  return true;
};

export const CreatePackingSupplyOrderRequestSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: emailSchema,
  customerPhone: phoneSchema,
  deliveryAddress: z.string().min(1, 'Delivery address is required'),
  cartItems: z
    .array(
      z.object({
        name: z.string().min(1, 'Item name is required'),
        quantity: positiveIntSchema,
        price: z.number().positive('Price must be positive'),
      })
    )
    .min(1, 'At least one item is required'),
  totalPrice: z.number().positive('Total price must be positive'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  stripePaymentMethodId: z.string().optional(),
  userId: positiveIntSchema.optional(),
  deliveryNotes: z.string().optional(),
});

export const PackingSupplyOrderResponseSchema = z.object({
  success: z.boolean(),
  orderId: positiveIntSchema,
  totalAmount: z.number(),
  estimatedDelivery: z.string(),
  trackingNumber: z.string(),
});

// GET Order Status Schemas
export const GetPackingSupplyOrderStatusRequestSchema = z.object({
  orderId: z.string().optional(),
  taskId: z.string().optional(),
}).refine(
  (data) => data.orderId || data.taskId,
  { message: 'Either orderId or taskId is required' }
);

export const GetPackingSupplyOrderStatusResponseSchema = z.object({
  success: z.boolean(),
  order: z.object({
    id: positiveIntSchema,
    status: z.string(),
    deliveryAddress: z.string(),
    contactName: z.string(),
    contactEmail: z.string(),
    contactPhone: z.string().nullable(),
    deliveryDate: z.date(),
    totalPrice: z.number(),
    onfleetTaskId: z.string().nullable(),
    onfleetTaskShortId: z.string().nullable(),
    deliveryWindowStart: z.date().nullable(),
    deliveryWindowEnd: z.date().nullable(),
    actualDeliveryTime: z.date().nullable(),
    assignedDriver: z.object({
      firstName: z.string(),
      lastName: z.string(),
      phoneNumber: z.string().nullable(),
    }).nullable(),
    orderDetails: z.array(z.object({
      id: positiveIntSchema,
      quantity: positiveIntSchema,
      price: z.number(),
      productId: positiveIntSchema,
    })),
  }),
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

export const DriverAppointmentsRequestSchema = z.object({
  driverId: z.string().or(positiveIntSchema).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
});

export const DriverAppointmentsResponseSchema = z.array(
  z.object({
    id: positiveIntSchema,
    date: z.string(),
    time: z.string(),
    address: z.string(),
    zipcode: z.string().nullable(),
    status: z.string(),
    appointmentType: z.string(),
    bookingDate: z.string(),
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
      profilePicture: z.string().nullable(),
    }).nullable(),
    movingPartner: z.object({
      name: z.string(),
    }).nullable(),
    additionalInfo: z.any().nullable(),
    requestedStorageUnits: z.array(z.object({
      storageUnit: z.any(),
    })),
    onfleetTasks: z.array(z.any()),
  })
);

export const DriverJobsRequestSchema = z.object({
  driverId: z.string().or(positiveIntSchema).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
});

export const DriverJobsResponseSchema = z.array(
  z.object({
    id: positiveIntSchema,
    appointmentType: z.string(),
    address: z.string(),
    date: z.string(),
    time: z.string(),
    numberOfUnits: positiveIntSchema,
    planType: z.string().nullable(),
    insuranceCoverage: z.string().nullable(),
    loadingHelpPrice: z.number().nullable(),
    serviceStartTime: z.string().nullable(),
    serviceEndTime: z.string().nullable(),
    feedback: z.object({
      rating: z.number().min(1).max(5).nullable(),
      comment: z.string().nullable(),
      tipAmount: z.number().nullable(),
    }).nullable(),
    user: z.object({
      firstName: z.string(),
      lastName: z.string(),
    }),
    driver: z.object({
      firstName: z.string(),
      lastName: z.string(),
    }).nullable(),
    requestedStorageUnits: z.array(z.object({
      unitType: z.string(),
      quantity: positiveIntSchema,
    })),
    status: z.string(),
    totalCost: z.number().nullable(),
    notes: z.string().nullable(),
  })
);

export const DriverLicensePhotosRequestSchema = z.object({
  driverId: z.string().or(positiveIntSchema).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
});

export const DriverLicensePhotosResponseSchema = z.object({
  frontPhoto: z.string().nullable(),
  backPhoto: z.string().nullable(),
});

export const DriverMovingPartnerStatusRequestSchema = z.object({
  driverId: z.string().or(positiveIntSchema).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
});

export const DriverMovingPartnerStatusResponseSchema = z.object({
  isLinkedToMovingPartner: z.boolean(),
  movingPartner: z.object({
    id: positiveIntSchema,
    name: z.string(),
  }).nullable(),
});

export const DriverMovingPartnerRequestSchema = z.object({
  driverId: z.string().or(positiveIntSchema).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
});

export const DriverMovingPartnerResponseSchema = z.object({
  movingPartnerId: positiveIntSchema.nullable(),
});

export const DriverPackingSupplyRoutesRequestSchema = z.object({
  driverId: z.string().or(positiveIntSchema).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
});

export const DriverPackingSupplyRoutesResponseSchema = z.array(
  z.object({
    id: positiveIntSchema,
    routeId: z.string(),
    appointmentType: z.string(),
    address: z.string(),
    date: z.string(),
    time: z.string(),
    numberOfUnits: positiveIntSchema,
    planType: z.string(),
    insuranceCoverage: z.null(),
    description: z.string(),
    user: z.null(),
    driver: z.object({
      id: positiveIntSchema,
      firstName: z.string(),
      lastName: z.string(),
      phoneNumber: z.string().nullable(),
      email: z.string(),
    }),
    routeStatus: z.string(),
    totalStops: positiveIntSchema,
    completedStops: nonNegativeIntSchema,
    estimatedMiles: z.number().min(0),
    estimatedDurationMinutes: positiveIntSchema,
    estimatedPayout: z.number().min(0),
    payoutStatus: z.string().nullable(),
    orders: z.array(z.object({
      id: positiveIntSchema,
      deliveryAddress: z.string(),
      contactName: z.string(),
      contactEmail: z.string(),
      contactPhone: z.string(),
      deliveryDate: z.string(),
      totalPrice: z.number(),
      status: z.string(),
      routeStopNumber: positiveIntSchema.nullable(),
      actualDeliveryTime: z.string().nullable(),
      trackingUrl: z.string().nullable(),
      orderDetails: z.array(z.object({
        product: z.object({
          title: z.string(),
          description: z.string().nullable(),
          imageSrc: z.string().nullable(),
        }),
      })),
    })),
    routeMetrics: z.object({
      totalDistance: z.number().min(0),
      totalTime: positiveIntSchema,
      startTime: z.string().nullable(),
      endTime: z.string().nullable(),
    }),
    coordinates: z.null(),
  })
);

export const DriverProfilePictureRequestSchema = z.object({
  driverId: z.string().or(positiveIntSchema).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
});

export const DriverProfilePictureResponseSchema = z.object({
  profilePictureUrl: z.string(),
});

export const DriverRemoveLicensePhotosRequestSchema = z.object({
  driverId: z.string().or(positiveIntSchema).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
  photoType: z.enum(['front', 'back'], {
    errorMap: () => ({ message: 'Valid photoType (front or back) is required' })
  }),
});

export const DriverRemoveLicensePhotosResponseSchema = z.object({
  success: z.boolean(),
});

export const DriverRemoveVehicleRequestSchema = z.object({
  driverId: z.string().or(positiveIntSchema).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
});

export const DriverRemoveVehicleResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const DriverServicesRequestSchema = z.object({
  driverId: z.string().or(positiveIntSchema).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
  services: z.array(z.string()).min(0, 'Services must be an array'),
});

export const DriverServicesResponseSchema = z.object({
  success: z.boolean(),
  driver: z.object({
    id: positiveIntSchema,
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    services: z.array(z.string()),
    // Include other driver fields that might be returned
  }).passthrough(), // Allow additional fields from the driver object
});

export const DriverStripeStatusRequestSchema = z.object({
  driverId: z.string().or(positiveIntSchema).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
  userType: z.enum(['driver', 'mover'], {
    errorMap: () => ({ message: 'Invalid user type. Must be either "driver" or "mover".' })
  }),
});

export const DriverStripeStatusResponseSchema = z.object({
  hasStripeAccount: z.boolean(),
  stripeConnectAccountId: z.string().nullable(),
  onboardingComplete: z.boolean().nullable(),
  payoutsEnabled: z.boolean().nullable(),
  detailsSubmitted: z.boolean().nullable(),
});

export const DriverUploadDriversLicenseRequestSchema = z.object({
  driverId: z.string().or(positiveIntSchema).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
  file: z.any(), // File from FormData
  photoDescription: z.enum(['front', 'back'], {
    errorMap: () => ({ message: 'Invalid or missing photoDescription parameter. Must be "front" or "back"' })
  }),
});

export const DriverUploadDriversLicenseResponseSchema = z.object({
  success: z.boolean(),
  url: z.string(),
  message: z.string(),
});

export const DriverUploadNewInsuranceRequestSchema = z.object({
  driverId: z.string().or(positiveIntSchema).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
  file: z.any(), // File from FormData
});

export const DriverUploadNewInsuranceResponseSchema = z.object({
  success: z.boolean(),
  url: z.string(),
  message: z.string(),
});

export const DriverUploadProfilePictureRequestSchema = z.object({
  driverId: z.string().or(positiveIntSchema).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
  file: z.any(), // File from FormData
});

export const DriverUploadProfilePictureResponseSchema = z.object({
  success: z.boolean(),
  url: z.string(),
  message: z.string(),
});

export const DriverVehicleGetRequestSchema = z.object({
  driverId: z.string().or(positiveIntSchema).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
});

export const DriverVehicleGetResponseSchema = z.object({
  id: positiveIntSchema,
  driverId: positiveIntSchema,
  make: z.string().nullable(),
  model: z.string().nullable(),
  year: z.number().nullable(),
  licensePlate: z.string().nullable(),
  vehicleType: z.string().nullable(),
  frontVehiclePhoto: z.string().nullable(),
  backVehiclePhoto: z.string().nullable(),
  autoInsurancePhoto: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).passthrough(); // Allow additional vehicle fields

export const DriverVehiclePatchRequestSchema = z.object({
  driverId: z.string().or(positiveIntSchema).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
  // Allow any vehicle fields to be updated
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().optional(),
  licensePlate: z.string().optional(),
  vehicleType: z.string().optional(),
}).passthrough(); // Allow additional vehicle fields

export const DriverVehiclePostRequestSchema = z.object({
  driverId: z.string().or(positiveIntSchema).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
  // Required fields for creating a vehicle
  make: z.string().min(1, 'Vehicle make is required'),
  model: z.string().min(1, 'Vehicle model is required'),
  year: z.string().regex(/^\d{4}$/, 'Year must be a 4-digit number').refine(val => parseInt(val) >= 1900 && parseInt(val) <= new Date().getFullYear() + 1, 'Year must be between 1900 and next year'),
  licensePlate: z.string().min(1, 'License plate is required'),
  vehicleType: z.string().optional(), // Optional - not stored in database but may be passed
}).passthrough(); // Allow additional vehicle fields

export const DriverVehicleResponseSchema = z.object({
  id: positiveIntSchema,
  driverId: positiveIntSchema,
  make: z.string().nullable(),
  model: z.string().nullable(),
  year: z.string().nullable(),
  licensePlate: z.string().nullable(),
  vehicleType: z.string().nullable(),
  frontVehiclePhoto: z.string().nullable(),
  backVehiclePhoto: z.string().nullable(),
  autoInsurancePhoto: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).passthrough(); // Allow additional vehicle fields

export const DriverAvailabilityGetRequestSchema = z.object({
  driverId: z.string().or(positiveIntSchema).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
});

export const DriverAvailabilityGetResponseSchema = z.object({
  success: z.boolean(),
  availability: z.array(
    z.object({
      id: positiveIntSchema,
      dayOfWeek: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      isBlocked: z.boolean(),
      maxCapacity: positiveIntSchema,
      createdAt: z.string(),
      updatedAt: z.string(),
    })
  ),
});

export const DriverAvailabilityPostRequestSchema = z.object({
  driverId: z.string().or(positiveIntSchema).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
  id: positiveIntSchema.optional(),
  dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  startTime: timeStringSchema.optional(),
  endTime: timeStringSchema.optional(),
  isBlocked: z.boolean().optional().default(false),
}).refine(
  (data) => data.isBlocked || (data.startTime && data.endTime),
  {
    message: "startTime and endTime are required when not blocked",
    path: ["startTime", "endTime"],
  }
);

export const DriverAvailabilityPostResponseSchema = z.object({
  success: z.boolean(),
  availability: z.object({
    id: positiveIntSchema,
    driverId: positiveIntSchema,
    dayOfWeek: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    isBlocked: z.boolean(),
    maxCapacity: positiveIntSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
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
  success: z.boolean(),
  driverId: positiveIntSchema,
  availableSlots: z.array(
    z.object({
      start: z.string(),
      end: z.string(),
    })
  ),
});

// Driver Management Validation Schemas
export const CreateDriverRequestSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
  phoneProvider: z.string().min(1, 'Phone provider is required'),
  location: z.string().min(1, 'Location is required'),
  services: z.array(z.string()).min(1, 'At least one service is required'),
  vehicleType: z.string().min(1, 'Vehicle type is required'),
  hasTrailerHitch: z.boolean(),
  consentToBackgroundCheck: z.boolean(),
  invitationToken: z.string().optional(),
  createDefaultAvailability: z.boolean().optional()
});

export const ApproveDriverRequestSchema = z.object({
  driverId: positiveIntSchema
});

export const AcceptDriverInvitationRequestSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phoneNumber: z.string().optional(),
  phoneProvider: z.string().min(1, 'Phone provider is required'),
  location: z.string().min(1, 'Location is required'),
  backgroundCheckConsent: z.enum(['Yes', 'No']),
  token: z.string().min(1, 'Invitation token is required')
});

export const DriverInvitationDetailsRequestSchema = z.object({
  token: z.string().min(1, 'Token is required')
});

// Driver Response Types
export const DriverResponseSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phoneNumber: z.string().nullable(),
  status: z.string(),
  isApproved: z.boolean(),
  onfleetWorkerId: z.string().nullable(),
  assignedTeams: z.array(z.string()).optional()
});

export const DriverApprovalResponseSchema = z.object({
  success: z.boolean(),
  driver: DriverResponseSchema.optional(),
  assignedTeams: z.array(z.string()).optional(),
  message: z.string().optional(),
  error: z.string().optional()
});

export const DriverInvitationDetailsResponseSchema = z.object({
  movingPartnerName: z.string(),
  email: z.string()
});

// Type exports
export type DriverAppointmentsRequest = z.infer<typeof DriverAppointmentsRequestSchema>;
export type DriverAppointmentsResponse = z.infer<typeof DriverAppointmentsResponseSchema>;
export type DriverJobsRequest = z.infer<typeof DriverJobsRequestSchema>;
export type DriverJobsResponse = z.infer<typeof DriverJobsResponseSchema>;
export type DriverLicensePhotosRequest = z.infer<typeof DriverLicensePhotosRequestSchema>;
export type DriverLicensePhotosResponse = z.infer<typeof DriverLicensePhotosResponseSchema>;
export type DriverMovingPartnerStatusRequest = z.infer<typeof DriverMovingPartnerStatusRequestSchema>;
export type DriverMovingPartnerStatusResponse = z.infer<typeof DriverMovingPartnerStatusResponseSchema>;
export type DriverMovingPartnerRequest = z.infer<typeof DriverMovingPartnerRequestSchema>;
export type DriverMovingPartnerResponse = z.infer<typeof DriverMovingPartnerResponseSchema>;
export type DriverPackingSupplyRoutesRequest = z.infer<typeof DriverPackingSupplyRoutesRequestSchema>;
export type DriverPackingSupplyRoutesResponse = z.infer<typeof DriverPackingSupplyRoutesResponseSchema>;
export type GetPackingSupplyOrderStatusRequest = z.infer<typeof GetPackingSupplyOrderStatusRequestSchema>;
export type GetPackingSupplyOrderStatusResponse = z.infer<typeof GetPackingSupplyOrderStatusResponseSchema>;
export type DriverProfilePictureRequest = z.infer<typeof DriverProfilePictureRequestSchema>;
export type DriverProfilePictureResponse = z.infer<typeof DriverProfilePictureResponseSchema>;
export type DriverRemoveLicensePhotosRequest = z.infer<typeof DriverRemoveLicensePhotosRequestSchema>;
export type DriverRemoveLicensePhotosResponse = z.infer<typeof DriverRemoveLicensePhotosResponseSchema>;
export type DriverRemoveVehicleRequest = z.infer<typeof DriverRemoveVehicleRequestSchema>;
export type DriverRemoveVehicleResponse = z.infer<typeof DriverRemoveVehicleResponseSchema>;
export type DriverServicesRequest = z.infer<typeof DriverServicesRequestSchema>;
export type DriverServicesResponse = z.infer<typeof DriverServicesResponseSchema>;
export type DriverStripeStatusRequest = z.infer<typeof DriverStripeStatusRequestSchema>;
export type DriverStripeStatusResponse = z.infer<typeof DriverStripeStatusResponseSchema>;
export type DriverUploadDriversLicenseRequest = z.infer<typeof DriverUploadDriversLicenseRequestSchema>;
export type DriverUploadDriversLicenseResponse = z.infer<typeof DriverUploadDriversLicenseResponseSchema>;
export type DriverUploadNewInsuranceRequest = z.infer<typeof DriverUploadNewInsuranceRequestSchema>;
export type DriverUploadNewInsuranceResponse = z.infer<typeof DriverUploadNewInsuranceResponseSchema>;
export type DriverUploadProfilePictureRequest = z.infer<typeof DriverUploadProfilePictureRequestSchema>;
export type DriverUploadProfilePictureResponse = z.infer<typeof DriverUploadProfilePictureResponseSchema>;
export type DriverVehicleGetRequest = z.infer<typeof DriverVehicleGetRequestSchema>;
export type DriverVehicleGetResponse = z.infer<typeof DriverVehicleGetResponseSchema>;
export type DriverVehiclePatchRequest = z.infer<typeof DriverVehiclePatchRequestSchema>;
export type DriverVehiclePostRequest = z.infer<typeof DriverVehiclePostRequestSchema>;
export type DriverVehicleResponse = z.infer<typeof DriverVehicleResponseSchema>;
export type DriverAvailabilityGetRequest = z.infer<typeof DriverAvailabilityGetRequestSchema>;
export type DriverAvailabilityGetResponse = z.infer<typeof DriverAvailabilityGetResponseSchema>;
export type DriverAvailabilityPostRequest = z.infer<typeof DriverAvailabilityPostRequestSchema>;
export type DriverAvailabilityPostResponse = z.infer<typeof DriverAvailabilityPostResponseSchema>;
export type CreateDriverRequest = z.infer<typeof CreateDriverRequestSchema>;
export type ApproveDriverRequest = z.infer<typeof ApproveDriverRequestSchema>;
export type AcceptDriverInvitationRequest = z.infer<typeof AcceptDriverInvitationRequestSchema>;
export type DriverInvitationDetailsRequest = z.infer<typeof DriverInvitationDetailsRequestSchema>;
export type DriverResponse = z.infer<typeof DriverResponseSchema>;
export type DriverApprovalResponse = z.infer<typeof DriverApprovalResponseSchema>;
export type DriverInvitationDetailsResponse = z.infer<typeof DriverInvitationDetailsResponseSchema>;

// ===== DRIVER BLOCKED DATES SCHEMAS =====

export const CreateDriverBlockedDateRequestSchema = z.object({
  blockedDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid date format'
  )
});

export const DriverBlockedDatesGetRequestSchema = z.object({
  driverId: z.string().or(positiveIntSchema).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
});

export const DriverBlockedDatesResponseSchema = z.array(
  z.object({
    id: positiveIntSchema,
    userId: positiveIntSchema,
    userType: z.string(),
    blockedDate: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
);

export const DeleteDriverBlockedDateRequestSchema = z.object({
  driverId: z.string().or(positiveIntSchema).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
  dateId: z.string().or(positiveIntSchema).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
});

export const DeleteDriverBlockedDateResponseSchema = z.object({
  success: z.boolean(),
});

// Admin Drivers List Schema
export const AdminDriversListResponseSchema = z.array(
  z.object({
    id: positiveIntSchema,
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    phoneNumber: z.string().nullable(),
    verifiedPhoneNumber: z.boolean(),
    services: z.array(z.string()),
    isApproved: z.boolean(),
    applicationComplete: z.boolean(),
    onfleetWorkerId: z.string().nullable(),
    onfleetTeamIds: z.array(z.string()),
    driverLicenseFrontPhoto: z.string().nullable(),
    driverLicenseBackPhoto: z.string().nullable(),
    profilePicture: z.string().nullable(),
    status: z.string(),
    location: z.string().nullable(),
    vehicleType: z.string().nullable(),
    hasTrailerHitch: z.boolean().nullable(),
    consentToBackgroundCheck: z.boolean().nullable(),
    movingPartnerAssociations: z.array(z.object({
      movingPartner: z.object({
        name: z.string(),
        onfleetTeamId: z.string().nullable(),
      })
    })),
    vehicles: z.array(z.object({
      id: positiveIntSchema,
      make: z.string().nullable(),
      model: z.string().nullable(),
      year: z.number().nullable(),
      licensePlate: z.string().nullable(),
      isApproved: z.boolean(),
    })),
    availability: z.array(z.object({
      id: positiveIntSchema,
      dayOfWeek: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      maxCapacity: positiveIntSchema,
    })),
    cancellations: z.array(z.object({
      id: positiveIntSchema,
      cancellationReason: z.string().nullable(),
      cancellationDate: z.string(),
    })),
    assignedTasks: z.array(z.object({
      id: positiveIntSchema,
      appointmentId: positiveIntSchema,
      appointment: z.object({
        id: positiveIntSchema,
        date: z.string(),
        status: z.string(),
        jobCode: z.string().nullable(),
        user: z.object({
          firstName: z.string(),
          lastName: z.string(),
        })
      })
    }))
  })
);

// Type exports for blocked dates schemas
export type CreateDriverBlockedDateRequest = z.infer<typeof CreateDriverBlockedDateRequestSchema>;
export type DriverBlockedDatesGetRequest = z.infer<typeof DriverBlockedDatesGetRequestSchema>;
export type DriverBlockedDatesResponse = z.infer<typeof DriverBlockedDatesResponseSchema>;
export type DeleteDriverBlockedDateRequest = z.infer<typeof DeleteDriverBlockedDateRequestSchema>;
export type DeleteDriverBlockedDateResponse = z.infer<typeof DeleteDriverBlockedDateResponseSchema>;
export type AdminDriversListResponse = z.infer<typeof AdminDriversListResponseSchema>;

// ===== DRIVER PROFILE MANAGEMENT SCHEMAS =====

export const DriverProfileUpdateRequestSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Valid email is required').optional(),
  phoneNumber: z.string().min(10, 'Valid phone number is required').optional(),
  location: z.string().min(1, 'Location is required').optional(),
  services: z.array(z.string()).min(1, 'At least one service is required').optional(),
  vehicleType: z.string().min(1, 'Vehicle type is required').optional(),
  hasTrailerHitch: z.boolean().optional(),
  // Allow other driver fields to be updated
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const DriverProfileResponseSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phoneNumber: z.string().nullable(),
  location: z.string().nullable(),
  services: z.array(z.string()),
  vehicleType: z.string().nullable(),
  hasTrailerHitch: z.boolean().nullable(),
  status: z.string(),
  isApproved: z.boolean(),
  onfleetWorkerId: z.string().nullable(),
  onfleetTeamIds: z.array(z.string()),
  verifiedPhoneNumber: z.boolean(),
  activeMessageShown: z.boolean(),
  vehicles: z.array(z.object({
    id: z.number(),
    make: z.string().nullable(),
    model: z.string().nullable(),
    // year can be number or string (from DB) - coerce to handle both
    year: z.union([z.number(), z.string()]).nullable(),
    licensePlate: z.string().nullable(),
    // vehicleType can be null or undefined
    vehicleType: z.string().nullish()
  })).optional(),
  movingPartnerAssociations: z.array(z.object({
    id: z.number(),
    isActive: z.boolean(),
    movingPartner: z.object({
      id: z.number(),
      name: z.string()
    })
  })).optional()
});

export const AgreeToTermsRequestSchema = z.object({
  // No additional fields needed - the driverId comes from URL params
});

export const AgreeToTermsResponseSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  agreedToTerms: z.boolean(),
  agreedToTermsAt: z.date().nullable()
});

export const ApplicationCompleteRequestSchema = z.object({
  // No additional fields needed - the driverId comes from URL params  
});

export const ApplicationCompleteResponseSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  applicationComplete: z.boolean()
});

// Type exports for new schemas
export type DriverProfileUpdateRequest = z.infer<typeof DriverProfileUpdateRequestSchema>;
export type DriverProfileResponse = z.infer<typeof DriverProfileResponseSchema>;
export type AgreeToTermsRequest = z.infer<typeof AgreeToTermsRequestSchema>;
export type AgreeToTermsResponse = z.infer<typeof AgreeToTermsResponseSchema>;
export type ApplicationCompleteRequest = z.infer<typeof ApplicationCompleteRequestSchema>;
export type ApplicationCompleteResponse = z.infer<typeof ApplicationCompleteResponseSchema>;

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

export const UpdateMovingPartnerProfileRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(), 
  email: emailSchema.optional(),
  phoneNumber: phoneSchema.optional(),
  hourlyRate: z.number().positive('Hourly rate must be positive').optional(),
  website: z.string().url('Invalid website URL').optional(),
});

export const MovingPartnerProfileResponseSchema = z.object({
  id: positiveIntSchema,
  name: z.string(),
  description: z.string().nullable(),
  email: z.string(),
  phoneNumber: z.string(),
  hourlyRate: z.number().nullable(),
  website: z.string().nullable(),
  status: z.string(),
  isApproved: z.boolean(),
  onfleetTeamId: z.string().nullable(),
  verifiedPhoneNumber: z.boolean(),
  activeMessageShown: z.boolean(),
  vehicles: z.array(z.object({
    id: positiveIntSchema,
    isApproved: z.boolean(),
  })),
  approvedDrivers: z.array(z.object({
    driver: z.object({
      id: positiveIntSchema,
      isApproved: z.boolean(),
      status: z.string(),
    }),
  })),
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

// Admin Dashboard Data Response Schema
// @source boombox-10.0/src/app/api/admin/dashboard/route.ts (response structure)
export const AdminDashboardDataResponseSchema = z.object({
  jobsToday: z.object({
    Scheduled: nonNegativeIntSchema,
    'In Transit': nonNegativeIntSchema, 
    'Loading Complete': nonNegativeIntSchema,
    'Admin Check': nonNegativeIntSchema,
    Complete: nonNegativeIntSchema,
  }),
  awaitingApprovals: z.object({
    drivers: nonNegativeIntSchema,
    movers: nonNegativeIntSchema,
    vehicles: nonNegativeIntSchema,
  }),
  taskCounts: z.object({
    unassignedJobs: nonNegativeIntSchema,
    negativeFeedback: nonNegativeIntSchema,
    pendingCleaning: nonNegativeIntSchema,
    adminCheck: nonNegativeIntSchema,
    storageUnitNeeded: nonNegativeIntSchema,
  }),
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

// Admin Query AI Schemas
// @source boombox-10.0/src/app/api/ai/query-ai/route.ts
export const AdminQueryAIRequestSchema = z.object({
  query: z.string().min(1, 'Query is required').max(1000, 'Query too long'),
});

export const AdminQueryAIResponseSchema = z.object({
  sql: z.string(),
  results: z.array(z.record(z.any())),
});

// Storage Units Admin Route Schemas
// @source boombox-10.0/src/app/api/admin/storage-units/route.ts
export const StorageUnitsListRequestSchema = z.object({
  status: z.string().optional(),
  sortBy: z.string().optional().default('storageUnitNumber'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const StorageUnitUpdateRequestSchema = z.object({
  id: positiveIntSchema,
  status: z.string().optional(),
  usageId: positiveIntSchema.optional(),
  warehouseLocation: z.string().optional(),
  warehouseName: z.string().optional(),
}).refine(
  (data) => data.status || (data.usageId && (data.warehouseLocation !== undefined || data.warehouseName !== undefined)),
  {
    message: "Either status or warehouse information (usageId + location/name) must be provided",
  }
);

// Storage Units Batch Upload Schema
// @source boombox-10.0/src/app/api/admin/storage-units/batch-upload/route.ts
export const StorageUnitCSVRecordSchema = z.object({
  storageUnitNumber: z.string().min(1, 'Storage unit number is required'),
  barcode: z.string().optional(),
  status: z.enum(['Empty', 'Occupied', 'Pending Cleaning'], {
    errorMap: () => ({ message: 'Status must be Empty, Occupied, or Pending Cleaning' })
  }),
});

export const BatchUploadResponseSchema = z.object({
  success: z.boolean(),
  results: z.object({
    successful: nonNegativeIntSchema,
    failed: nonNegativeIntSchema,
    details: z.object({
      success: z.array(z.string()),
      errors: z.array(z.string()),
    }),
  }),
});

// Storage Unit Photo Upload Schema
// @source boombox-10.0/src/app/api/storage-unit/[id]/upload-photos/route.ts
export const StorageUnitPhotoUploadRequestSchema = z.object({
  id: positiveIntSchema,
});

export const StorageUnitPhotoUploadResponseSchema = z.object({
  success: z.boolean(),
  uploadedUrls: z.array(z.string().url()),
  message: z.string(),
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

export const AdminNotifyNoDriverRequestSchema = z.object({
  routeId: z.string().min(1, 'Route ID is required'),
  deliveryDate: z.string().min(1, 'Delivery date is required'),
  totalStops: z.number().int().min(0).optional(),
  reason: z.string().optional(),
  source: z.string().optional(),
  additionalInfo: z.string().optional(),
});

// Admin Delivery Routes Schema
// @source boombox-10.0/src/app/api/admin/delivery-routes/route.ts
export const AdminDeliveryRoutesRequestSchema = z.object({
  date: z.string().datetime().optional(),
});

export const AdminDeliveryRoutesResponseSchema = z.array(
  z.object({
    id: positiveIntSchema,
    routeId: z.string(),
    driverId: positiveIntSchema.nullable(),
    deliveryDate: z.date(),
    totalStops: nonNegativeIntSchema,
    completedStops: nonNegativeIntSchema,
    routeStatus: z.string(),
    totalDistance: z.string().nullable(),
    totalTime: nonNegativeIntSchema.nullable(),
    startTime: z.date().nullable(),
    endTime: z.date().nullable(),
    payoutAmount: z.string().nullable(),
    payoutStatus: z.string(),
    payoutTransferId: z.string().nullable(),
    payoutProcessedAt: z.date().nullable(),
    payoutFailureReason: z.string().nullable(),
    onfleetOptimizationId: z.string().nullable(),
    driverOfferSentAt: z.date().nullable(),
    driverOfferExpiresAt: z.date().nullable(),
    driverOfferStatus: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    driver: z.object({
      id: positiveIntSchema,
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      phoneNumber: z.string().nullable(),
      profilePicture: z.string().nullable(),
    }).nullable(),
    orders: z.array(
      z.object({
        id: positiveIntSchema,
        userId: positiveIntSchema,
        deliveryAddress: z.string(),
        contactName: z.string(),
        contactEmail: z.string().email(),
        contactPhone: z.string().nullable(),
        orderDate: z.date(),
        deliveryDate: z.date(),
        totalPrice: z.string(),
        status: z.string(),
        paymentMethod: z.string(),
        paymentStatus: z.string(),
        stripePaymentIntentId: z.string().nullable(),
        onfleetTaskId: z.string().nullable(),
        onfleetTaskShortId: z.string().nullable(),
        assignedDriverId: positiveIntSchema.nullable(),
        deliveryWindowStart: z.date().nullable(),
        deliveryWindowEnd: z.date().nullable(),
        actualDeliveryTime: z.date().nullable(),
        deliveryPhotoUrl: z.string().nullable(),
        driverPayoutAmount: z.string().nullable(),
        driverPayoutStatus: z.string().nullable(),
        routeMetrics: z.string().nullable(),
        routeStopNumber: nonNegativeIntSchema.nullable(),
        trackingToken: z.string().nullable(),
        trackingUrl: z.string().nullable(),
        batchProcessedAt: z.date().nullable(),
        optimizationJobId: z.string().nullable(),
        user: z.object({
          id: positiveIntSchema,
          firstName: z.string(),
          lastName: z.string(),
          email: z.string().email(),
          phoneNumber: z.string().nullable(),
        }),
        orderDetails: z.array(
          z.object({
            id: positiveIntSchema,
            productId: positiveIntSchema,
            quantity: nonNegativeIntSchema,
            price: z.string(),
            product: z.object({
              id: positiveIntSchema,
              title: z.string(),
              description: z.string().nullable(),
              category: z.string(),
              imageSrc: z.string().nullable(),
            }),
          })
        ),
        cancellations: z.array(
          z.object({
            id: positiveIntSchema,
            cancellationReason: z.string().nullable(),
            cancellationFee: z.string().nullable(),
            cancellationDate: z.date(),
            refundAmount: z.string().nullable(),
            refundStatus: z.string().nullable(),
            adminNotes: z.string().nullable(),
          })
        ),
        feedback: z.array(
          z.object({
            id: positiveIntSchema,
            rating: nonNegativeIntSchema.nullable(),
            comment: z.string().nullable(),
            tipAmount: z.string().nullable(),
            tipPaymentIntentId: z.string().nullable(),
            tipPaymentStatus: z.string().nullable(),
            driverRating: nonNegativeIntSchema.nullable(),
            responded: z.boolean(),
            response: z.string().nullable(),
            createdAt: z.date(),
            updatedAt: z.date(),
          })
        ),
      })
    ),
  })
);

// ===== ADMIN TASKS SCHEMAS =====
// @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (refactored for domain separation)

// Assign Storage Unit Task Schemas
export const AssignStorageUnitParamsSchema = z.object({
  appointmentId: z.string().transform((val) => parseInt(val, 10)),
});

export const AssignStorageUnitRequestSchema = z.object({
  storageUnitNumbers: z.array(z.string().min(1, 'Storage unit number is required')),
  driverMatches: z.boolean(),
  trailerPhotos: z.array(z.string()).optional(),
  unitIndex: z.number().int().positive(),
});

export const AssignStorageUnitResponseSchema = z.object({
  id: z.string(),
  title: z.literal('Assign Storage Unit'),
  description: z.string(),
  action: z.literal('Assign'),
  color: z.literal('orange'),
  details: z.string(),
  jobCode: z.string(),
  appointmentDate: z.string(),
  appointmentAddress: z.string(),
  unitIndex: z.number().optional(),
  storageTotalUnits: z.number(),
});

// Common Admin Task Response Schema
export const BaseAdminTaskResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  action: z.string(),
  color: z.enum(['rose', 'amber', 'cyan', 'orange', 'indigo', 'purple', 'emerald', 'sky', 'darkAmber']),
  details: z.string(),
});

// Admin Task Assignment Success Response
export const AdminTaskAssignmentSuccessSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  usages: z.array(z.any()).optional(),
});

// Unassigned Driver Task Schemas
export const UnassignedDriverParamsSchema = z.object({
  appointmentId: z.string().transform((val) => parseInt(val, 10)),
});

export const UnassignedDriverRequestSchema = z.object({
  calledMovingPartner: z.boolean(),
  gotHoldOfMovingPartner: z.boolean().optional(),
});

export const UnassignedDriverResponseSchema = z.object({
  id: z.string(),
  title: z.literal('Unassigned Driver'),
  description: z.string(),
  action: z.literal('Remind Mover'),
  color: z.literal('rose'),
  details: z.string(),
  movingPartner: z.object({
    name: z.string(),
    email: z.string(),
    phoneNumber: z.string(),
    imageSrc: z.string().nullable(),
  }).nullable(),
  jobCode: z.string(),
  appointmentDate: z.string(),
  appointmentAddress: z.string(),
  calledMovingPartner: z.boolean().nullable(),
  onfleetTaskIds: z.string().optional(),
  customerName: z.string(),
});

// Storage Unit Return Task Schemas
export const StorageUnitReturnParamsSchema = z.object({
  appointmentId: z.string().transform((val) => parseInt(val, 10)),
});

export const StorageUnitReturnRequestSchema = z.object({
  hasDamage: z.boolean(),
  damageDescription: z.string().nullable().optional(),
  frontPhotos: z.array(z.string()),
  backPhotos: z.array(z.string()),
  isStillStoringItems: z.boolean().optional(),
  isAllItemsRemoved: z.boolean().optional(),
  isUnitEmpty: z.boolean().optional(),
});

export const StorageUnitReturnResponseSchema = z.object({
  id: z.string(),
  title: z.literal('Storage Unit Return'),
  description: z.string(),
  action: z.literal('Process Return'),
  color: z.literal('purple'),
  details: z.string(),
  movingPartner: z.object({
    name: z.string(),
    email: z.string(),
    phoneNumber: z.string(),
    imageSrc: z.string().nullable(),
  }).nullable(),
  jobCode: z.string(),
  customerName: z.string(),
  appointmentDate: z.string(),
  appointmentAddress: z.string(),
  storageUnitNumber: z.string(),
  appointmentId: z.string(),
  storageUnitId: z.string().optional(),
  appointment: z.object({
    date: z.string(),
    appointmentType: z.string(),
    user: z.object({
      firstName: z.string(),
      lastName: z.string(),
    }).nullable(),
  }),
});

// Assign Requested Unit Task Schemas
export const AssignRequestedUnitParamsSchema = z.object({
  appointmentId: z.string().transform((val) => parseInt(val, 10)),
});

export const AssignRequestedUnitRequestSchema = z.object({
  storageUnitId: z.number().int().positive(),
  driverMatches: z.boolean(),
  trailerPhotos: z.array(z.string()).optional(),
  unitIndex: z.number().int().positive(),
});

export const AssignRequestedUnitResponseSchema = z.object({
  id: z.string(),
  title: z.literal('Assign Requested Unit'),
  description: z.string(),
  action: z.literal('Assign'),
  color: z.literal('indigo'),
  details: z.string(),
  jobCode: z.string(),
  appointmentDate: z.string(),
  appointmentAddress: z.string(),
  storageUnitNumber: z.string(),
  unitIndex: z.number().int().positive(),
  requestedTotalUnits: z.number().int().positive(),
});

// Negative Feedback Task Schemas
export const NegativeFeedbackParamsSchema = z.object({
  feedbackId: z.string().transform((val) => parseInt(val, 10)),
});

export const NegativeFeedbackRequestSchema = z.object({
  emailSubject: z.string().min(1, 'Email subject is required'),
  emailBody: z.string().min(1, 'Email body is required'),
  feedbackType: z.enum(['regular', 'packing-supply']).optional(),
});

export const NegativeFeedbackResponseSchema = z.object({
  id: z.string(),
  title: z.enum(['Negative Feedback', 'Negative Packing Supply Feedback']),
  description: z.string(),
  action: z.literal('Respond'),
  color: z.literal('amber'),
  details: z.string(),
  feedback: z.object({
    id: z.number(),
    rating: z.number(),
    comment: z.string().nullable(),
  }),
  jobCode: z.string(),
  appointment: z.object({
    date: z.string(),
    appointmentType: z.string(),
    user: z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string(),
    }),
  }),
});

// Pending Cleaning Task Schemas
export const PendingCleaningParamsSchema = z.object({
  storageUnitId: z.string().transform((val) => parseInt(val, 10)),
});

export const PendingCleaningRequestSchema = z.object({
  photos: z.array(z.string()).min(1, 'At least one photo is required'),
});

export const PendingCleaningResponseSchema = z.object({
  id: z.string(),
  title: z.literal('Pending Cleaning'),
  description: z.string(),
  action: z.literal('Mark as Clean'),
  color: z.literal('cyan'),
  details: z.string(),
  storageUnitNumber: z.string(),
});

// Prep Packing Supply Order Task Schemas
export const PrepPackingSupplyOrderParamsSchema = z.object({
  orderId: z.string().transform((val) => parseInt(val, 10)),
});

export const PrepPackingSupplyOrderRequestSchema = z.object({
  isPrepped: z.boolean().default(true),
});

export const PrepPackingSupplyOrderResponseSchema = z.object({
  id: z.string(),
  title: z.literal('Prep Packing Supply Order'),
  description: z.string(),
  action: z.literal('Mark as Prepped'),
  color: z.literal('darkAmber'),
  details: z.string(),
  customerName: z.string(),
  deliveryAddress: z.string(),
  driverName: z.string(),
  onfleetTaskShortId: z.string().nullable(),
  packingSupplyOrder: z.object({
    id: z.number(),
    contactName: z.string(),
    contactEmail: z.string(),
    contactPhone: z.string().nullable(),
    deliveryAddress: z.string(),
    deliveryDate: z.date(),
    totalPrice: z.number(),
    onfleetTaskShortId: z.string().nullable(),
    assignedDriver: z.object({
      firstName: z.string(),
      lastName: z.string(),
    }).nullable(),
    orderDetails: z.array(z.object({
      id: z.number(),
      quantity: z.number(),
      product: z.object({
        title: z.string(),
      }),
    })),
  }),
});

// Prep Units Delivery Task Schemas
export const PrepUnitsDeliveryParamsSchema = z.object({
  appointmentId: z.string().transform((val) => parseInt(val, 10)),
});

export const PrepUnitsDeliveryRequestSchema = z.object({
  unitNumbers: z.array(z.string()).min(1, 'At least one unit number is required'),
});

export const PrepUnitsDeliveryResponseSchema = z.object({
  id: z.string(),
  title: z.literal('Prep Units for Delivery'),
  description: z.string(),
  action: z.literal('Mark Complete'),
  color: z.literal('sky'),
  details: z.string(),
  jobCode: z.string(),
  customerName: z.string(),
  appointmentDate: z.string(),
  appointmentAddress: z.string(),
  requestedStorageUnits: z.array(z.object({
    id: z.number(),
    storageUnitId: z.number(),
    unitsReady: z.boolean(),
    storageUnit: z.object({
      id: z.number(),
      storageUnitNumber: z.string(),
    }),
  })),
});

// Update Location Task Schemas
export const UpdateLocationParamsSchema = z.object({
  usageId: z.string().transform((val) => parseInt(val, 10)),
});

export const UpdateLocationRequestSchema = z.object({
  warehouseLocation: z.string().min(1, 'Warehouse location is required'),
});

export const UpdateLocationResponseSchema = z.object({
  id: z.string(),
  title: z.literal('Update Location'),
  description: z.string(),
  action: z.literal('Update'),
  color: z.literal('emerald'),
  details: z.string(),
  storageUnitNumber: z.string(),
  customerName: z.string(),
  usageId: z.number(),
});

// Admin Task Listing Schemas
export const AdminTaskListingResponseSchema = z.object({
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    details: z.string(),
    action: z.string(),
    actionUrl: z.string().optional(),
    color: z.string(),
  })),
  summary: z.object({
    total: z.number(),
    byType: z.record(z.string(), z.number()),
  }),
});

export const AdminTaskStatisticsResponseSchema = z.object({
  totalTasks: z.number(),
  criticalTasks: z.number(),
  urgentTasks: z.number(),
  tasksByType: z.record(z.string(), z.number()),
  lastUpdated: z.string(),
});

// ===== NOTIFICATION SCHEMAS =====

// Get Notifications Request Schema
export const GetNotificationsRequestSchema = z.object({
  recipientId: z.string().transform(val => parseInt(val, 10)),
  recipientType: z.enum(['USER', 'DRIVER', 'MOVER', 'ADMIN']),
  page: z.string().transform(val => parseInt(val, 10)).optional().default('1'),
  limit: z.string().transform(val => parseInt(val, 10)).optional().default('5'),
  status: z.string().optional(),
});

// Create Notification Request Schema
export const CreateNotificationRequestSchema = z.object({
  recipientId: positiveIntSchema,
  recipientType: z.enum(['USER', 'DRIVER', 'MOVER', 'ADMIN']),
  type: z.string().min(1, 'Type is required'), // Will be cast to NotificationType in utils
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  appointmentId: positiveIntSchema.optional(),
  orderId: positiveIntSchema.optional(),
  routeId: z.union([z.string(), positiveIntSchema]).optional(),
  taskId: z.union([z.string(), positiveIntSchema]).optional(),
  driverId: positiveIntSchema.optional(),
  movingPartnerId: positiveIntSchema.optional(),
  groupKey: z.string().optional(),
});

// Get Notifications Response Schema
export const GetNotificationsResponseSchema = z.object({
  notifications: z.array(z.any()),
  pagination: z.object({
    page: positiveIntSchema,
    limit: positiveIntSchema,
    total: nonNegativeIntSchema,
    totalPages: nonNegativeIntSchema,
    hasMore: z.boolean(),
  }),
  unreadCount: nonNegativeIntSchema,
});

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
    categories: z.array(z.string()).optional(),
    photos: z.array(z.string()).optional(),
    tipAmount: z.number().min(0).optional(),
    driverRatings: z
      .record(z.string(), z.enum(['thumbs_up', 'thumbs_down']))
      .optional(),
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
    'packing_supply_route_assignment',
  ]),
  parameters: z.record(z.any()).optional(),
});

export const CronJobResponseSchema = z.object({
  success: z.boolean(),
  jobId: z.string(),
  executionTime: z.string(),
  results: z.any(),
});

// Packing Supply Route Assignment Cron Schema
export const PackingSupplyRouteAssignmentCronRequestSchema = z.object({
  targetDate: z.string().optional(),
  dryRun: z.boolean().optional().default(false),
  forceOptimization: z.boolean().optional().default(false),
});

export const PackingSupplyRouteAssignmentCronResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  summary: z.object({
    targetDate: z.string(),
    dryRun: z.boolean(),
    ordersProcessed: z.number().int().min(0),
    routesCreated: z.number().int().min(0),
    driverOffersSuccessful: z.number().int().min(0),
    driverOffersFailed: z.number().int().min(0),
  }),
  details: z.object({
    optimization: z.any(),
    driverOffers: z.array(z.object({
      routeId: z.string(),
      success: z.boolean(),
      driverName: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    })),
  }),
});

// Daily Dispatch Cron Schema
export const DailyDispatchCronRequestSchema = z.object({
  targetDate: z.string().optional(),
  dryRun: z.boolean().optional().default(false),
  forceDispatch: z.boolean().optional().default(false),
});

export const DailyDispatchCronResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    dispatchId: z.string(),
    targetDate: z.string(),
    dryRun: z.boolean(),
    tasksDispatched: z.number().int().min(0),
    teamId: z.string(),
    teamName: z.string(),
  }).optional(),
  executionTime: z.number().int().min(0),
});

// Driver Assignment Cron Schema
export const DriverAssignCronRequestSchema = z.object({
  // No parameters needed - this is a simple GET endpoint that processes expired assignments
});

export const DriverAssignCronResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  results: z.array(z.object({
    appointmentId: z.number(),
    status: z.enum(['retried', 'error']),
    tasksRetried: z.number().int().min(0).optional(),
    error: z.string().optional(),
  })),
  appointmentsProcessed: z.number().int().min(0),
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
  movingPartnerId: z.string().or(positiveIntSchema).nullable().optional(),
  thirdPartyMovingPartnerId: z.string().or(positiveIntSchema).nullable().optional(),
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
// Note: Onfleet sends null for fields when task is in progress (not yet completed)
const WebhookCompletionDetailsSchema = z.object({
  photoUploadId: z.string().nullable().optional(),
  photoUploadIds: z.array(z.string()).nullable().optional(),
  unavailableAttachments: z.array(z.object({
    attachmentType: z.string(),
    attachmentId: z.string().optional()
  })).nullable().optional(),
  drivingDistance: z.number().nullable().optional(),
  drivingTime: z.number().nullable().optional(),
  time: z.number().nullable().optional()
});

// Webhook task details
// Note: Onfleet can send estimatedArrivalTime as string (ISO), number (timestamp), or null
// Worker can be a string (worker ID) or an object with worker details
const WebhookTaskDetailsSchema = z.object({
  shortId: z.string(),
  estimatedArrivalTime: z.union([z.string(), z.number()]).nullable().optional(),
  trackingURL: z.string().nullable().optional(),
  completionDetails: WebhookCompletionDetailsSchema.nullable().optional(),
  metadata: z.array(z.object({
    name: z.string(),
    value: z.union([z.string(), z.number(), z.boolean(), z.null()])
  })).nullable().optional(),
  worker: z.union([
    z.string(), // Worker ID when task is assigned
    z.object({
      name: z.string().optional()
    })
  ]).nullable().optional()
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

// ===== MOVING PARTNERS MIGRATION SCHEMAS =====

export const CreateMoverRequestSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  email: emailSchema,
  phoneNumber: phoneSchema,
  website: z.string().url('Valid website URL is required'),
  employeeCount: positiveIntSchema,
  createDefaultAvailability: z.boolean().optional().default(false)
});

export const CreateMoverResponseSchema = z.object({
  success: z.boolean(),
  mover: z.object({
    id: positiveIntSchema,
    name: z.string(),
    email: emailSchema,
    phoneNumber: phoneSchema,
    website: z.string(),
    numberOfEmployees: positiveIntSchema,
    isApproved: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date()
  }).optional()
});

export const SearchMovingPartnersRequestSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format'),
  excludeAppointmentId: z.string().or(positiveIntSchema).optional()
});

export const SearchMovingPartnersResponseSchema = z.array(z.object({
  id: positiveIntSchema,
  name: z.string(),
  email: emailSchema,
  phoneNumber: phoneSchema,
  status: z.string(),
  availability: z.array(z.object({
    id: positiveIntSchema,
    dayOfWeek: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    maxCapacity: positiveIntSchema,
    isBlocked: z.boolean()
  }))
}));

// Type exports for migration schemas
export type CreateMoverRequest = z.infer<typeof CreateMoverRequestSchema>;
export type CreateMoverResponse = z.infer<typeof CreateMoverResponseSchema>;
export type SearchMovingPartnersRequest = z.infer<typeof SearchMovingPartnersRequestSchema>;
export type SearchMovingPartnersResponse = z.infer<typeof SearchMovingPartnersResponseSchema>;
export type UpdateMovingPartnerProfileRequest = z.infer<typeof UpdateMovingPartnerProfileRequestSchema>;
export type MovingPartnerProfileResponse = z.infer<typeof MovingPartnerProfileResponseSchema>;

export const MovingPartnerDriversListResponseSchema = z.array(z.object({
  id: positiveIntSchema,
  firstName: z.string(),
  lastName: z.string(), 
  email: z.string(),
  phoneNumber: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  isApproved: z.boolean(),
}));

export const UpdateMovingPartnerDriverStatusRequestSchema = z.object({
  driverId: positiveIntSchema,
  isActive: z.boolean(),
});

export const UpdateMovingPartnerDriverStatusResponseSchema = z.object({
  id: positiveIntSchema,
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phoneNumber: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export type MovingPartnerDriversListResponse = z.infer<typeof MovingPartnerDriversListResponseSchema>;
export type UpdateMovingPartnerDriverStatusRequest = z.infer<typeof UpdateMovingPartnerDriverStatusRequestSchema>;
export type UpdateMovingPartnerDriverStatusResponse = z.infer<typeof UpdateMovingPartnerDriverStatusResponseSchema>;

// Moving Partner Availability Schemas
export const MovingPartnerAvailabilityGetResponseSchema = z.object({
  success: z.boolean(),
  availability: z.array(
    z.object({
      id: positiveIntSchema,
      dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
      startTime: z.string(),
      endTime: z.string(),
      isBlocked: z.boolean(),
      maxCapacity: positiveIntSchema,
      createdAt: z.string(),
      updatedAt: z.string(),
    })
  ),
});

export const MovingPartnerAvailabilityPostRequestSchema = z.object({
  id: positiveIntSchema.optional(),
  dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  isBlocked: z.boolean().optional().default(false),
  maxCapacity: z.number().int().min(1, 'Job capacity must be at least 1').max(10, 'Job capacity must be at most 10').optional().default(1),
});

export const MovingPartnerAvailabilityPostResponseSchema = z.object({
  success: z.boolean(),
  availability: z.object({
    id: positiveIntSchema,
    dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
    startTime: z.string(),
    endTime: z.string(),
    isBlocked: z.boolean(),
    maxCapacity: positiveIntSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

export type MovingPartnerAvailabilityGetResponse = z.infer<typeof MovingPartnerAvailabilityGetResponseSchema>;
export type MovingPartnerAvailabilityPostRequest = z.infer<typeof MovingPartnerAvailabilityPostRequestSchema>;
export type MovingPartnerAvailabilityPostResponse = z.infer<typeof MovingPartnerAvailabilityPostResponseSchema>;

// ===== MOVING PARTNER FILE UPLOAD SCHEMAS =====

export const MovingPartnerJobsRequestSchema = z.object({
  id: z.string().or(positiveIntSchema),
});

export const MovingPartnerJobsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.object({
    id: z.number(),
    appointmentType: z.string(),
    address: z.string(),
    date: z.string(),
    time: z.string(),
    numberOfUnits: z.number(),
    planType: z.string(),
    insuranceCoverage: z.number(),
    loadingHelpPrice: z.number(),
    serviceStartTime: z.string().nullable(),
    serviceEndTime: z.string().nullable(),
    feedback: z.object({
      rating: z.number(),
      comment: z.string(),
      tipAmount: z.number(),
    }).nullable(),
    user: z.object({
      firstName: z.string(),
      lastName: z.string(),
    }),
    driver: z.object({
      firstName: z.string(),
      lastName: z.string(),
    }).nullable(),
    requestedStorageUnits: z.array(z.object({
      unitType: z.string(),
      quantity: z.number(),
    })),
    status: z.string(),
    totalCost: z.number(),
    notes: z.string().nullable(),
  })),
});

export const MovingPartnerUploadInsuranceRequestSchema = z.object({
  id: z.string().or(positiveIntSchema),
  file: z.any(), // File from FormData
});

export const MovingPartnerUploadInsuranceResponseSchema = z.object({
  success: z.boolean(),
  url: z.string(),
  message: z.string(),
});

export const MovingPartnerUploadProfilePictureRequestSchema = z.object({
  id: z.string().or(positiveIntSchema),
  file: z.any(), // File from FormData
});

export const MovingPartnerUploadProfilePictureResponseSchema = z.object({
  success: z.boolean(),
  url: z.string(),
  message: z.string(),
});

export const MovingPartnerUploadVehiclePhotosRequestSchema = z.object({
  id: z.string().or(positiveIntSchema),
  file: z.any(), // File from FormData
  fieldName: z.enum(['frontVehiclePhoto', 'backVehiclePhoto', 'autoInsurancePhoto']),
});

export const MovingPartnerUploadVehiclePhotosResponseSchema = z.object({
  url: z.string(),
  message: z.string(),
});

// Type exports for moving partner file uploads
export type MovingPartnerJobsRequest = z.infer<typeof MovingPartnerJobsRequestSchema>;
export type MovingPartnerJobsResponse = z.infer<typeof MovingPartnerJobsResponseSchema>;
export type MovingPartnerUploadInsuranceRequest = z.infer<typeof MovingPartnerUploadInsuranceRequestSchema>;
export type MovingPartnerUploadInsuranceResponse = z.infer<typeof MovingPartnerUploadInsuranceResponseSchema>;
export type MovingPartnerUploadProfilePictureRequest = z.infer<typeof MovingPartnerUploadProfilePictureRequestSchema>;
export type MovingPartnerUploadProfilePictureResponse = z.infer<typeof MovingPartnerUploadProfilePictureResponseSchema>;
export type MovingPartnerUploadVehiclePhotosRequest = z.infer<typeof MovingPartnerUploadVehiclePhotosRequestSchema>;
export type MovingPartnerUploadVehiclePhotosResponse = z.infer<typeof MovingPartnerUploadVehiclePhotosResponseSchema>;

// ===== CUSTOMER UPCOMING APPOINTMENTS SCHEMAS =====

export const CustomerUpcomingAppointmentsRequestSchema = z.object({
  userType: z.enum(['mover', 'driver']),
  userId: z.string().or(positiveIntSchema),
});

export const CustomerUpcomingAppointmentsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.object({
    id: z.number(),
    address: z.string(),
    date: z.string(),
    time: z.string(),
    appointmentType: z.string(),
    status: z.string(),
    numberOfUnits: z.number(),
    planType: z.string(),
    insuranceCoverage: z.string().optional(),
    description: z.string().optional(),
    additionalInformation: z.object({
      itemsOver100lbs: z.boolean(),
      moveDescription: z.string().optional(),
      conditionsDescription: z.string().optional(),
    }).optional(),
    requestedStorageUnits: z.array(z.object({
      storageUnitId: z.number(),
      storageUnit: z.object({
        storageUnitNumber: z.string(),
      }),
    })),
    user: z.object({
      firstName: z.string(),
      lastName: z.string(),
    }).optional(),
    driver: z.object({
      firstName: z.string(),
      lastName: z.string(),
      phoneNumber: z.string().optional(),
      profilePicture: z.string().optional(),
    }).optional(),
  })),
});

// ===== CUSTOMER PROFILE SCHEMAS =====

export const CustomerProfileRequestSchema = z.object({
  id: z.string().or(positiveIntSchema),
});

export const CustomerProfileResponseSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phoneNumber: z.string(),
  stripeCustomerId: z.string().nullable(),
  savedCards: z.array(z.object({
    id: z.string(),
    stripePaymentMethodId: z.string(),
    last4: z.string(),
    brand: z.string(),
    expiryMonth: z.number(),
    expiryYear: z.number(),
    isDefault: z.boolean(),
  })),
});

// ===== CUSTOMER CONTACT INFO SCHEMAS =====

export const CustomerContactInfoRequestSchema = z.object({
  id: z.string().or(positiveIntSchema),
});

export const CustomerContactInfoResponseSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phoneNumber: z.string(),
  verifiedPhoneNumber: z.boolean(),
  storageUnits: z.array(z.object({
    storageUnitNumber: z.string(),
    padlockCombo: z.string().nullable(),
  })),
});

export const CustomerContactInfoUpdateRequestSchema = z.object({
  id: z.string().or(positiveIntSchema),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: emailSchema.optional(),
  phoneNumber: phoneSchema.optional(),
  storageUnits: z.array(z.object({
    storageUnitNumber: z.string(),
    padlockCombo: z.string(),
  })).optional(),
});

export const CustomerContactInfoUpdateResponseSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phoneNumber: z.string(),
  verifiedPhoneNumber: z.boolean(),
});

// Type exports for customer routes
export type CustomerUpcomingAppointmentsRequest = z.infer<typeof CustomerUpcomingAppointmentsRequestSchema>;
export type CustomerUpcomingAppointmentsResponse = z.infer<typeof CustomerUpcomingAppointmentsResponseSchema>;
export type CustomerProfileRequest = z.infer<typeof CustomerProfileRequestSchema>;
export type CustomerProfileResponse = z.infer<typeof CustomerProfileResponseSchema>;
export type CustomerContactInfoRequest = z.infer<typeof CustomerContactInfoRequestSchema>;
export type CustomerContactInfoResponse = z.infer<typeof CustomerContactInfoResponseSchema>;
export type CustomerContactInfoUpdateRequest = z.infer<typeof CustomerContactInfoUpdateRequestSchema>;
export type CustomerContactInfoUpdateResponse = z.infer<typeof CustomerContactInfoUpdateResponseSchema>;

// Cron job type exports
export type PackingSupplyRouteAssignmentCronRequest = z.infer<typeof PackingSupplyRouteAssignmentCronRequestSchema>;
export type PackingSupplyRouteAssignmentCronResponse = z.infer<typeof PackingSupplyRouteAssignmentCronResponseSchema>;
export type DailyDispatchCronRequest = z.infer<typeof DailyDispatchCronRequestSchema>;
export type DailyDispatchCronResponse = z.infer<typeof DailyDispatchCronResponseSchema>;
export type DriverAssignCronRequest = z.infer<typeof DriverAssignCronRequestSchema>;
export type DriverAssignCronResponse = z.infer<typeof DriverAssignCronResponseSchema>;

// ===== STRIPE CONNECT SCHEMAS =====

const stripeUserTypeSchema = z.enum(['driver', 'mover']);

export const StripeConnectUserRequestSchema = z.object({
  userId: z.string().or(positiveIntSchema),
  userType: stripeUserTypeSchema,
});

export const StripeConnectDriverRequestSchema = z.object({
  driverId: z.string().or(positiveIntSchema),
});

// Account Details Schemas
export const StripeConnectAccountDetailsResponseSchema = z.object({
  accountName: z.string(),
  balance: z.number(),
  availableBalance: z.number(),
  pendingBalance: z.number(),
  connectedDate: z.string(),
  detailsSubmitted: z.boolean(),
  payoutsEnabled: z.boolean(),
  chargesEnabled: z.boolean(),
});

// Account Status Schemas
export const StripeConnectAccountStatusResponseSchema = z.object({
  hasAccount: z.boolean(),
  accountId: z.string().optional(),
  detailsSubmitted: z.boolean().optional(),
  payoutsEnabled: z.boolean().optional(),
  chargesEnabled: z.boolean().optional(),
  requirements: z.any().optional(),
  message: z.string().optional(),
});

// Balance Schemas
export const StripeConnectBalanceResponseSchema = z.object({
  available: z.number(),
  pending: z.number(),
  inTransit: z.number(),
  total: z.number(),
});

// Create Account Schemas
export const StripeConnectCreateAccountResponseSchema = z.object({
  success: z.boolean(),
  accountId: z.string(),
  message: z.string().optional(),
});

// Account Link Schemas
export const StripeConnectAccountLinkResponseSchema = z.object({
  url: z.string(),
});

// Account Session Schemas
export const StripeConnectAccountSessionResponseSchema = z.object({
  clientSecret: z.string(),
});

// Dashboard Link Schemas
export const StripeConnectDashboardLinkResponseSchema = z.object({
  url: z.string(),
});

// Payment History Schemas
export const StripeConnectPaymentHistoryResponseSchema = z.object({
  payments: z.array(z.object({
    id: z.string(),
    amount: z.number(),
    status: z.string(),
    created: z.number(),
    description: z.string(),
  })),
});

// Payouts Schemas
export const StripeConnectPayoutsResponseSchema = z.object({
  payouts: z.array(z.object({
    id: z.string(),
    amount: z.number(),
    status: z.string(),
    date: z.string(),
    destination: z.string(),
  })),
});

// Stripe Status Schemas
export const StripeConnectStatusResponseSchema = z.object({
  hasStripeAccount: z.boolean(),
  stripeConnectAccountId: z.string().nullable(),
  onboardingComplete: z.boolean().nullable(),
  payoutsEnabled: z.boolean().nullable(),
  detailsSubmitted: z.boolean().nullable(),
});

// Test Data Schemas
export const StripeConnectTestDataRequestSchema = z.object({
  driverId: z.string().or(positiveIntSchema),
});

export const StripeConnectTestDataResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// Type exports for Stripe Connect routes
export type StripeConnectUserRequest = z.infer<typeof StripeConnectUserRequestSchema>;
export type StripeConnectDriverRequest = z.infer<typeof StripeConnectDriverRequestSchema>;
export type StripeConnectAccountDetailsResponse = z.infer<typeof StripeConnectAccountDetailsResponseSchema>;
export type StripeConnectAccountStatusResponse = z.infer<typeof StripeConnectAccountStatusResponseSchema>;
export type StripeConnectBalanceResponse = z.infer<typeof StripeConnectBalanceResponseSchema>;
export type StripeConnectCreateAccountResponse = z.infer<typeof StripeConnectCreateAccountResponseSchema>;
export type StripeConnectAccountLinkResponse = z.infer<typeof StripeConnectAccountLinkResponseSchema>;
export type StripeConnectAccountSessionResponse = z.infer<typeof StripeConnectAccountSessionResponseSchema>;
export type StripeConnectDashboardLinkResponse = z.infer<typeof StripeConnectDashboardLinkResponseSchema>;
export type StripeConnectPaymentHistoryResponse = z.infer<typeof StripeConnectPaymentHistoryResponseSchema>;
export type StripeConnectPayoutsResponse = z.infer<typeof StripeConnectPayoutsResponseSchema>;
export type StripeConnectStatusResponse = z.infer<typeof StripeConnectStatusResponseSchema>;
export type StripeConnectTestDataRequest = z.infer<typeof StripeConnectTestDataRequestSchema>;
export type StripeConnectTestDataResponse = z.infer<typeof StripeConnectTestDataResponseSchema>;

// Tracking Verify Schemas
export const TrackingVerifyRequestSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const TrackingStepActionSchema = z.object({
  label: z.string(),
  trackingUrl: z.string().optional(),
  url: z.string().optional(),
  type: z.literal('timer').optional(),
  startTime: z.string().optional(),
  endTime: z.string().nullable().optional(),
  timerData: z.object({
    type: z.literal('timer'),
    startTime: z.string(),
    endTime: z.string().nullable().optional(),
  }).optional(),
  iconName: z.string().optional(),
});

export const TrackingStepSchema = z.object({
  status: z.enum(['pending', 'in_transit', 'complete']),
  title: z.string(),
  timestamp: z.string(),
  action: TrackingStepActionSchema.optional(),
  secondaryAction: z.object({
    label: z.string(),
    url: z.string(),
  }).optional(),
});

export const TrackingDeliveryUnitSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'in_transit', 'complete']),
  unitNumber: z.number(),
  totalUnits: z.number(),
  provider: z.string(),
  steps: z.array(TrackingStepSchema),
});

export const TrackingVerifyResponseSchema = z.object({
  appointmentDate: z.string(),
  appointmentType: z.string(),
  deliveryUnits: z.array(TrackingDeliveryUnitSchema),
  location: z.object({
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
  }),
});

// Export types
export type TrackingVerifyRequest = z.infer<typeof TrackingVerifyRequestSchema>;
export type TrackingVerifyResponse = z.infer<typeof TrackingVerifyResponseSchema>;

// Admin Delivery Routes Types
export type AdminDeliveryRoutesRequest = z.infer<typeof AdminDeliveryRoutesRequestSchema>;
export type AdminDeliveryRoutesResponse = z.infer<typeof AdminDeliveryRoutesResponseSchema>;

// ===== MESSAGING DOMAIN SCHEMAS =====

/**
 * Twilio inbound webhook validation schemas
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts
 */

export const TwilioInboundRequestSchema = z.object({
  From: z.string().min(1, 'From phone number is required'),
  To: z.string().min(1, 'To phone number is required'),
  Body: z.string().min(1, 'Message body is required'),
  MessageSid: z.string().optional(),
  AccountSid: z.string().optional(),
  FromCountry: z.string().optional(),
  FromState: z.string().optional(),
  FromCity: z.string().optional(),
  FromZip: z.string().optional(),
  ToCountry: z.string().optional(),
  ToState: z.string().optional(),
  ToCity: z.string().optional(),
  ToZip: z.string().optional(),
});

export const TwilioInboundResponseSchema = z.object({
  success: z.boolean(),
  action: z.enum(['accept', 'decline', 'decline_reconfirm']).optional(),
  type: z.enum(['packing_supply_route', 'driver_task', 'mover_change', 'customer_general']).optional(),
  appointmentId: z.string().optional(),
  routeId: z.string().optional(),
  error: z.string().optional(),
});

// ===== ADMIN INVITATION DOMAIN SCHEMAS =====

export const CreateAdminInviteRequestSchema = z.object({
  email: emailSchema,
  role: z.enum(['ADMIN', 'SUPERADMIN'], {
    errorMap: () => ({ message: 'Role must be either ADMIN or SUPERADMIN' })
  })
});

export const CreateAdminInviteResponseSchema = z.object({
  message: z.string()
});

// ===== CRON ROUTE VALIDATIONS =====

export const ProcessExpiredMoverChangesRequestSchema = z.object({
  // POST request with auth header verification only
});

export const ProcessExpiredMoverChangesResponseSchema = z.object({
  success: z.boolean(),
  summary: z.object({
    totalProcessed: z.number(),
    autoAssigned: z.number(),
    thirdPartyEscalated: z.number(),
    errors: z.number()
  })
});

// ===== ADMIN TASKS DOMAIN SCHEMAS =====

export const AdminTaskIdSchema = z.string().regex(
  /^(storage-return-|storage-|unassigned-|packing-supply-feedback-|feedback-|cleaning-|requested-unit-|update-location-|prep-delivery-|prep-packing-supply-)/,
  'Invalid task ID format'
);

export const AdminTaskResponseSchema = z.object({
  task: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    action: z.string(),
    color: z.enum(['cyan', 'rose', 'amber', 'purple', 'orange', 'emerald', 'sky', 'indigo', 'darkAmber']),
    details: z.string(),
  }).passthrough(), // Allow additional properties specific to each task type
  success: z.boolean()
});

// Note: AdminTaskListingResponseSchema and AdminTaskStatisticsResponseSchema 
// already exist at lines 2022-2044 above

// Export types
export type TwilioInboundRequest = z.infer<typeof TwilioInboundRequestSchema>;
export type TwilioInboundResponse = z.infer<typeof TwilioInboundResponseSchema>;
export type CreateAdminInviteRequest = z.infer<typeof CreateAdminInviteRequestSchema>;
export type CreateAdminInviteResponse = z.infer<typeof CreateAdminInviteResponseSchema>;
export type ProcessExpiredMoverChangesRequest = z.infer<typeof ProcessExpiredMoverChangesRequestSchema>;
export type ProcessExpiredMoverChangesResponse = z.infer<typeof ProcessExpiredMoverChangesResponseSchema>;
export type AdminTaskId = z.infer<typeof AdminTaskIdSchema>;
export type AdminTaskResponse = z.infer<typeof AdminTaskResponseSchema>;
export type AdminTaskListingResponse = z.infer<typeof AdminTaskListingResponseSchema>;
export type AdminTaskStatistics = z.infer<typeof AdminTaskStatisticsResponseSchema>;
