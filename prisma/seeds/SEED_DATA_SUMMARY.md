# Admin Tasks Seed Data Summary

## 📋 Overview
This seed creates 11 different task types to test all admin task workflows.

## 🎯 Tasks Created

### 1. 🚗 Unassigned Driver Job
**Task ID:** `unassigned-{appointmentId}`  
**Customer:** John Doe  
**Job Code:** JOB-UNASSIGNED-001  
**Type:** Initial Pickup  
**Moving Partner:** Test Moving Company  
**Date:** Tomorrow at 10:00 AM  
**Status:** No driver assigned yet  
**Action:** Call moving partner to confirm driver availability

---

### 2. ⭐ Negative Appointment Feedback
**Task ID:** `feedback-{feedbackId}`  
**Customer:** Jane Smith  
**Job Code:** JOB-FEEDBACK-001  
**Type:** Delivery  
**Rating:** 2/5 stars  
**Comment:** "Driver was late and items were not handled carefully..."  
**Action:** Send email response to customer

---

### 3. 📦 Negative Packing Supply Feedback
**Task ID:** `packing-supply-feedback-{feedbackId}`  
**Customer:** John Doe  
**Order:** TRACK-PS-002  
**Rating:** 1/5 stars  
**Comment:** "Items arrived damaged and delivery was very late..."  
**Action:** Send email response to customer

---

### 4. 🧹 Pending Storage Unit Cleaning
**Task ID:** `cleaning-{storageUnitId}`  
**Storage Unit:** BB-003  
**Status:** Pending cleaning  
**Action:** Upload photos of cleaned unit and mark as cleaned

---

### 5. ✅ Admin Check-In
**Task ID:** (Shown in awaiting admin check in list)  
**Customer:** Bob Wilson  
**Job Code:** JOB-ADMINCHECK-001  
**Type:** Initial Pickup  
**Date:** Today at 2:00 PM  
**Status:** Awaiting Admin Check In  
**Action:** Verify job completion and check in

---

### 6. 📦 Storage Unit Assignment Needed
**Task ID:** `storage-{appointmentId}-{unitIndex}`  
**Customer:** John Doe  
**Job Code:** JOB-STORAGE-001  
**Type:** Initial Pickup  
**Driver:** Mike Driver  
**Date:** Today at 2:00 PM  
**Units Needed:** 2  
**Action:** Verify driver, take trailer photo, assign storage units

---

### 7. 🔑 Requested Storage Unit Access
**Task ID:** `requested-unit-{appointmentId}-{unitIndex}-{storageUnitId}`  
**Customer:** Jane Smith  
**Job Code:** JOB-REQUESTED-001  
**Type:** Storage Access  
**Date:** Tomorrow at 10:00 AM  
**Units Requested:** BB-004, BB-005  
**Driver:** Sarah Transport  
**Action:** Verify driver, take trailer photo, assign requested units

---

### 8. 🏠 Storage Unit Return
**Task ID:** `storage-return-{appointmentId}-{storageUnitId}`  
**Customer:** John Doe  
**Job Code:** JOB-RETURN-001  
**Type:** Delivery  
**Date:** Tomorrow at 10:00 AM  
**Unit Returning:** BB-004  
**Driver:** Mike Driver  
**Action:** Confirm return delivery completion

---

### 9. 📍 Location Update Needed
**Task ID:** `update-location-{usageId}`  
**Customer:** Bob Wilson  
**Storage Unit:** BB-002  
**Issue:** Missing warehouse location  
**Action:** Set warehouse location and name

---

### 10. 🎁 Prep Units for Delivery
**Task ID:** `prep-delivery-{appointmentId}`  
**Customer:** John Doe  
**Job Code:** JOB-PREPDELIVERY-001  
**Type:** Delivery  
**Date:** Tomorrow at 10:00 AM  
**Unit to Prep:** BB-005  
**Driver:** Sarah Transport  
**Action:** Prepare storage unit for pickup/delivery

---

### 11. 📦 Prep Packing Supply Order
**Task ID:** `prep-packing-supply-{orderId}`  
**Customer:** Bob Wilson  
**Order:** TRACK-PS-001  
**Delivery:** Tomorrow (2-hour window)  
**Driver:** Mike Driver  
**Items:**
- 5x Medium Moving Box
- 2x Bubble Wrap Roll  
- 1x Packing Tape  
**Total:** $45.94  
**Action:** Collect items, check them off, confirm order is in pickup area

---

## 👥 Test Accounts Created

### Users (Customers)
1. John Doe - john.doe@example.com
2. Jane Smith - jane.smith@example.com
3. Bob Wilson - bob.wilson@example.com

### Drivers
1. Mike Driver - driver1@example.com
2. Sarah Transport - driver2@example.com

### Moving Partner
- Test Moving Company - partner@movingco.com

### Admin
- Test Admin - admin@boombox.com

## 📦 Storage Units

- **BB-001:** Available
- **BB-002:** Available (needs location update)
- **BB-003:** Pending cleaning
- **BB-004:** In use by Jane Smith (will be returned)
- **BB-005:** In use by Jane Smith (will be delivered)

## 🏷️ Products Created

1. Medium Moving Box - $3.99
2. Bubble Wrap Roll - $12.99
3. Packing Tape - $4.99

## 🎯 Testing Workflow

1. Run seed: `npm run db:seed`
2. Navigate to: `http://localhost:3000/admin/tasks`
3. Click on each task to test the workflow
4. Verify task completion redirects correctly
5. Check that data updates in database

## 📝 Notes

- All dates are relative (today/tomorrow) so tasks are always current
- Job codes are unique and descriptive
- All required relationships are properly connected
- Images use placeholder URLs
- Phone numbers use test format

