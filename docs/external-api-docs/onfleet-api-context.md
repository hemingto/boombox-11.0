# Onfleet API Integration Context for Boombox

## Current API Version

- **Version**: v2.7 (verified January 2025)
- **Base URL**: `https://onfleet.com/api/v2/`
- **Documentation**: Updated with live API reference

## Integration Patterns

### Task Creation Flow

```typescript
// Standard Boombox task creation pattern
const createOnfleetTask = async (orderData: PackingSupplyOrder) => {
  const taskPayload = {
    destination: {
      address: { unparsed: orderData.deliveryAddress },
      notes: orderData.deliveryNotes,
    },
    recipients: [
      {
        name: orderData.customerName,
        phone: orderData.customerPhone,
        notes: orderData.specialInstructions,
      },
    ],
    pickupTask: false,
    autoAssign: { mode: 'distance' },
    metadata: [
      { name: 'orderId', value: orderData.id },
      { name: 'orderType', value: 'packing-supply' },
      { name: 'customerId', value: orderData.customerId },
    ],
    appearance: { triangleColor: 1 }, // Orange for packing supplies
  };
};
```

### Webhook Event Handling

```typescript
// Primary webhook events used in Boombox
const webhookHandlers = {
  0: handleTaskStarted, // Notify customer delivery started
  1: handleTaskEta, // Send ETA notifications (threshold: 1800s)
  3: handleTaskCompleted, // Update order status to delivered
  4: handleTaskFailed, // Handle delivery failures
  5: handleWorkerDuty, // Track driver availability
  7: handleTaskUpdated, // Update order with completion details
  19: handleBatchJobCompleted, // Process batch delivery results
};
```

## Current Webhook Triggers (v2.7)

### Active Webhooks in Boombox

- **Task Started (0)**: Customer notifications
- **Task ETA (1)**: 30-minute threshold for delivery notifications
- **Task Completed (3)**: Order fulfillment confirmation
- **Task Failed (4)**: Exception handling and customer support
- **Worker Duty (5)**: Driver availability tracking
- **Task Updated (7)**: Proof of delivery processing
- **Batch Job Completed (19)**: Daily route optimization results

### New Webhook Triggers (Available but not implemented)

- **Route Plan Events (22-29)**: Route plan lifecycle management
- **Predicted Task Delay (30)**: Proactive delay notifications
- **Auto-Dispatch Completed (18)**: Team auto-dispatch results

## Error Handling Standards

### Address Validation

```typescript
// Validate addresses before task creation
const validateAddress = async (address: string) => {
  // Use Google Maps API for validation before sending to Onfleet
  // Provide coordinates when possible to avoid geocoding failures
};
```

### Phone Number Validation

```typescript
// Use Google libphonenumber for validation
import { parsePhoneNumber } from 'libphonenumber-js';

const validatePhone = (phone: string, country: string = 'US') => {
  const phoneNumber = parsePhoneNumber(phone, country);
  return phoneNumber?.isValid() ? phoneNumber.format('E.164') : null;
};
```

### Retry Logic

```typescript
// Implement exponential backoff for failed API calls
const retryConfig = {
  retries: 3,
  retryDelay: (attempt: number) => Math.pow(2, attempt) * 1000,
  retryCondition: (error: any) => error.response?.status >= 500,
};
```

## Common Pitfalls and Solutions

### Task Assignment Issues

- **Problem**: Tasks created but not assigned to drivers
- **Solution**: Ensure drivers are on-duty (state=1) before using autoAssign
- **Verification**: Check worker status via GET /workers before task creation

### Webhook Delivery Failures

- **Problem**: Missed webhook events causing order sync issues
- **Solution**: Implement webhook signature validation and retry logic
- **Fallback**: Periodic polling of task status for critical orders

### Batch Operation Limits

- **Problem**: Large batch operations timing out
- **Solution**: Use async batch endpoints for >50 tasks
- **Monitoring**: Listen for taskBatchCreateJobCompleted webhook (ID: 19)

### Metadata Limitations

- **Problem**: Custom data not appearing in mobile app
- **Solution**: Use standardized metadata field names
- **Best Practice**: Keep metadata values under 500 characters

## Performance Optimizations

### Coordinate Precision

```typescript
// Always provide coordinates when available
const destination = {
  address: { unparsed: fullAddress },
  location: [longitude, latitude], // Improves geocoding accuracy
};
```

### Batch Operations

```typescript
// Use batch endpoints for multiple tasks
const batchTasks = await fetch('/api/v2/tasks/batch-async', {
  method: 'POST',
  body: JSON.stringify({ tasks: taskArray }),
});
```

### Route Optimization

```typescript
// Include serviceTime and quantity for better routing
const taskWithOptimization = {
  ...baseTask,
  serviceTime: 5, // minutes at location
  quantity: orderItems.length, // for capacity planning
};
```

## Integration Health Checks

### API Connectivity

```typescript
// Verify API key and connectivity
const healthCheck = async () => {
  const response = await fetch('/api/v2/organization', {
    headers: { Authorization: `Basic ${btoa(apiKey + ':')}` },
  });
  return response.ok;
};
```

### Webhook Verification

```typescript
// Verify webhook signature for security
const verifyWebhook = (payload: string, signature: string, secret: string) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === expectedSignature;
};
```

## Refactoring Considerations

### Service Layer Pattern

- Move Onfleet API calls to dedicated service layer
- Centralize error handling and retry logic
- Abstract webhook processing into event handlers

### Type Safety Improvements

- Define strict TypeScript interfaces for Onfleet entities
- Create validation schemas for API responses
- Implement runtime type checking for webhook payloads

### Testing Strategy

- Use Onfleet test environment for development
- Mock webhook events for unit testing
- Implement integration tests with task lifecycle verification

---

_Context updated January 2025 with Onfleet API v2.7 specifications_
