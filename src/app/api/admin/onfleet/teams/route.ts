/**
 * @fileoverview Admin API endpoint to fetch Onfleet teams and configuration
 * @source boombox-10.0/src/app/api/admin/onfleet/teams/route.ts
 * @refactor PHASE 4 - Admin Domain
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that fetches all Onfleet teams via API and returns them with worker counts.
 * Also includes current environment variable configuration for team IDs.
 * 
 * USED BY (boombox-10.0 files):
 * - Admin Onfleet configuration interface
 * - Team management dashboard
 * - Environment variable verification
 * - Worker assignment workflows
 * 
 * INTEGRATION NOTES:
 * - Calls Onfleet API directly with basic auth
 * - Maps team data to simplified format (id, name, worker count)
 * - Returns environment variable status for team ID configuration
 * - Requires ONFLEET_API_KEY environment variable
 * 
 * @refactor No logic changes - direct port with updated imports
 */

import { NextResponse, NextRequest } from 'next/server';

export async function GET() {
  try {
    const onfleetApiKey = process.env.ONFLEET_API_KEY;
    if (!onfleetApiKey) {
      return NextResponse.json({ error: 'Onfleet API key not configured' }, { status: 500 });
    }

    const authHeader = Buffer.from(`${onfleetApiKey}:`).toString('base64');

    const response = await fetch('https://onfleet.com/api/v2/teams', {
      method: 'GET',
      headers: {
        Authorization: `Basic ${authHeader}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData }, { status: response.status });
    }

    const teams = await response.json();

    return NextResponse.json({
      success: true,
      teams: teams.map((team: any) => ({
        id: team.id,
        name: team.name,
        workers: team.workers?.length || 0,
      })),
      environmentVariables: {
        BOOMBOX_DELIVERY_NETWORK_TEAM_ID: process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID || 'NOT_SET',
        STORAGE_UNIT_DELIVERY_TEAM_ID: process.env.STORAGE_UNIT_DELIVERY_TEAM_ID || 'NOT_SET',
        PACKING_SUPPLY_DELIVERY_TEAM_ID: process.env.PACKING_SUPPLY_DELIVERY_TEAM_ID || 'NOT_SET',
      }
    });
  } catch (error: any) {
    console.error('Error fetching Onfleet teams:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 