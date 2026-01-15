# Database Seed Scripts

This directory contains seed scripts for populating the boombox-11.0 database with test data.

## Available Seeds

### 1. Admin Tasks Seed (`adminTasksSeed.ts/cjs`)

Seeds comprehensive test data for all admin task types in the admin panel.

**Task Types Created:**

1. **Unassigned Driver Job** - Appointment without driver assignment
2. **Negative Appointment Feedback** - Completed appointment with poor rating (≤3 stars)
3. **Negative Packing Supply Feedback** - Delivered packing supply order with poor rating
4. **Pending Storage Unit Cleaning** - Storage unit with "pending cleaning" status
5. **Admin Check-In** - Appointment with "Awaiting Admin Check In" status
6. **Storage Unit Assignment Needed** - Appointment needing storage unit assignment
7. **Requested Storage Unit Access** - Appointment with requested storage unit access
8. **Storage Unit Return** - Delivery appointment for returning storage unit to customer
9. **Location Update Needed** - Storage unit usage without warehouse location
10. **Prep Units for Delivery** - Storage units needing preparation for delivery
11. **Prep Packing Supply Order** - Packing supply order that hasn't been prepped yet

**Data Created:**
- 1 Admin user
- 3 Test users (customers)
- 1 Moving partner
- 2 Drivers
- 5 Storage units
- 11 Tasks across all task types
- 3 Packing supply products
- 2 Packing supply orders
- Multiple appointments, OnfleetTasks, and related records

### 2. Blog Seed (`blogSeed.ts/cjs`)

Seeds blog posts, categories, and tags for the marketing blog.

### 3. Product Seed (`productSeed.ts/cjs`)

Seeds packing supply products and kits.

### 4. Moving Partner Seed (`movingPartnerSeed.cjs`)

Seeds moving partners and drivers for the platform.

## Running Seeds

### Run All Seeds

```bash
# Using npm scripts
npm run db:seed

# Or using Prisma directly
npx prisma db seed
```

### Run Individual Seeds

#### Admin Tasks Only
```bash
# TypeScript version
npx ts-node prisma/seeds/adminTasksSeed.ts

# CommonJS version
node prisma/seeds/adminTasksSeed.cjs
```

#### Other Seeds
```bash
node prisma/seeds/productSeed.cjs
node prisma/seeds/blogSeed.cjs
node prisma/seeds/movingPartnerSeed.cjs
```

### Reset Database and Reseed

```bash
npm run db:reset
```

## Testing Admin Tasks

After seeding, you can test each task type in the admin panel:

1. **Navigate to Admin Dashboard**: `/admin/dashboard`
2. **View Tasks**: `/admin/tasks`
3. **Click on any task** to test the specific task workflow

### Task ID Patterns

Each task follows a specific ID pattern for routing:

- Unassigned Driver: `unassigned-{appointmentId}`
- Storage Assignment: `storage-{appointmentId}-{unitIndex}`
- Storage Return: `storage-return-{appointmentId}-{storageUnitId}`
- Feedback: `feedback-{feedbackId}`
- Packing Supply Feedback: `packing-supply-feedback-{feedbackId}`
- Cleaning: `cleaning-{storageUnitId}`
- Requested Unit: `requested-unit-{appointmentId}-{unitIndex}-{storageUnitId}`
- Update Location: `update-location-{usageId}`
- Prep Delivery: `prep-delivery-{appointmentId}`
- Prep Packing Supply: `prep-packing-supply-{orderId}`

## Test Data Details

### Test Users
- **John Doe**: john.doe@example.com / +12025551001
- **Jane Smith**: jane.smith@example.com / +12025551002
- **Bob Wilson**: bob.wilson@example.com / +12025551003

### Admin User
- **Test Admin**: admin@boombox.com / +1234567890

### Drivers
- **Mike Driver**: driver1@example.com / +15105551111
- **Sarah Transport**: driver2@example.com / +15105552222

### Moving Partner
- **Test Moving Company**: partner@movingco.com / +15105551234

### Storage Units
- **BB-001**: Available
- **BB-002**: Available (needs location update)
- **BB-003**: Pending Cleaning
- **BB-004**: In Use (customer: Jane Smith)
- **BB-005**: In Use (customer: Jane Smith)

## Troubleshooting

### Unique Constraint Errors

If you encounter unique constraint errors when reseeding:

1. Reset the database first:
   ```bash
   npm run db:reset
   ```

2. Or manually clear specific tables before seeding again:
   ```bash
   npx prisma studio
   ```

### Missing Dependencies

Ensure you have all required dependencies:
```bash
npm install
```

### Prisma Client Issues

Regenerate Prisma Client if needed:
```bash
npx prisma generate
```

## Development Notes

- Seed scripts use `upsert` where possible to prevent duplicate data errors
- Dates are dynamically generated relative to current date (today, tomorrow, etc.)
- All placeholder images use `via.placeholder.com`
- Test data is designed to cover all edge cases in task workflows

## Modifying Seeds

When modifying seed scripts:

1. Update both `.ts` and `.cjs` versions for consistency
2. Test seeding on a clean database: `npm run db:reset`
3. Verify all tasks appear correctly in admin panel
4. Check task detail pages load without errors
5. Update this README with any new data patterns

## Database Schema

For reference, see the main schema:
- `prisma/schema.prisma`

For migration history:
- `prisma/migrations/`

