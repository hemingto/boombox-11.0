# Quick Start: Testing Admin Tasks with Seed Data

## 1. Run the Seed Script

```bash
cd /Users/calvinhemington/Desktop/boombox-workspace/boombox-11.0

# Option A: Run all seeds (recommended)
npm run db:seed

# Option B: Run just admin tasks seed
node prisma/seeds/adminTasksSeed.cjs
```

## 2. Access the Admin Panel

Navigate to: `http://localhost:3000/admin/tasks`

You should see 11 tasks ready to test!

## 3. Task Types You Can Test

### ✅ Quick Test Checklist

- [ ] **Unassigned Driver** - Call moving partner workflow
- [ ] **Negative Feedback** - Send email response to unhappy customer
- [ ] **Negative Packing Supply Feedback** - Send email to unhappy delivery customer
- [ ] **Pending Cleaning** - Mark storage unit as cleaned
- [ ] **Admin Check-In** - Check in completed appointment
- [ ] **Storage Unit Assignment** - Assign storage unit to job
- [ ] **Requested Unit Access** - Assign requested storage unit
- [ ] **Storage Return** - Mark return as complete
- [ ] **Update Location** - Set warehouse location for storage unit
- [ ] **Prep Delivery** - Prepare storage units for delivery
- [ ] **Prep Packing Supply** - Prepare packing supply order

## 4. Test Data Reference

### Login Credentials (if needed)
- Admin: admin@boombox.com

### Test Customers
- John Doe: john.doe@example.com
- Jane Smith: jane.smith@example.com  
- Bob Wilson: bob.wilson@example.com

### Drivers
- Mike Driver: driver1@example.com
- Sarah Transport: driver2@example.com

## 5. Reset and Reseed

If you need fresh data:

```bash
# This will drop all data and reseed
npm run db:reset
```

## 6. Expected Behavior

Each task should:
1. Display relevant information (customer, job code, dates, etc.)
2. Show appropriate form fields for the task type
3. Allow you to complete the task workflow
4. Redirect back to `/admin/tasks` on completion

## Troubleshooting

### "Task not found"
- Make sure you ran the seed script successfully
- Check that the database connection is working

### "No tasks showing"
- Verify the seed script completed without errors
- Check the console for any API errors
- Try refreshing the page

### Database errors
```bash
# Reset everything and try again
npm run db:reset
```

## Next Steps

After testing:
1. ✅ Verify all task types work correctly
2. ✅ Check that task completion updates database properly
3. ✅ Test edge cases (missing data, invalid inputs)
4. ✅ Verify email sending (if configured)
5. ✅ Check notifications are created (if applicable)

## Need More Data?

Run the seed script multiple times (with different email addresses) or modify the seed script to create more instances of each task type.

