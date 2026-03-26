import { prisma } from '@/lib/database/prismaClient';
import { HaulJobType, HaulJobStatus } from '@prisma/client';

function generateJobCode(): string {
  const prefix = 'HAUL';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export interface CreateHaulJobInput {
  type: HaulJobType;
  originWarehouseId: number;
  destinationWarehouseId: number;
  storageUnitIds: number[];
  haulingPartnerId?: number;
  scheduledDate?: Date;
  scheduledTime?: string;
  notes?: string;
}

export class HaulJobService {
  async createHaulJob(input: CreateHaulJobInput) {
    const {
      type,
      originWarehouseId,
      destinationWarehouseId,
      storageUnitIds,
      haulingPartnerId,
      scheduledDate,
      scheduledTime,
      notes,
    } = input;

    if (storageUnitIds.length === 0) {
      throw new Error('At least one storage unit is required');
    }

    const jobCode = generateJobCode();

    const haulJob = await prisma.haulJob.create({
      data: {
        jobCode,
        type,
        status: haulingPartnerId
          ? HaulJobStatus.SCHEDULED
          : HaulJobStatus.PENDING,
        originWarehouseId,
        destinationWarehouseId,
        haulingPartnerId: haulingPartnerId || null,
        scheduledDate: scheduledDate || null,
        scheduledTime: scheduledTime || null,
        notes: notes || null,
        units: {
          create: storageUnitIds.map(storageUnitId => ({
            storageUnitId,
          })),
        },
      },
      include: {
        units: { include: { storageUnit: true } },
        originWarehouse: true,
        destinationWarehouse: true,
        haulingPartner: true,
      },
    });

    return haulJob;
  }

  async getHaulJob(id: number) {
    return await prisma.haulJob.findUnique({
      where: { id },
      include: {
        units: {
          include: {
            storageUnit: {
              select: { id: true, storageUnitNumber: true, status: true },
            },
          },
        },
        originWarehouse: true,
        destinationWarehouse: true,
        haulingPartner: { select: { id: true, name: true, email: true } },
        onfleetTasks: true,
      },
    });
  }

  async listHaulJobs(filters?: { status?: HaulJobStatus; type?: HaulJobType }) {
    return await prisma.haulJob.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.type && { type: filters.type }),
      },
      include: {
        originWarehouse: { select: { name: true, city: true } },
        destinationWarehouse: { select: { name: true, city: true } },
        haulingPartner: { select: { id: true, name: true } },
        units: {
          select: {
            id: true,
            storageUnit: { select: { storageUnitNumber: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateHaulJobStatus(id: number, status: HaulJobStatus) {
    const updateData: any = { status };
    if (status === HaulJobStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    return await prisma.haulJob.update({
      where: { id },
      data: updateData,
    });
  }

  async assignHaulingPartner(jobId: number, haulingPartnerId: number) {
    return await prisma.haulJob.update({
      where: { id: jobId },
      data: {
        haulingPartnerId,
        status: HaulJobStatus.SCHEDULED,
      },
    });
  }

  async confirmLoading(
    jobId: number,
    unitConfirmations: { storageUnitId: number; loaded: boolean }[]
  ) {
    const updates = unitConfirmations.map(uc =>
      prisma.haulJobUnit.updateMany({
        where: { haulJobId: jobId, storageUnitId: uc.storageUnitId },
        data: { loadConfirmed: uc.loaded },
      })
    );

    await Promise.all(updates);

    return await this.updateHaulJobStatus(jobId, HaulJobStatus.IN_TRANSIT);
  }

  async confirmArrival(
    jobId: number,
    unitDamageReports: {
      storageUnitId: number;
      damaged: boolean;
      photos?: string[];
    }[]
  ) {
    const updates = unitDamageReports.map(udr =>
      prisma.haulJobUnit.updateMany({
        where: { haulJobId: jobId, storageUnitId: udr.storageUnitId },
        data: {
          damageReported: udr.damaged,
          damagePhotos: udr.photos || [],
        },
      })
    );

    await Promise.all(updates);

    return await this.updateHaulJobStatus(jobId, HaulJobStatus.UNLOADING);
  }

  async confirmUnloading(
    jobId: number,
    unitLocations: { storageUnitId: number; warehouseLocation: string }[]
  ) {
    const job = await prisma.haulJob.findUnique({
      where: { id: jobId },
      include: { destinationWarehouse: true },
    });

    if (!job) throw new Error('Haul job not found');

    const updates = unitLocations.map(async ul => {
      await prisma.haulJobUnit.updateMany({
        where: { haulJobId: jobId, storageUnitId: ul.storageUnitId },
        data: {
          unloadConfirmed: true,
          warehouseLocation: ul.warehouseLocation,
        },
      });

      await prisma.storageUnitUsage.updateMany({
        where: { storageUnitId: ul.storageUnitId, usageEndDate: null },
        data: {
          warehouseId: job.destinationWarehouseId,
          warehouseName: job.destinationWarehouse.name,
          warehouseLocation: ul.warehouseLocation,
        },
      });
    });

    await Promise.all(updates);

    return await this.updateHaulJobStatus(jobId, HaulJobStatus.COMPLETED);
  }
}

export const haulJobService = new HaulJobService();
