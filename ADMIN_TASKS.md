# Boombox Admin Tasks & Responsibilities

This document outlines the administrative tasks and responsibilities for managing the Boombox platform.

---

## Task Management

### Assign Storage Unit

**Route:** `/admin/tasks/assign-storage-unit/[taskId]`

Assign available storage units to customer appointments when they request storage services.

**Responsibilities:**

- Review appointment details and storage requirements
- Select appropriate available storage units
- Confirm unit assignment to the appointment

---

### Assign Requested Unit

**Route:** `/admin/tasks/assign-requested-unit/[taskId]`

Assign specific storage units that customers have requested by unit number.

**Responsibilities:**

- Verify the requested unit is available
- Confirm the unit meets customer requirements
- Assign the requested unit to the appointment

---

### Unassigned Driver

**Route:** `/admin/tasks/unassigned-driver/[taskId]`

Handle appointments where a moving partner has not assigned a driver.

**Responsibilities:**

- Contact the moving partner to remind them to assign a driver
- Send notification reminders via the system
- Escalate if driver remains unassigned close to appointment time

---

### Storage Unit Return

**Route:** `/admin/tasks/storage-unit-return/[taskId]`

Process storage units being returned after customer delivery appointments.

**Responsibilities:**

- Verify unit has been returned to the warehouse
- Assess unit condition and document any damage
- Update unit status (route to cleaning if needed)
- Record any damage notes for billing purposes

---

### Update Location

**Route:** `/admin/tasks/update-location/[taskId]`

Update the warehouse location for storage units after they've been moved or returned.

**Responsibilities:**

- Confirm the unit's current physical location
- Update the warehouse location in the system
- Ensure location accuracy for future retrieval

---

### Prep Units for Delivery

**Route:** `/admin/tasks/prep-units-delivery/[taskId]`

Prepare storage units for upcoming delivery appointments.

**Responsibilities:**

- Locate units in the warehouse
- Verify unit contents match records
- Stage units for driver pickup
- Confirm units are ready for transport

---

### Prep Packing Supply Order

**Route:** `/admin/tasks/prep-packing-supply-order/[taskId]`

Organize and prepare packing supply orders for delivery.

**Responsibilities:**

- Review order contents
- Gather all items from inventory
- Package order for delivery
- Mark order as prepped and ready

---

### Pending Cleaning

**Route:** `/admin/tasks/pending-cleaning/[taskId]`

Mark storage units as clean after the cleaning process is complete.

**Responsibilities:**

- Verify unit has been cleaned
- Inspect unit for cleanliness standards
- Update unit status from "Pending Cleaning" to "Empty" (available)

---

### Negative Feedback

**Route:** `/admin/tasks/negative-feedback/[taskId]`

Respond to customer feedback with ratings of 3 or below.

**Responsibilities:**

- Review the customer's feedback and rating
- Investigate the issue with the relevant appointment
- Compose and send an email response to the customer
- Document resolution steps taken

---

## Approval Workflows

### Driver Approval

**Route:** `/admin/drivers`

Review and approve new driver registrations.

**Responsibilities:**

- Review driver application and profile
- Verify license photos and documentation
- Approve or reject driver applications
- Communicate decisions to moving partners

---

### Moving Partner Approval

**Route:** `/admin/movers`

Review and approve new moving partner (mover) registrations.

**Responsibilities:**

- Review moving partner application
- Verify business credentials
- Review associated drivers and vehicles
- Approve or reject applications

---

### Vehicle Approval

**Route:** `/admin/vehicles`

Review and approve vehicle registrations from drivers and movers.

**Responsibilities:**

- Review vehicle photos (front, back, insurance)
- Verify insurance documentation
- Confirm vehicle meets service requirements
- Approve or reject vehicle registrations

---

## Operational Management

### Job/Appointment Management

**Route:** `/admin/jobs`

Oversee all customer appointments and their statuses.

**Responsibilities:**

- Monitor job statuses (Scheduled, In Transit, Loading Complete, Admin Check, Complete)
- Search and filter appointments by job code, status, or date
- Assign storage units to jobs
- Assign drivers to jobs
- View and manage Onfleet delivery tasks
- Handle appointment issues and escalations

---

### Delivery Routes

**Route:** `/admin/delivery-routes`

Manage packing supply delivery routes and driver assignments.

**Responsibilities:**

- View delivery routes by date
- Monitor route completion status
- Track driver payouts
- Review orders per route
- Handle cancellations
- Review route feedback

---

### Calendar Management

**Route:** `/admin/calendar`

View and manage the appointment calendar.

**Responsibilities:**

- Review scheduled appointments in week/day views
- Identify scheduling conflicts
- View appointment details (customer, mover, driver, address)
- Monitor daily workload distribution

---

## Inventory & Storage

### Storage Unit Management

**Route:** `/admin/storage-units`

Manage the storage unit inventory.

**Responsibilities:**

- View all storage units and their statuses
- Search units by number, barcode, or status
- Mark units as clean after cleaning
- Update warehouse locations and unit names
- Upload CSV batch imports for new units
- View unit usage history and access requests
- Review and upload unit photos

---

### Packing Supply Inventory

**Route:** `/admin/inventory`

Manage packing supply products and stock levels.

**Responsibilities:**

- View all packing supply products
- Edit product details and descriptions
- Track stock counts
- Mark products as out of stock when depleted
- Set restock dates and reminders
- Manage product images

---

## Customer & Feedback

### Customer Management

**Route:** `/admin/customers`

View and manage customer accounts.

**Responsibilities:**

- Search customers by name, email, or phone
- View customer appointment history
- Review assigned storage units
- View packing supply order history
- Handle customer inquiries

---

### Feedback Management

**Route:** `/admin/feedback`

Monitor and respond to all customer feedback.

**Responsibilities:**

- Review all customer feedback and ratings
- Filter and prioritize negative feedback (≤3 rating)
- Send email responses to customers
- Track response status
- Identify trends in feedback for service improvement

---

## Admin-Only Features

### Ask Database (AI Query)

**Route:** `/admin/ask-database`

Query the database using natural language for insights.

**Responsibilities:**

- Formulate queries in natural language
- Analyze data insights
- Generate reports for decision-making

---

### Admin Invites (SuperAdmin Only)

**Route:** `/admin/invites`

Manage admin user invitations and roles.

**Responsibilities:**

- Send invitations to new admin users
- Assign appropriate roles (Admin, SuperAdmin, Viewer)
- Manage admin team access

---

## Role Permissions

| Role           | Access Level                               |
| -------------- | ------------------------------------------ |
| **Viewer**     | Read-only access to all admin pages        |
| **Admin**      | Full access to all admin functions         |
| **SuperAdmin** | Full access + ability to invite new admins |

---

## Quick Reference: Daily Tasks

1. **Morning Check**
   - Review dashboard for today's jobs
   - Check pending approvals (drivers, movers, vehicles)
   - Review task counts and prioritize

2. **Throughout the Day**
   - Process storage unit assignments
   - Handle driver assignment reminders
   - Prep units and orders for delivery
   - Process returns and cleaning tasks

3. **End of Day**
   - Respond to negative feedback
   - Review completed jobs
   - Update any pending storage unit locations
