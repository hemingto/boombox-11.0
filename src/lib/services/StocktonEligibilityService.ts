import { prisma } from '@/lib/database/prismaClient';

export class StocktonEligibilityService {
  async getEligibleUnitsForStocktonTransfer() {
    const ssfWarehouse = await prisma.warehouse.findUnique({
      where: { name: 'South San Francisco' },
    });

    if (!ssfWarehouse) {
      console.error('SSF warehouse not found');
      return [];
    }

    const eligibleUsages = await prisma.storageUnitUsage.findMany({
      where: {
        warehouseId: ssfWarehouse.id,
        usageEndDate: null,
        storageUnit: {
          status: 'Occupied',
          haulJobUnits: { none: {} },
        },
        startAppointment: {
          storageTerm: { in: ['6-month', '12-month', '6 months', '12 months'] },
        },
      },
      include: {
        storageUnit: {
          select: { id: true, storageUnitNumber: true, status: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        startAppointment: { select: { storageTerm: true, date: true } },
      },
      orderBy: { usageStartDate: 'asc' },
    });

    return eligibleUsages;
  }

  async getEligibleCount(): Promise<number> {
    const units = await this.getEligibleUnitsForStocktonTransfer();
    return units.length;
  }

  async getUnitsRequestedForReturn() {
    const stocktonWarehouse = await prisma.warehouse.findUnique({
      where: { name: 'Stockton' },
    });

    if (!stocktonWarehouse) return [];

    const returnRequests = await prisma.storageUnitUsage.findMany({
      where: {
        warehouseId: stocktonWarehouse.id,
        usageEndDate: null,
        storageUnit: {
          accessRequests: { some: {} },
        },
      },
      include: {
        storageUnit: {
          select: {
            id: true,
            storageUnitNumber: true,
            accessRequests: {
              where: { unitsReady: false },
              select: { id: true, appointmentId: true },
            },
          },
        },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    return returnRequests.filter(r => r.storageUnit.accessRequests.length > 0);
  }
}

export const stocktonEligibilityService = new StocktonEligibilityService();
