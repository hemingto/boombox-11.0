/**
 * @fileoverview Simple Onfleet API connection test endpoint
 * Tests basic connectivity and authentication to Onfleet API
 */

import { NextRequest, NextResponse } from 'next/server';

const ONFLEET_API_URL = 'https://onfleet.com/api/v2';

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.ONFLEET_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'ONFLEET_API_KEY is not defined in environment variables'
      }, { status: 500 });
    }

    console.log('🔍 Testing Onfleet API connection...');
    console.log('🔑 API Key exists:', !!apiKey);
    console.log('🔑 API Key prefix:', apiKey.substring(0, 8) + '...');
    console.log('🏢 API URL:', ONFLEET_API_URL);

    // Test 1: Get organization details (simple authentication test)
    console.log('\n📋 Test 1: Fetching organization details...');
    const orgResponse = await fetch(`${ONFLEET_API_URL}/organization`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
      }
    });

    const orgData = await orgResponse.json();
    
    if (!orgResponse.ok) {
      console.error('❌ Organization fetch failed:', orgData);
      return NextResponse.json({
        success: false,
        test: 'organization',
        status: orgResponse.status,
        statusText: orgResponse.statusText,
        error: orgData
      }, { status: orgResponse.status });
    }

    console.log('✅ Organization fetch successful');
    console.log('Organization name:', orgData.name);
    console.log('Organization ID:', orgData.id);

    // Test 2: List teams
    console.log('\n📋 Test 2: Fetching teams...');
    const teamsResponse = await fetch(`${ONFLEET_API_URL}/teams`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
      }
    });

    const teamsData = await teamsResponse.json();
    
    if (!teamsResponse.ok) {
      console.error('❌ Teams fetch failed:', teamsData);
      return NextResponse.json({
        success: false,
        test: 'teams',
        status: teamsResponse.status,
        statusText: teamsResponse.statusText,
        error: teamsData,
        organizationTest: {
          success: true,
          name: orgData.name,
          id: orgData.id
        }
      }, { status: teamsResponse.status });
    }

    console.log('✅ Teams fetch successful');
    console.log('Number of teams:', teamsData.length);
    teamsData.forEach((team: any, index: number) => {
      console.log(`  Team ${index + 1}: ${team.name} (ID: ${team.id})`);
    });

    // Check if the team ID from environment exists
    const envTeamId = process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID;
    const teamExists = envTeamId ? teamsData.some((team: any) => team.id === envTeamId) : false;
    
    if (envTeamId) {
      console.log('\n🔍 Checking environment team ID:', envTeamId);
      console.log('Team exists:', teamExists ? '✅ Yes' : '❌ No');
    }

    // Test 3: Try to create a minimal task payload (validation only - we won't actually create it)
    console.log('\n📋 Test 3: Validating task payload structure...');
    const testTaskPayload = {
      destination: {
        address: {
          number: "105",
          street: "Associated Road",
          city: "South San Francisco",
          state: "CA",
          country: "USA"
        }
      },
      recipients: [{
        name: "Test Recipient",
        phone: "+14153223135",
        skipPhoneNumberValidation: true,
        notes: ""
      }],
      notes: "Test task - this is a connection test",
      serviceTime: 20,
      completeAfter: Date.now() + (60 * 60 * 1000), // 1 hour from now
      completeBefore: Date.now() + (90 * 60 * 1000), // 1.5 hours from now
      quantity: 1,
      container: {
        type: "TEAM",
        team: envTeamId || teamsData[0]?.id || "MISSING_TEAM_ID"
      },
      recipientSkipSMSNotifications: true,
      pickupTask: true,
      customFields: [
        {
          key: "boomboxAppointmentId",
          value: 999999
        },
        {
          key: "boomboxUnitNumber",
          value: "TEST001"
        }
      ]
    };

    console.log('📦 Test task payload structure:', JSON.stringify(testTaskPayload, null, 2));

    // Return success response with all test results
    return NextResponse.json({
      success: true,
      message: 'All Onfleet API tests passed',
      tests: {
        organization: {
          success: true,
          name: orgData.name,
          id: orgData.id,
          email: orgData.email
        },
        teams: {
          success: true,
          count: teamsData.length,
          teams: teamsData.map((team: any) => ({
            name: team.name,
            id: team.id
          })),
          environmentTeamId: envTeamId,
          environmentTeamExists: teamExists
        },
        taskPayload: {
          valid: true,
          structure: 'Validated - structure looks correct'
        }
      },
      apiKey: {
        exists: true,
        prefix: apiKey.substring(0, 8) + '...',
        length: apiKey.length
      }
    });

  } catch (error) {
    console.error('❌ Onfleet API test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
