# Moving Partner Sign-Up and Approval Flow

This document outlines the high-level steps a Moving Partner (mover company) takes to sign up for Boombox and get approved in the system.

---

## Overview

Moving Partners are moving companies that join the Boombox platform to receive and fulfill moving jobs. They can operate with at least one driver or build a team of drivers under their company umbrella.

---

## Step 1: Application Submission

- Moving partner navigates to `/mover-signup`
- Company representative fills out the sign-up form with:

| Field | Description | Required |
|-------|-------------|----------|
| Company Name | Name of the moving company | Yes |
| Email | Primary company email | Yes |
| Phone Number | Primary contact phone | Yes |
| Website | Company website URL | Yes |
| Number of Employees | Company size (dropdown selection) | Yes |

- Company representative submits the application

---

## Step 2: Account Created

- Moving partner record is created in the database with:
  - Submitted company information
  - Default availability schedule (9am–5pm, all days blocked)
- Initial status:
  - `isApproved`: false
  - `applicationComplete`: false
  - `status`: PENDING
- Moving partner is automatically signed in and redirected to their account dashboard

---

## Step 3: Complete Account Setup Checklist

Moving partner must complete the following checklist items on their dashboard:

| Checklist Item | Description |
|----------------|-------------|
| Company Description | Add a description of the company and services |
| Company Picture/Logo | Upload company logo or profile image |
| Phone Verification | Verify phone number via verification code |
| Hourly Rate | Set the company's hourly rate for services |
| Approved Vehicles | Add at least one vehicle and get it approved |
| Calendar & Team Capacity | Configure availability and team capacity |
| Bank Account | Link bank account via Stripe Connect for payments |
| Terms of Service | Review and accept terms of service |

---

## Step 4: Application Marked Complete

- Once all checklist items are completed, `applicationComplete` is set to `true`
- Application is now ready for admin review
- Moving partner dashboard shows "Pending Approval" status

---

## Step 5: Admin Review & Approval

Admin reviews the moving partner application:
1. Admin navigates to the admin dashboard
2. Admin reviews company information and submitted documents
3. Admin verifies:
   - Company information is accurate
   - Website is legitimate
   - Vehicles have been reviewed and approved
   - Bank account is properly connected
4. Admin clicks "Approve" to approve the moving partner

---

## Step 6: Moving Partner Activated

Upon admin approval:
- `isApproved` is set to `true`
- Onfleet team is created for the moving partner
- `onfleetTeamId` is generated and saved
- `status` is updated:
  - `ACTIVE` if the partner has approved drivers
  - `INACTIVE` if no drivers yet (can still operate as owner-operator)
- Moving partner receives approval notifications:
  - In-app notification
  - SMS notification
  - Email confirmation

---

## Step 7: Ready for Operations

After approval, the moving partner can:
- Access the Onfleet dashboard for job dispatch
- Receive and accept job assignments
- Invite and add drivers to their team
- Manage their fleet of vehicles
- View and manage their work calendar

---

## Post-Approval: Adding Drivers

Once approved, moving partners can expand their team:
1. Navigate to "Driver Information" section in dashboard
2. Send invitations to drivers via email/SMS
3. Drivers accept invitation and complete their own checklist
4. Moving partner or admin approves drivers
5. Drivers are added to the partner's Onfleet team

---

## Status Lifecycle Summary

```
PENDING → APPLICATION COMPLETE → APPROVED → ACTIVE/INACTIVE
   ↓              ↓                  ↓              ↓
 Sign-up      Checklist done    Admin approved   On Onfleet
```

---

## Key System Integrations

| System | Purpose |
|--------|---------|
| **Onfleet** | Team management, job dispatch, driver coordination |
| **Stripe Connect** | Payment processing and bank account linking |
| **SMS/Email** | Notifications and verification |

---

## Key Routes & Components

| Route/Component | Purpose |
|-----------------|---------|
| `/mover-signup` | Moving partner sign-up page |
| `/service-provider/mover/[id]` | Moving partner dashboard |
| `/service-provider/mover/[id]/account-information` | Company profile management |
| `/service-provider/mover/[id]/vehicle` | Vehicle management |
| `/service-provider/mover/[id]/calendar` | Schedule management |
| `/service-provider/mover/[id]/payment` | Bank account & payments |
| `/service-provider/mover/[id]/drivers` | Driver management (post-approval) |
| `/api/moving-partners/list` | Moving partner creation API |
| `/api/admin/moving-partners/[id]/approve` | Admin approval API |

---

## Notes

- Moving partners cannot receive jobs until they are fully `ACTIVE` in the system
- Onfleet team is only created after admin approval
- Vehicle approval is separate from moving partner approval (vehicles must be approved first)
- Moving partners can operate as owner-operators (without additional drivers)
- All document uploads and company information should be verified by admin before approval
- Moving partners can add multiple vehicles to their fleet
- Status changes from `INACTIVE` to `ACTIVE` automatically when the first approved driver is added

