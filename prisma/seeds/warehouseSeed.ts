import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const warehouses = [
  {
    name: 'South San Francisco',
    address: '100 E Grand Ave. Unit 2',
    city: 'South San Francisco',
    state: 'CA',
    zipCode: '94080',
    latitude: 37.6553,
    longitude: -122.4061,
    hoursOpen: '08:30',
    hoursClose: '16:30',
    isActive: true,
  },
  {
    name: 'Stockton',
    address: '4233 Coronado Ave',
    city: 'Stockton',
    state: 'CA',
    zipCode: '95204',
    latitude: 37.9577,
    longitude: -121.2908,
    hoursOpen: '08:30',
    hoursClose: '16:30',
    isActive: true,
  },
];

export async function seedWarehouses() {
  console.log('Seeding warehouses...');

  for (const warehouse of warehouses) {
    await prisma.warehouse.upsert({
      where: { name: warehouse.name },
      update: warehouse,
      create: warehouse,
    });
  }

  const ssfWarehouse = await prisma.warehouse.findUnique({
    where: { name: 'South San Francisco' },
  });

  if (ssfWarehouse) {
    const { count } = await prisma.storageUnitUsage.updateMany({
      where: { warehouseId: null },
      data: { warehouseId: ssfWarehouse.id },
    });
    console.log(
      `Backfilled ${count} StorageUnitUsage records with SSF warehouse reference.`
    );
  }

  console.log(`Seeded ${warehouses.length} warehouses.`);
}
