import { prisma } from '@/lib/database/prismaClient';
import { LocationPage, LocationPageStatus, Prisma } from '@prisma/client';

export interface LocationPagePaginationResult {
  locations: LocationPage[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export class LocationPageService {
  static async getPublishedBySlug(slug: string): Promise<LocationPage | null> {
    return prisma.locationPage.findUnique({
      where: { slug, status: LocationPageStatus.PUBLISHED },
    });
  }

  static async getAllPublishedSlugs(): Promise<{ slug: string }[]> {
    return prisma.locationPage.findMany({
      where: { status: LocationPageStatus.PUBLISHED },
      select: { slug: true },
    });
  }

  static async getAllPublished(): Promise<LocationPage[]> {
    return prisma.locationPage.findMany({
      where: { status: LocationPageStatus.PUBLISHED },
      orderBy: { city: 'asc' },
    });
  }

  static async getBySlugsBatch(slugs: string[]): Promise<LocationPage[]> {
    return prisma.locationPage.findMany({
      where: {
        slug: { in: slugs },
        status: LocationPageStatus.PUBLISHED,
      },
      orderBy: { city: 'asc' },
    });
  }

  static async getById(id: string): Promise<LocationPage | null> {
    return prisma.locationPage.findUnique({ where: { id } });
  }

  static async getAll(
    options: {
      page?: number;
      limit?: number;
      status?: LocationPageStatus;
      search?: string;
    } = {}
  ): Promise<LocationPagePaginationResult> {
    const { page = 1, limit = 50, status, search } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { city: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [locations, totalCount] = await Promise.all([
      prisma.locationPage.findMany({
        where,
        orderBy: { city: 'asc' },
        skip,
        take: limit,
      }),
      prisma.locationPage.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      locations,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  static async create(
    data: Prisma.LocationPageCreateInput
  ): Promise<LocationPage> {
    return prisma.locationPage.create({ data });
  }

  static async update(
    id: string,
    data: Prisma.LocationPageUpdateInput
  ): Promise<LocationPage> {
    return prisma.locationPage.update({ where: { id }, data });
  }

  static async delete(id: string): Promise<LocationPage> {
    return prisma.locationPage.delete({ where: { id } });
  }

  static async publish(id: string): Promise<LocationPage> {
    return prisma.locationPage.update({
      where: { id },
      data: {
        status: LocationPageStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  }

  static async unpublish(id: string): Promise<LocationPage> {
    return prisma.locationPage.update({
      where: { id },
      data: { status: LocationPageStatus.DRAFT },
    });
  }

  static async archive(id: string): Promise<LocationPage> {
    return prisma.locationPage.update({
      where: { id },
      data: { status: LocationPageStatus.ARCHIVED },
    });
  }
}
