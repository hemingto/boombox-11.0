/**
 * @fileoverview Service provider data fetching service
 * @source boombox-10.0/src/app/actions/movingPartnerActions.ts (getMovingPartnerData)
 * @refactor Extracted server action into service layer for better organization
 */

'use server';

import { prisma } from '@/lib/database/prismaClient';

export interface ServiceProviderDisplayData {
  id: number;
  title: string;
  description: string;
  price: string;
  reviews: number;
  rating: number;
  link: string;
  featured: boolean;
  imageSrc: string;
}

/**
 * Fetches moving partner data formatted for display in account pages
 * @param moverId - The moving partner ID
 * @returns Formatted moving partner data for display
 */
export async function getMovingPartnerDisplayData(
  moverId: string
): Promise<ServiceProviderDisplayData> {
  try {
    const movingPartner = await prisma.movingPartner.findUnique({
      where: { id: parseInt(moverId) },
      include: {
        feedback: true,
      },
    });

    if (!movingPartner) {
      throw new Error('Moving partner not found');
    }

    // Calculate total reviews and average rating
    const totalReviews = movingPartner.feedback.length;
    const averageRating =
      totalReviews > 0
        ? movingPartner.feedback.reduce((acc, review) => acc + review.rating, 0) /
          totalReviews
        : 0;

    return {
      id: movingPartner.id,
      title: movingPartner.name,
      description: movingPartner.description || '',
      price: `$${movingPartner.hourlyRate}/hr`,
      reviews: totalReviews,
      rating: averageRating,
      link: movingPartner.website || '',
      featured: movingPartner.featured === 'true',
      imageSrc: movingPartner.imageSrc || '',
    };
  } catch (error) {
    console.error('Error fetching moving partner display data:', error);
    throw new Error('Failed to fetch moving partner data');
  }
}

