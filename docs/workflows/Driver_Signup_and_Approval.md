# Driver Sign-Up and Approval Flow

This document outlines the high-level steps a driver takes to sign up for Boombox and get approved in the system.

---

## Overview

There are two paths for drivers to join the Boombox platform:

1. **Boombox Delivery Network Driver** – Independent drivers who sign up directly with Boombox
2. **Moving Partner Driver** – Drivers invited by an approved Moving Partner company

---

## Path 1: Boombox Delivery Network Driver

### Step 1: Application Submission
- Driver navigates to `/driver-signup`
- Driver fills out the sign-up form with personal and contact information
- Driver submits the application

### Step 2: Account Created
- Driver record is created in the database with:
  - Submitted form information
  - Assigned to Boombox Delivery Network, Or Boombox Packing Supply Delivery Network, or Both
  - Default availability schedule (9am–5pm, all days blocked)
- Initial status:
  - `isApproved`: false
  - `applicationComplete`: false
  - `status`: pending
- Driver is redirected to their account dashboard

### Step 3: Complete Account Setup Checklist
Driver must complete the following checklist items on their dashboard:

| Checklist Item | Description |
|----------------|-------------|
| Profile Picture | Upload a profile photo |
| Driver's License | Upload front and back photos of driver's license |
| Phone Verification | Verify phone number via code |
| Approved Vehicle | Add and get a vehicle approved |
| Work Schedule | Set availability/work schedule |
| Bank Account | Link bank account via Stripe Connect |
| Terms of Service | Review and accept terms of service |

### Step 4: Application Marked Complete
- Once all checklist items are completed, `applicationComplete` is set to `true`
- Application is now ready for admin review

### Step 5: Admin Review & Approval
- Admin reviews the driver's application in the admin dashboard
- Admin verifies submitted documents (license, vehicle, etc.)
- Admin approves or leaves pending

### Step 6: Driver Activated
Upon approval:
- `isApproved` is set to `true`
- Driver is added to Onfleet dispatch system
- `onfleetWorkerId` is generated and saved
- `status` is updated to `Active`
- Driver receives SMS from Onfleet to download the driver app
- Driver receives approval confirmation email

### Step 7: Ready for Jobs
- Driver can now receive and accept job notifications
- Driver uses the Onfleet app for navigation and job management

---

## Path 2: Moving Partner Driver

### Step 1: Invitation Received
- Moving Partner (already approved in system) sends invitation to driver
- Driver receives invitation via email/SMS with invitation link

### Step 2: Accept Invitation
- Driver navigates to the invitation link
- Driver fills out their information and accepts the invitation
- Driver record is created and associated with the Moving Partner

### Step 3: Complete Account Setup Checklist
Same checklist as Boombox Network drivers:
- Profile Picture
- Driver's License
- Phone Verification
- Terms of Service

> **Note:** Moving Partner drivers may have fewer requirements as they operate under the partner's umbrella.

### Step 4: Admin/Partner Approval
- Moving Partner or Admin reviews and approves the driver
- Driver is added to the Moving Partner's Onfleet team

### Step 5: Driver Activated
- Driver receives Onfleet setup notification
- Driver is now part of the Moving Partner's team
- Can receive jobs assigned to the Moving Partner

---

## Status Lifecycle Summary

```
PENDING → APPLICATION COMPLETE → APPROVED → ACTIVE
   ↓              ↓                  ↓          ↓
 Sign-up      Checklist done    Admin approved  On Onfleet
```

---

## Key System Integrations

| System | Purpose |
|--------|---------|
| **Onfleet** | Driver dispatch, job management, navigation |
| **Stripe Connect** | Driver payments and bank account linking |
| **SMS/Email** | Notifications and verification |

---

## Notes

- Drivers cannot receive jobs until they are fully `Active` in the system
- Onfleet worker ID is only generated after admin approval
- All document uploads (license, vehicle photos) should be verified by admin before approval

