import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearSeedData() {
  try {
    console.log('Starting to clear seed data...');
    console.log('⚠️  WARNING: This will delete all data except Admin and StorageUnit records');
    
    // Delete in order of dependencies (most dependent first)
    
    console.log('Deleting OnfleetTask records...');
    await prisma.onfleetTask.deleteMany({});
    
    console.log('Deleting Feedback records...');
    await prisma.feedback.deleteMany({});
    
    console.log('Deleting PackingSupplyFeedback records...');
    await prisma.packingSupplyFeedback.deleteMany({});
    
    console.log('Deleting TimeSlotBooking records...');
    await prisma.timeSlotBooking.deleteMany({});
    
    console.log('Deleting DriverTimeSlotBooking records...');
    await prisma.driverTimeSlotBooking.deleteMany({});
    
    console.log('Deleting RequestedAccessStorageUnit records...');
    await prisma.requestedAccessStorageUnit.deleteMany({});
    
    console.log('Deleting AdditionalAppointmentInfo records...');
    await prisma.additionalAppointmentInfo.deleteMany({});
    
    console.log('Deleting AppointmentCancellation records...');
    await prisma.appointmentCancellation.deleteMany({});
    
    console.log('Deleting DriverCancellation records...');
    await prisma.driverCancellation.deleteMany({});
    
    console.log('Deleting MoverCancellation records...');
    await prisma.moverCancellation.deleteMany({});
    
    console.log('Deleting StorageUnitDamageReport records...');
    await prisma.storageUnitDamageReport.deleteMany({});
    
    console.log('Deleting StorageUnitCleaning records (keeping StorageUnit records)...');
    await prisma.storageUnitCleaning.deleteMany({});
    
    console.log('Deleting StorageUnitUsage records (keeping StorageUnit records)...');
    await prisma.storageUnitUsage.deleteMany({});
    
    console.log('Deleting Notification records...');
    await prisma.notification.deleteMany({});
    
    console.log('Deleting PackingSupplyOrderDetails records...');
    await prisma.packingSupplyOrderDetails.deleteMany({});
    
    console.log('Deleting PackingSupplyOrderCancellation records...');
    await prisma.packingSupplyOrderCancellation.deleteMany({});
    
    console.log('Deleting PackingSupplyOrder records...');
    await prisma.packingSupplyOrder.deleteMany({});
    
    console.log('Deleting PackingSupplyRoute records...');
    await prisma.packingSupplyRoute.deleteMany({});
    
    console.log('Deleting Appointment records...');
    await prisma.appointment.deleteMany({});
    
    console.log('Deleting Product records...');
    await prisma.product.deleteMany({});
    
    console.log('Deleting PackingKit records...');
    await prisma.packingKit.deleteMany({});
    
    console.log('Deleting Vehicle records...');
    await prisma.vehicle.deleteMany({});
    
    console.log('Deleting MovingPartnerDriver records...');
    await prisma.movingPartnerDriver.deleteMany({});
    
    console.log('Deleting DriverInvitation records...');
    await prisma.driverInvitation.deleteMany({});
    
    console.log('Deleting DriverAvailability records...');
    await prisma.driverAvailability.deleteMany({});
    
    console.log('Deleting MovingPartnerAvailability records...');
    await prisma.movingPartnerAvailability.deleteMany({});
    
    console.log('Deleting Driver records...');
    await prisma.driver.deleteMany({});
    
    console.log('Deleting MovingPartner records...');
    await prisma.movingPartner.deleteMany({});
    
    console.log('Deleting ThirdPartyMovingPartner records...');
    await prisma.thirdPartyMovingPartner.deleteMany({});
    
    console.log('Deleting User records...');
    await prisma.user.deleteMany({});
    
    console.log('Deleting VerificationCode records...');
    await prisma.verificationCode.deleteMany({});
    
    console.log('Deleting BlockedDate records...');
    await prisma.blockedDate.deleteMany({});
    
    console.log('Deleting AdminInvite records...');
    await prisma.adminInvite.deleteMany({});
    
    console.log('Deleting AdminLog records...');
    await prisma.adminLog.deleteMany({});
    
    console.log('Deleting NotificationSettings records...');
    await prisma.notificationSettings.deleteMany({});
    
    console.log('Deleting BlogContentBlock records...');
    await prisma.blogContentBlock.deleteMany({});
    
    console.log('Deleting BlogPostTag records...');
    await prisma.blogPostTag.deleteMany({});
    
    console.log('Deleting BlogPost records...');
    await prisma.blogPost.deleteMany({});
    
    console.log('Deleting BlogTag records...');
    await prisma.blogTag.deleteMany({});
    
    console.log('Deleting BlogCategory records...');
    await prisma.blogCategory.deleteMany({});
    
    console.log('\n✅ Successfully cleared all seed data!');
    console.log('✅ Preserved: Admin records and StorageUnit records');
    
    // Show what's left
    const adminCount = await prisma.admin.count();
    const storageUnitCount = await prisma.storageUnit.count();
    
    console.log(`\n📊 Remaining records:`);
    console.log(`   - Admin: ${adminCount}`);
    console.log(`   - StorageUnit: ${storageUnitCount}`);
    
  } catch (error) {
    console.error('❌ Error clearing seed data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearSeedData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

