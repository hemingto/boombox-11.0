# Vehicle Addition and Approval Flow

This document outlines the high-level steps a mover (Moving Partner) or driver takes to add a vehicle to their account and get it approved in the system.

---

## Overview

Vehicles are required for service providers to operate on the Boombox platform. The vehicle workflow varies slightly based on user type:

1. **Boombox Delivery Network Drivers** – Must have an approved vehicle before they can be approved as a driver
2. **Moving Partner Drivers** – Operate under the Moving Partner's umbrella and may not need individual vehicles
3. **Moving Partners (Movers)** – Add vehicles as part of their account setup checklist

---

## Prerequisites

Before adding a vehicle, the user must:
- Have an existing account in the system (driver or mover)
- Be logged into their account dashboard

---

## Step 1: Navigate to Vehicle Section

- From the account dashboard, user clicks on "Vehicle" in the navigation menu
- Routes:
  - Drivers: `/service-provider/driver/[id]/vehicle`
  - Movers: `/service-provider/mover/[id]/vehicle`
- If no vehicle exists, user sees an "Add Vehicle" button

---

## Step 2: Complete Vehicle Form

User navigates to the add vehicle page and fills out the vehicle information form:

| Field | Description | Required |
|-------|-------------|----------|
| Vehicle Make | Manufacturer (e.g., Toyota, Ford) | Yes |
| Vehicle Model | Model name (e.g., Camry, F-150) | No |
| Vehicle Year | Year of manufacture | Yes |
| License Plate | Vehicle license plate number | No |
| Trailer Hitch | Whether the vehicle has a trailer hitch | Yes |
| Front Vehicle Photo | Photo of the front of the vehicle | No |
| Back Vehicle Photo | Photo of the back of the vehicle | No |
| Auto Insurance Photo | Photo of current insurance card | No |

---

## Step 3: Submit Vehicle Information

- User clicks "Submit" to save the vehicle
- Photos are uploaded to cloud storage (if provided)
- Vehicle record is created in the database with:
  - `isApproved`: false (pending admin review)
  - Associated to the user (driver or mover)
- User is redirected to their vehicle page showing the pending vehicle

---

## Step 4: Vehicle Pending Review

After submission:
- Vehicle appears in the user's account with a "Pending" status
- Vehicle is visible in the admin dashboard under the vehicles list
- Checklist item "Add approved vehicles" remains incomplete

---

## Step 5: Admin Review & Approval

Admin reviews vehicle submissions:
1. Admin navigates to `/admin/vehicles`
2. Admin can filter to see unapproved vehicles
3. Admin reviews vehicle information and photos
4. Admin verifies:
   - Vehicle photos are clear and legitimate
   - Insurance is valid (if photo provided)
   - Vehicle meets platform requirements
5. Admin clicks "Approve" to approve the vehicle

---

## Step 6: Vehicle Approved

Upon admin approval:
- `isApproved` is set to `true`
- Checklist item "Add approved vehicles" is marked complete
- User can see their vehicle status updated to "Approved"

---

## Impact on Driver/Mover Approval

### For Boombox Delivery Network Drivers
- An approved vehicle is **required** before the driver can be approved
- Without an approved vehicle, admin cannot complete driver approval
- Vehicle type is mapped to Onfleet configuration upon driver approval

### For Moving Partner Drivers
- Vehicles may not be required (operate under Moving Partner's umbrella)
- Depends on Moving Partner configuration

### For Movers (Moving Partners)
- Approved vehicles are part of the account setup checklist
- Required to complete application before admin can approve the Moving Partner

---

## Vehicle Status Lifecycle

```
SUBMITTED → PENDING REVIEW → APPROVED
    ↓              ↓             ↓
 Created      In admin queue   Active on platform
```

---

## Key Routes & Components

| Route/Component | Purpose |
|-----------------|---------|
| `/service-provider/driver/[id]/vehicle` | Driver vehicle page |
| `/service-provider/mover/[id]/vehicle` | Mover vehicle page |
| `/service-provider/[type]/[id]/vehicle/add-vehicle` | Add vehicle form |
| `/admin/vehicles` | Admin vehicle management |
| `/api/drivers/[id]/vehicle` | Driver vehicle API |
| `/api/moving-partners/[id]/vehicle` | Mover vehicle API |
| `/api/admin/vehicles/[id]/approve` | Admin approval API |

---

## Notes

- **Drivers** can only have **one vehicle** associated with their account at a time
- **Movers (Moving Partners)** can have **multiple vehicles** in their fleet
- Vehicle photos and information can be updated after initial submission
- Admin should verify insurance is current before approving
- Vehicle approval is separate from driver/mover approval
- All document uploads should be reviewed before approval

