/**
 * @fileoverview Customer Reviews - Centralized testimonial data
 * @source boombox-10.0/src/app/components/howitworks/customerreviewsectionlight.tsx
 * 
 * CENTRALIZED CONFIGURATION:
 * Contains customer testimonials and reviews displayed on:
 * - How It Works page
 * - Landing page (potential future use)
 * - Marketing pages
 * 
 * @refactor Extracted from inline component data to centralized data constants
 */

/**
 * Customer review data structure
 */
export interface CustomerReview {
  id: string;
  customer: string;
  date: string;
  description: string;
  rating?: number;
  verified?: boolean;
}

/**
 * Customer testimonials for the review section
 * These reviews are displayed in the horizontally scrollable customer review section
 */
export const CUSTOMER_REVIEWS: CustomerReview[] = [
  {
    id: 'review-bianca-r-2020-08',
    customer: 'Bianca R',
    date: 'August 2020',
    description: "I've used Boombox pickup & dropoff multiple times since the pandemic started. The Boombox crew has been wonderful every time and they. I've used Boombox pickup & dropoff multiple times been wonderful every time and they.",
  },
  {
    id: 'review-jessie-p-2023-12-01',
    customer: 'Jessie P',
    date: 'December 2023',
    description: "I've used Boombox pickup & dropoff multiple times since the pandemic started. The Boombox crew has been wonderful every time and they. I've used Boombox pickup & dropoff multiple times been wonderful every time and they.",
  },
  {
    id: 'review-dan-w-2023-12',
    customer: 'Dan W',
    date: 'December 2023',
    description: "I've used Boombox pickup & dropoff multiple times since the pandemic started. The Boombox crew has been wonderful every time and they. I've used Boombox pickup & dropoff multiple times been wonderful every time and they.",
  },
  {
    id: 'review-sophie-e-2023-12',
    customer: 'Sophie E',
    date: 'December 2023',
    description: "I've used Boombox pickup & dropoff multiple times since the pandemic started. The Boombox crew has been wonderful every time and they. I've used Boombox pickup & dropoff multiple times been wonderful every time and they.",
  },
  {
    id: 'review-david-r-2023-12',
    customer: 'David R',
    date: 'December 2023',
    description: "I've used Boombox pickup & dropoff multiple times since the pandemic started. The Boombox crew has been wonderful every time and they. I've used Boombox pickup & dropoff multiple times been wonderful every time and they.",
  },
  {
    id: 'review-mike-m-2023-12',
    customer: 'Mike M',
    date: 'December 2023',
    description: "I've used Boombox pickup & dropoff multiple times since the pandemic started. The Boombox crew has been wonderful every time and they. I've used Boombox pickup & dropoff multiple times been wonderful every time and they.",
  },
  {
    id: 'review-tim-o-2023-12',
    customer: 'Tim O',
    date: 'December 2023',
    description: "I've used Boombox pickup & dropoff multiple times since the pandemic started. The Boombox crew has been wonderful every time and they. I've used Boombox pickup & dropoff multiple times been wonderful every time and they.",
  },
  {
    id: 'review-jessie-p-2023-12-02',
    customer: 'Jessie P',
    date: 'December 2023',
    description: "I've used Boombox pickup & dropoff multiple times since the pandemic started. The Boombox crew has been wonderful every time and they. I've used Boombox pickup & dropoff multiple times been wonderful every time and they.",
  },
];

/**
 * Helper function to get a review by customer name
 */
export function getReviewByCustomer(customerName: string): CustomerReview | undefined {
  return CUSTOMER_REVIEWS.find(review => review.customer === customerName);
}

/**
 * Helper function to get reviews by date range
 */
export function getReviewsByYear(year: number): CustomerReview[] {
  return CUSTOMER_REVIEWS.filter(review => review.date.includes(year.toString()));
}

/**
 * Helper function to get the total number of reviews
 */
export function getReviewCount(): number {
  return CUSTOMER_REVIEWS.length;
}

/**
 * Helper function to get a random subset of reviews
 * Useful for displaying a limited number of reviews on different pages
 */
export function getRandomReviews(count: number): CustomerReview[] {
  const shuffled = [...CUSTOMER_REVIEWS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, CUSTOMER_REVIEWS.length));
}

