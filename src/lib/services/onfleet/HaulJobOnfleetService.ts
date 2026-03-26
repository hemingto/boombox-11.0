import { prisma } from '@/lib/database/prismaClient';
import { HaulJobType } from '@prisma/client';

export class HaulJobOnfleetService {
  async createHaulJobTasks(haulJobId: number, customerAddress?: string) {
    const job = await prisma.haulJob.findUnique({
      where: { id: haulJobId },
      include: {
        originWarehouse: true,
        destinationWarehouse: true,
        haulingPartner: true,
        units: { include: { storageUnit: true } },
      },
    });

    if (!job) throw new Error('Haul job not found');
    if (!job.haulingPartner?.onfleetTeamId) {
      throw new Error('Hauling partner does not have an Onfleet team');
    }

    const unitNumbers = job.units
      .map(u => u.storageUnit.storageUnitNumber)
      .join(', ');

    try {
      const onfleet = (await import('@/lib/integrations/onfleetClient'))
        .default;

      const originAddress = `${job.originWarehouse.address}, ${job.originWarehouse.city}, ${job.originWarehouse.state} ${job.originWarehouse.zipCode}`;
      const isDirectDelivery =
        job.type === HaulJobType.STOCKTON_DIRECT_DELIVERY;
      const destAddress =
        isDirectDelivery && customerAddress
          ? customerAddress
          : `${job.destinationWarehouse.address}, ${job.destinationWarehouse.city}, ${job.destinationWarehouse.state} ${job.destinationWarehouse.zipCode}`;

      const task1 = await onfleet.tasks.create({
        destination: {
          address: { unparsed: originAddress },
        },
        recipients: [],
        notes: `HAUL JOB ${job.jobCode} - LOAD\nUnits: ${unitNumbers}\nLoad ${job.units.length} units at ${job.originWarehouse.name}`,
        container: {
          type: 'TEAM' as any,
          team: job.haulingPartner.onfleetTeamId,
        },
        metadata: [{ name: 'job_type', type: 'string', value: 'haul_job' }],
        ...(job.scheduledDate && {
          completeAfter: job.scheduledDate.getTime(),
          completeBefore: job.scheduledDate.getTime() + 8 * 60 * 60 * 1000,
        }),
      });

      const task2Label = isDirectDelivery ? 'DELIVER' : 'ARRIVE';
      const task2Notes = isDirectDelivery
        ? `HAUL JOB ${job.jobCode} - DELIVER\nUnits: ${unitNumbers}\nDeliver to customer`
        : `HAUL JOB ${job.jobCode} - ARRIVE\nUnits: ${unitNumbers}\nConfirm arrival at ${job.destinationWarehouse.name}`;

      const task2 = await onfleet.tasks.create({
        destination: {
          address: { unparsed: destAddress },
        },
        recipients: [],
        notes: task2Notes,
        container: {
          type: 'TEAM' as any,
          team: job.haulingPartner.onfleetTeamId,
        },
        metadata: [{ name: 'job_type', type: 'string', value: 'haul_job' }],
        dependencies: [task1.id],
      });

      const task3 = await onfleet.tasks.create({
        destination: {
          address: { unparsed: destAddress },
        },
        recipients: [],
        notes: `HAUL JOB ${job.jobCode} - ${isDirectDelivery ? 'COMPLETE' : 'UNLOAD'}\nUnits: ${unitNumbers}\n${isDirectDelivery ? 'Confirm delivery complete' : `Unload and place ${job.units.length} units at ${job.destinationWarehouse.name}`}`,
        container: {
          type: 'TEAM' as any,
          team: job.haulingPartner.onfleetTeamId,
        },
        metadata: [{ name: 'job_type', type: 'string', value: 'haul_job' }],
        dependencies: [task2.id],
      });

      const dummyAppointmentId = 0;

      const taskRecords = [
        {
          taskId: task1.id,
          shortId: task1.shortId,
          stepNumber: 1,
          label: 'Load',
        },
        {
          taskId: task2.id,
          shortId: task2.shortId,
          stepNumber: 2,
          label: 'Arrive',
        },
        {
          taskId: task3.id,
          shortId: task3.shortId,
          stepNumber: 3,
          label: 'Unload',
        },
      ];

      for (const tr of taskRecords) {
        await prisma.onfleetTask.create({
          data: {
            appointmentId: dummyAppointmentId,
            taskId: tr.taskId,
            shortId: tr.shortId,
            stepNumber: tr.stepNumber,
            unitNumber: 0,
            haulJobId: haulJobId,
          },
        });
      }

      return { task1, task2, task3 };
    } catch (error) {
      console.error('Error creating Onfleet tasks for haul job:', error);
      throw error;
    }
  }
}

export const haulJobOnfleetService = new HaulJobOnfleetService();
