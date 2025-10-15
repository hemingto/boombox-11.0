# Component Folders in boombox-10.0

This document lists all the component folders found in `/boombox-10.0/src/app/components/` for migration reference.

## 📁 Complete Directory Structure

### 🎯 User Interface & Navigation
- **`navbar/`** - Navigation components ✅ **(Already migrated to boombox-11.0)**
- **`buttons/`** - Button components
- **`reusablecomponents/`** - Shared/reusable UI components

### 👤 User-Specific Features
- **`access-storage/`** - Storage access functionality
  - `accessstorageconfirmappointment.tsx`
  - `accessstorageform.tsx`
  - `accessstoragestep1.tsx`
  - `storageunitcheckboxlist.tsx`

- **`add-storage/`** - Add new storage functionality
  - `userpageaddstorageform.tsx`
  - `userpageaddstoragestep1.tsx`
  - `userpageconfirmappointment.tsx`

- **`user-page/`** - User dashboard components
  - *20 component files*

- **`login/`** - Authentication components
  - *4 component files*

### 🚛 Driver & Mover Features
- **`driver/`** - Driver-specific components
  - `drivertips.tsx`

- **`driver-signup/`** - Driver registration flow
  - `addvehicleform.tsx`
  - `drivermoreinfosection.tsx`
  - `driverqualifysection.tsx`
  - `driversignupform.tsx`
  - `driversignuphero.tsx`
  - `whereareyoulocatedinput.tsx`

- **`mover-account/`** - Mover account management
  - *34 component files*

- **`mover-signup/`** - Mover registration flow
  - `moversignupform.tsx`
  - `moversignuphero.tsx`

### 🏢 Admin & Management
- **`admin/`** - Administrative interface components
  - `driver-assignment-modal.tsx`
  - `NaturalLanguageQuery.tsx`
  - `onfleet-tasks-modal.tsx`
  - `requested-storage-unit-selector.tsx`
  - `storage-unit-assignment-modal.tsx`
  - `storage-unit-selector.tsx`
  - `VerificationForm.tsx`

- **`notifications/`** - Notification system components
  - *2 component files*

### 💰 Business & Commerce
- **`getquote/`** - Quote generation workflow
  - `chooselabor.tsx`
  - `confirmappointment.tsx`
  - `getquoteform.tsx`
  - `mobilemyquote.tsx`
  - `myquote.tsx`
  - `quotebuilder.tsx`
  - `verifyphonenumber.tsx`

- **`packing-supplies/`** - Packing supplies ordering
  - *10 component files*

- **`storage-unit-prices/`** - Pricing information
  - *3 component files*

- **`storagecalculator/`** - Storage calculation tools
  - *6 component files*

- **`insurance-coverage/`** - Insurance information
  - `insuranceherosection.tsx`
  - `insurancelegalterms.tsx`
  - `insuranceprices.tsx`
  - `insuranceprotections.tsx`
  - `insurancetopsection.tsx`

### 📅 Appointments & Tracking
- **`appointment-tracking/`** - Appointment status tracking
  - `appointmenttracking.tsx`

- **`edit-appointment/`** - Appointment modification
  - `editaccessstorageappointment.tsx`
  - `editaccessstorageappointmentstep1.tsx`
  - `editaddstorageappointment.tsx`
  - `editaddstorageappointmentstep1.tsx`

### 📍 Location & Geography
- **`locations/`** - Location-based components
  - *6 component files*

### 📚 Content & Information
- **`blog/`** - Blog listing and features
  - `blogallarticles.tsx`
  - `blogherosection.tsx`
  - `blogpopulararticles.tsx`
  - `featuredarticlesection.tsx`

- **`blog-post/`** - Individual blog post components
  - `blogcontent.tsx`
  - `blogposthero.tsx`
  - `fullblogpost.tsx`
  - `recentblogposts.tsx`

- **`helpcenter/`** - Help and support content
  - `faqfilter.tsx`
  - `helpcentercontactus.tsx`
  - `helpcenterguides.tsx`
  - `helpcenterhero.tsx`

- **`howitworks/`** - Process explanation
  - `customerreviewsectionlight.tsx`
  - `getquotehowitworks.tsx`
  - `howitworksfaq.tsx`
  - `howitworksherosection.tsx`
  - `howitworksstepsection.tsx`

- **`landingpage/`** - Homepage components
  - `customerreviewsection.tsx`
  - `faqsection.tsx`
  - `helpcentersection.tsx`
  - `herosection.tsx`
  - `howitworksection.tsx`
  - `securitysection.tsx`
  - `techenabledsection.tsx`
  - `whatfitssection.tsx`

- **`terms/`** - Legal terms and conditions
  - *4 component files*

- **`storage-guidelines/`** - Storage guidelines
  - *2 component files*

- **`vehicle-requirements/`** - Vehicle requirement info
  - *3 component files*

### 🔧 Technical & Support
- **`icons/`** - Icon components ✅ **(Already migrated to boombox-11.0)**
  - `addcreditcardicon.tsx`
  - `amazonpayicon.tsx`
  - `amexicon.tsx`
  - `appleicon.tsx`
  - `boomboxlogo.tsx`
  - `clipboardicon.tsx`
  - `discovericon.tsx`
  - `extraitemsicon.tsx`
  - `facebookicon.tsx`
  - `fullhomeicon.tsx`
  - `furnitureicon.tsx`
  - `googleicon.tsx`
  - `helpicon.tsx`
  - `instagramicon.tsx`
  - `jsbicon.tsx`
  - `lockicon.tsx`
  - `mapicon.tsx`
  - `mastercardicon.tsx`
  - `movinghelpicon.tsx`
  - `onebedroomicon.tsx`
  - `openstorageunit.tsx`
  - `packingsuppliesicon.tsx`
  - `poweredbystripe.tsx`
  - `priceicon.tsx`
  - `rulericon.tsx`
  - `securitycameraicon.tsx`
  - `storageuniticon.tsx`
  - `studioicon.tsx`
  - `threeuniticon.tsx`
  - `truckicon.tsx`
  - `twobedroomicon.tsx`
  - `twouniticon.tsx`
  - `visaicon.tsx`
  - `warehouseicon.tsx`
  - `xicon.tsx`

- **`providers/`** - Context providers
  - *1 component file*

- **`feedback/`** - User feedback forms
  - `feedbackform.tsx`

- **`careers/`** - Career page components
  - `careersbannerphoto.tsx`
  - `careersherosection.tsx`
  - `valuessection.tsx`

- **`checklist/`** - Checklist functionality
  - `checklistsection.tsx`

- **`sitemap/`** - Site navigation
  - *2 component files*

---

## 📊 Summary

**Total: 35 component folders** containing various feature-specific components for the Boombox storage application.

### Migration Status:
- ✅ **Completed**: `navbar/`, `icons/`
- ⏳ **Pending**: 33 remaining folders

### Next Priority for Migration:
1. **`reusablecomponents/`** - High priority (shared across app)
2. **`buttons/`** - High priority (foundational UI)
3. **`getquote/`** - High priority (core business flow)
4. **`user-page/`** - High priority (main user interface)
5. **`landingpage/`** - High priority (main marketing page)

---

*Generated on: August 15, 2024*  
*Source: `/boombox-10.0/src/app/components/`*  
*Target: `/boombox-11.0/src/components/`*
