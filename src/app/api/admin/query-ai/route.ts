/**
 * @fileoverview AI-powered database query interface for admin users
 * @source boombox-10.0/src/app/api/ai/query-ai/route.ts
 * @refactor Moved to admin domain with centralized validation and error handling
 * 
 * SECURITY NOTICE: This endpoint allows AI-generated SQL queries for admin database analysis.
 * - Only SELECT queries are permitted
 * - OpenAI generates SQL from natural language queries
 * - Queries are executed against the production database using Prisma raw queries
 * - Intended for admin dashboard "Ask Database" feature
 * 
 * USAGE:
 * POST /api/admin/query-ai
 * Body: { query: "Show me all appointments from last month" }
 * Response: { sql: "SELECT...", results: [...] }
 */

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/database/prismaClient';
import { AdminQueryAIRequestSchema } from '@/lib/validations/api.validations';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Comprehensive database schema prompt for accurate SQL generation
const SYSTEM_PROMPT = `You are a SQL expert. Only return valid SELECT SQL queries based on a plain English request. 
You are querying a Postgres database with the following schema:

IMPORTANT: 
1. Table names are case-sensitive and must be used exactly as shown below
2. Column names are camelCase (e.g., appointmentId, not appointmentid)
3. Always use double quotes around table names to preserve case sensitivity

Main Tables (case-sensitive names):
- "User" (not user)
  - id, firstName, lastName, email, phoneNumber, verifiedPhoneNumber
- "Appointment" (not appointment)
  - id, userId, movingPartnerId, driverId, date, time, status, appointmentType, address, zipcode
- "MovingPartner" (not movingpartner)
  - id, name, email, phoneNumber, hourlyRate, isApproved
- "Driver" (not driver)
  - id, firstName, lastName, email, phoneNumber, isApproved, status
- "Vehicle" (not vehicle)
  - id, driverId, make, model, year, licensePlate, isApproved
- "StorageUnit" (not storageunit)
  - id, storageUnitNumber, status
- "StorageUnitUsage" (not storageunitusage)
  - id, storageUnitId, userId, usageStartDate, usageEndDate
- "Feedback" (not feedback)
  - id, appointmentId, movingPartnerId, rating, comment
- "AppointmentCancellation" (not appointmentcancellation)
  - id, appointmentId, cancellationFee, cancellationReason, cancellationDate
- "DriverCancellation" (not drivercancellation)
  - id, driverId, appointmentId, cancellationReason, cancellationDate
- "MoverCancellation" (not movercancellation)
  - id, movingPartnerId, appointmentId, cancellationReason, cancellationDate

Key Relationships:
- Appointments are linked to Users, MovingPartners, and Drivers
- StorageUnitUsage links StorageUnits to Users and Appointments
- Feedback is linked to Appointments and MovingPartners
- Vehicles are linked to Drivers and MovingPartners
- MovingPartners can have multiple Drivers through MovingPartnerDriver
- OnfleetTasks are linked to Appointments and Drivers

Common Query Patterns:
- To find appointments: JOIN "Appointment" with "User", "MovingPartner", and/or "Driver"
- To find cancellations: JOIN "Appointment" with "AppointmentCancellation", "DriverCancellation", or "MoverCancellation"
- To find storage usage: JOIN "StorageUnitUsage" with "StorageUnit" and "User"
- To find feedback: JOIN "Feedback" with "Appointment" and "MovingPartner"
- To find driver assignments: JOIN "MovingPartnerDriver" with "MovingPartner" and "Driver"

Example Query for Cancelled Appointments:
SELECT a.*, u."firstName", u."lastName", u."email", u."phoneNumber", 
       ac."cancellationReason", ac."cancellationDate"
FROM "Appointment" a
LEFT JOIN "User" u ON a."userId" = u.id
LEFT JOIN "AppointmentCancellation" ac ON a.id = ac."appointmentId"
WHERE a.status = 'Canceled' 
  AND a.date >= CURRENT_DATE - INTERVAL '1 month'
ORDER BY a.date DESC;

Never return anything except the SQL query. Do not include any explanations or markdown formatting.
Always use proper table names and column names as defined in the schema.
When joining tables, use the correct foreign key relationships.
Always use double quotes around table names to preserve case sensitivity.`;

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = AdminQueryAIRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request format', 
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const { query } = validation.data;

    // Generate SQL using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: query }
      ],
      temperature: 0.1, // Low temperature for consistent, precise SQL generation
    });

    const sqlQuery = completion.choices[0].message.content?.trim();

    if (!sqlQuery) {
      return NextResponse.json(
        { error: 'Failed to generate SQL query' },
        { status: 500 }
      );
    }

    // Security validation: Only SELECT queries are allowed
    if (!sqlQuery.toLowerCase().startsWith('select')) {
      return NextResponse.json(
        { error: 'Only SELECT queries are allowed' },
        { status: 400 }
      );
    }

    // Execute the query using Prisma raw query
    const results = await prisma.$queryRawUnsafe(sqlQuery);

    return NextResponse.json({
      sql: sqlQuery,
      results,
    });

  } catch (error) {
    console.error('[API /api/admin/query-ai] Error processing query:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      // Database errors
      if (error.message.includes('syntax error') || error.message.includes('relation')) {
        return NextResponse.json(
          { error: 'Invalid SQL query generated. Please try rephrasing your question.' },
          { status: 400 }
        );
      }
      
      // OpenAI API errors
      if (error.message.includes('API key') || error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'AI service temporarily unavailable. Please try again later.' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}