# Boombox 11.0 - Pages Overview

This document provides a comprehensive list of all pages in the Boombox 11.0 application, organized by route groups.

## Table of Contents

- [Public Pages](#public-pages)
- [Authentication Pages](#authentication-pages)
- [Dashboard - Admin](#dashboard---admin)
- [Dashboard - Customer](#dashboard---customer)
- [Dashboard - Service Provider (Driver)](#dashboard---service-provider-driver)
- [Dashboard - Service Provider (Mover)](#dashboard---service-provider-mover)

---

## Public Pages

### `/` - Home/Landing Page

Main homepage featuring hero section, how it works, customer reviews, and company information.

### `/blog` - Blog Index

List of all blog posts and articles.

### `/blog/[slug]` - Individual Blog Post

Dynamic route for individual blog post content.

### `/careers` - Careers Page

Job opportunities and career information.

### `/checklist` - Moving Checklist

Helpful checklist for customers planning their move.

### `/feedback/[token]` - Public Feedback Form

Token-based feedback submission page for completed services.

### `/get-quote` - Get Quote Form

Primary customer entry point for requesting storage and moving service quotes.

### `/help-center` - Help Center

Customer support resources and FAQs.

### `/howitworks` - How It Works

Explanation of Boombox's service process and workflow.

### `/insurance` - Insurance Information

Details about storage insurance options and coverage.

### `/locations` - Service Locations

Geographic areas and cities where Boombox operates.

### `/packing-supplies` - Packing Supplies Store

Browse and purchase packing materials.

### `/packing-supplies/feedback/[token]` - Packing Supply Feedback

Token-based feedback for packing supply orders.

### `/packing-supplies/tracking/[token]` - Packing Supply Tracking

Track packing supply delivery status.

### `/sitemap` - Site Map

Complete list of all public pages and links.

### `/storage-calculator` - Storage Calculator

Interactive tool to estimate storage unit needs based on items.

### `/storage-guidelines` - Storage Guidelines

Rules and best practices for storing items.

### `/storage-unit-prices` - Storage Unit Pricing

Detailed pricing information for storage units.

### `/terms` - Terms of Service

Legal terms and conditions.

### `/tracking/[token]` - Order Tracking

Track moving and storage appointment status.

### `/vehicle-requirements` - Vehicle Requirements

Specifications for service provider vehicles.

---

## Authentication Pages

### `/login` - User Login

Authentication page for customers, drivers, movers, and admins.

### `/admin/login` - Admin Login

Dedicated admin authentication page.

### `/admin/signup` - Admin Signup

Admin account registration.

### `/driver-accept-invite` - Driver Invite Acceptance

Page for drivers to accept job invitations.

### `/driver-signup` - Driver Registration

Driver account creation and onboarding.

### `/mover-signup` - Moving Partner Signup

Moving partner registration and network enrollment.

---

## Dashboard - Admin

### `/admin` - Admin Dashboard Home

Overview of operations, job statuses, and approval queues.

### `/admin/ask-database` - Database Query Interface

Admin tool for querying the database directly.

### `/admin/calendar` - Admin Calendar View

Calendar view of all appointments and schedules.

### `/admin/customers` - Customer Management

List and manage all customer accounts.

### `/admin/delivery-routes` - Delivery Routes

Manage and optimize delivery routes.

### `/admin/drivers` - Driver Management

View, approve, and manage driver accounts.

### `/admin/feedback` - Feedback Management

Review and respond to customer feedback.

### `/admin/inventory` - Inventory Management

Track storage units, availability, and location.

### `/admin/invites` - Invite Management

Manage driver and mover invitations.

### `/admin/jobs` - Jobs Overview

View and manage all moving and storage jobs.

### `/admin/movers` - Mover Management

View, approve, and manage moving partner accounts.

### `/admin/storage-units` - Storage Unit Management

Detailed storage unit tracking and allocation.

### `/admin/vehicles` - Vehicle Management

Track and approve service provider vehicles.

### `/admin/tasks` - Task List

All pending administrative tasks requiring action.

### `/admin/tasks/cleaning/[taskId]` - Cleaning Task Detail

Manage individual storage unit cleaning tasks.

### `/admin/tasks/feedback/[taskId]` - Feedback Task Detail

Handle specific customer feedback issues.

### `/admin/tasks/prep-delivery/[taskId]` - Delivery Prep Task

Prepare storage units for delivery to customer.

### `/admin/tasks/prep-packing/[taskId]` - Packing Prep Task

Prepare packing supplies for customer delivery.

### `/admin/tasks/requested-unit/[taskId]` - Unit Request Task

Handle customer storage unit requests.

### `/admin/tasks/storage-return/[taskId]` - Storage Return Task

Manage storage unit return to warehouse.

### `/admin/tasks/storage/[taskId]` - Storage Task Detail

Handle storage-related administrative tasks.

### `/admin/tasks/unassigned-driver/[taskId]` - Unassigned Driver Task

Assign drivers to jobs without assigned drivers.

### `/admin/tasks/update-location/[taskId]` - Location Update Task

Update job or storage unit locations.

---

## Dashboard - Customer

### `/customer/[id]` - Customer Dashboard

Main customer dashboard showing appointments and storage units.

### `/customer/[id]/access-storage` - Access Storage Unit

Request access/retrieval of stored items.

### `/customer/[id]/account-info` - Account Information

View and edit customer account details.

### `/customer/[id]/add-storage` - Add Storage Units

Purchase additional storage units.

### `/customer/[id]/edit-appointment` - Edit Appointment

Modify existing moving or storage appointments.

### `/customer/[id]/packing-supplies` - Order Packing Supplies

Purchase packing materials from customer dashboard.

### `/customer/[id]/payments` - Payment Management

View payment history and manage payment methods.

### `/customer/mover-change/[token]` - Mover Change Request

Token-based page to handle moving partner changes.

---

## Dashboard - Service Provider (Driver)

### `/service-provider/driver/[id]` - Driver Dashboard

Main driver dashboard showing upcoming jobs and earnings.

### `/service-provider/driver/[id]/account-information` - Driver Account Info

View and edit driver profile information.

### `/service-provider/driver/[id]/best-practices` - Best Practices

Driver guidelines and training resources.

### `/service-provider/driver/[id]/calendar` - Driver Calendar

Personal calendar for managing availability.

### `/service-provider/driver/[id]/coverage-area` - Coverage Area

Define and manage service coverage areas.

### `/service-provider/driver/[id]/jobs` - Driver Jobs

List of assigned and completed jobs.

### `/service-provider/driver/[id]/payment` - Driver Payment Info

Earnings, payment history, and payout information.

### `/service-provider/driver/[id]/vehicle` - Driver Vehicle

Manage registered vehicle information.

### `/service-provider/driver/[id]/vehicle/add-vehicle` - Add Vehicle

Register a new vehicle for service.

### `/service-provider/driver/[id]/view-calendar` - View Calendar

Read-only calendar view of scheduled jobs.

### `/service-provider/driver/offer/[token]` - Job Offer

Token-based page to accept or decline job offers.

### `/service-provider/driver/packing-supply-offer/[token]` - Packing Supply Job Offer

Accept or decline packing supply delivery jobs.

---

## Dashboard - Service Provider (Mover)

### `/service-provider/mover/[id]` - Mover Dashboard

Main moving partner dashboard showing business overview.

### `/service-provider/mover/[id]/account-information` - Mover Account Info

View and edit moving partner business information.

### `/service-provider/mover/[id]/best-practices` - Best Practices

Moving partner guidelines and training resources.

### `/service-provider/mover/[id]/calendar` - Mover Calendar

Manage company-wide availability and schedules.

### `/service-provider/mover/[id]/coverage-area` - Coverage Area

Define service coverage areas for the moving company.

### `/service-provider/mover/[id]/drivers` - Manage Drivers

View and manage associated driver accounts.

### `/service-provider/mover/[id]/jobs` - Mover Jobs

All jobs assigned to the moving partner company.

### `/service-provider/mover/[id]/payment` - Mover Payment Info

Business earnings and payment information.

### `/service-provider/mover/[id]/vehicle` - Mover Vehicles

Fleet management and vehicle registration.

### `/service-provider/mover/[id]/vehicle/add-vehicle` - Add Vehicle

Register new vehicles to the fleet.

### `/service-provider/mover/[id]/view-calendar` - View Calendar

Read-only calendar view of company schedules.

---

## Summary Statistics

- **Total Pages**: 81
- **Public Pages**: 22
- **Authentication Pages**: 6
- **Admin Dashboard Pages**: 29
- **Customer Dashboard Pages**: 8
- **Driver Dashboard Pages**: 12
- **Mover Dashboard Pages**: 12

---

_Last Updated: February 5, 2026_
