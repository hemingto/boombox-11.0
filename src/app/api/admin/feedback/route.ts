/**
 * @fileoverview Admin feedback management API - GET all feedback (regular and packing supply)
 * @source boombox-10.0/src/app/api/admin/feedback/route.ts (lines 1-101)
 * @refactor Migrated to centralized utilities with consistent error handling
 * 
 * ENDPOINT FUNCTIONALITY:
 * - Fetches both regular appointment feedback and packing supply delivery feedback
 * - Transforms and combines feedback into unified data structure
 * - Returns chronologically sorted feedback list for admin interface
 * 
 * BUSINESS LOGIC:
 * - Handles dual feedback types (appointment vs packing supply)
 * - Standardizes data format for consistent frontend rendering
 * - Maintains original sorting and filtering logic
 * 
 * USED BY:
 * - Admin dashboard feedback management interface
 * - Customer service feedback review workflows
 * - Negative feedback monitoring and response systems
 */

import { NextResponse } from 'next/server';
import { fetchAllFeedbackCombined } from '@/lib/utils/adminTaskUtils';

export async function GET() {
  try {
    const allFeedback = await fetchAllFeedbackCombined();
    return NextResponse.json(allFeedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}