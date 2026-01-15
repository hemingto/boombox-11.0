/**
 * Helper script to list all teams from Onfleet
 * Run: node scripts/list-onfleet-teams.js
 */

const ONFLEET_API_KEY = process.env.ONFLEET_API_KEY;

if (!ONFLEET_API_KEY) {
  console.error('Error: ONFLEET_API_KEY environment variable not set');
  process.exit(1);
}

async function listOnfleetTeams() {
  const authHeader = Buffer.from(`${ONFLEET_API_KEY}:`).toString('base64');
  
  try {
    const response = await fetch('https://onfleet.com/api/v2/teams', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error fetching teams:', JSON.stringify(error, null, 2));
      process.exit(1);
    }

    const teams = await response.json();
    
    console.log('\n=== ONFLEET TEAMS ===\n');
    console.log(`Found ${teams.length} team(s):\n`);
    
    teams.forEach((team, index) => {
      console.log(`${index + 1}. ${team.name}`);
      console.log(`   ID: ${team.id}`);
      console.log(`   Workers: ${team.workers?.length || 0}`);
      console.log('');
    });
    
    console.log('\n=== COPY THESE TO YOUR .env FILE ===\n');
    teams.forEach(team => {
      const envVarName = team.name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z_]/g, '');
      console.log(`${envVarName}_TEAM_ID="${team.id}"`);
    });
    console.log('');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

listOnfleetTeams();

