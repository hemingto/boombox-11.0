/**
 * @fileoverview Clean availability API endpoint
 * @source boombox-10.0/src/app/api/availability/route.ts
 * @refactor Streamlined API layer using service architecture with caching and optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  validateAvailabilityQuery,
  validateMonthlyParams,
  validateDailyParams 
} from '@/lib/validations/availability.validations';
import { AvailabilityService } from '@/lib/services/AvailabilityService';
import { 
  MonthlyAvailabilityParams, 
  DailyAvailabilityParams,
  AvailabilityError 
} from '@/types/availability.types';

// Initialize service
const availabilityService = new AvailabilityService();

/**
 * GET /api/orders/availability
 * 
 * Query Parameters:
 * - planType: 'DIY' | 'FULL_SERVICE'
 * - type: 'month' | 'date'
 * - numberOfUnits: number (default: 1)
 * 
 * For type='month':
 * - year: string (YYYY)
 * - month: string (1-12)
 * 
 * For type='date':
 * - date: string (YYYY-MM-DD)
 * 
 * @example
 * GET /api/orders/availability?planType=DIY&type=month&year=2024&month=1&numberOfUnits=2
 * GET /api/orders/availability?planType=FULL_SERVICE&type=date&date=2024-01-15&numberOfUnits=1
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());
    
    console.log(`[API /api/orders/availability] Request:`, queryParams);

    const parseResult = validateAvailabilityQuery(queryParams);
    if (!parseResult.success) {
      console.error('[API] Validation error:', parseResult.error.format());
      return NextResponse.json({ 
        error: 'Invalid query parameters', 
        details: parseResult.error.format() 
      }, { status: 400 });
    }

    const { planType, year, month, date, type, numberOfUnits } = parseResult.data;

    // Handle monthly availability
    if (type === 'month') {
      if (!year || !month) {
        return NextResponse.json({ 
          error: 'Year and month are required for monthly availability' 
        }, { status: 400 });
      }

      const monthlyParams: MonthlyAvailabilityParams = {
        planType,
        year: parseInt(year),
        month: parseInt(month),
        numberOfUnits
      };

      // Validate monthly parameters
      const monthlyValidation = validateMonthlyParams(monthlyParams);
      if (!monthlyValidation.success) {
        return NextResponse.json({
          error: 'Invalid monthly parameters',
          details: monthlyValidation.error.format()
        }, { status: 400 });
      }

      const response = await availabilityService.getMonthlyAvailability(monthlyParams);
      
      console.log(`[API] Monthly availability computed in ${response.metadata.queryTimeMs}ms, cache hit: ${response.metadata.cacheHit}`);
      
      return NextResponse.json(response);
    }

    // Handle daily availability
    if (type === 'date') {
      if (!date) {
        return NextResponse.json({ 
          error: 'Date is required for daily availability' 
        }, { status: 400 });
      }

      const dailyParams: DailyAvailabilityParams = {
        planType,
        date,
        numberOfUnits
      };

      // Validate daily parameters
      const dailyValidation = validateDailyParams(dailyParams);
      if (!dailyValidation.success) {
        return NextResponse.json({
          error: 'Invalid daily parameters',
          details: dailyValidation.error.format()
        }, { status: 400 });
      }

      const response = await availabilityService.getDailyTimeSlots(dailyParams);
      
      console.log(`[API] Daily availability computed in ${response.metadata.queryTimeMs}ms, cache hit: ${response.metadata.cacheHit}`);
      
      return NextResponse.json(response);
    }

    // Invalid type parameter
    return NextResponse.json({ 
      error: 'Invalid type parameter. Must be "month" or "date"' 
    }, { status: 400 });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('[API /api/orders/availability] Error:', error);

    // Handle specific availability errors
    if (error instanceof Error && 'code' in error) {
      const availabilityError = error as AvailabilityError;
      
      switch (availabilityError.code) {
        case 'VALIDATION_ERROR':
          return NextResponse.json({
            error: 'Validation failed',
            message: availabilityError.message,
            details: availabilityError.details
          }, { status: 400 });
          
        case 'DATABASE_ERROR':
          return NextResponse.json({
            error: 'Database error',
            message: 'Failed to fetch availability data'
          }, { status: 500 });
          
        case 'CACHE_ERROR':
          console.warn('[API] Cache error, proceeding without cache:', availabilityError.message);
          // Continue without cache - don't fail the request
          break;
          
        case 'BUSINESS_LOGIC_ERROR':
          return NextResponse.json({
            error: 'Business logic error',
            message: availabilityError.message
          }, { status: 422 });
      }
    }

    // Generic error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      error: 'Failed to fetch availability data',
      message: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error',
      metadata: {
        queryTimeMs: totalTime,
        cacheHit: false
      }
    }, { status: 500 });
  }
}

/**
 * GET /api/orders/availability/stats
 * Get cache statistics for monitoring
 */
export async function OPTIONS() {
  try {
    const stats = availabilityService.getCacheStats();
    
    return NextResponse.json({
      cache: stats,
      service: 'AvailabilityService',
      version: '11.0',
      endpoints: {
        monthly: 'GET ?type=month&planType={DIY|FULL_SERVICE}&year={YYYY}&month={1-12}&numberOfUnits={number}',
        daily: 'GET ?type=date&planType={DIY|FULL_SERVICE}&date={YYYY-MM-DD}&numberOfUnits={number}'
      }
    });
  } catch (error) {
    console.error('[API /api/orders/availability/stats] Error:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
} 