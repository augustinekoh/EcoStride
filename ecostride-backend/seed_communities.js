const fs = require('fs');
const { execSync } = require('child_process');

function runCommand(command) {
  try {
    const output = execSync(command, { encoding: 'utf-8' });
    return output;
  } catch (error) {
    console.error(`Error running command: ${command}`);
    console.error(error.message);
    return null;
  }
}

// 1. Delete guilds with 0 members
const deleteQuery = `DELETE FROM guilds WHERE id NOT IN (SELECT DISTINCT guild_id FROM users WHERE guild_id IS NOT NULL);`;
runCommand(`npx wrangler d1 execute ecostride-db --local --command="${deleteQuery}"`);
console.log("Deleted guilds with 0 members.");

// 2. Generate Fake Communities
const fakeGuilds = [
  { id: 'fake_guild_1', name: 'Nature Protectors', desc: 'Protecting nature one step at a time', icon: '🍃', nat: 'Global' },
  { id: 'fake_guild_2', name: 'Mountain Climbers', desc: 'We hike and plant trees', icon: '⛰️', nat: 'USA' },
  { id: 'fake_guild_3', name: 'City Planters', desc: 'Greening the concrete jungle', icon: '🏙️', nat: 'Singapore' },
  { id: 'fake_guild_4', name: 'Forest Guardians', desc: 'Defending the ancient woods', icon: '🌳', nat: 'Canada' },
  { id: 'fake_guild_5', name: 'Ocean Breeze', desc: 'Coastal cleanup and planting', icon: '🌊', nat: 'Australia' }
];

let queries = '';

for (const guild of fakeGuilds) {
  queries += `INSERT OR IGNORE INTO guilds (id, name, description, icon, nationality, require_approval, admin_id, created_at) VALUES ('${guild.id}', '${guild.name}', '${guild.desc}', '${guild.icon}', '${guild.nat}', 0, 'fake_admin_${guild.id}', ${Date.now()});\n`;
  
  // Create admin user for this guild
  queries += `INSERT OR IGNORE INTO users (id, email, username, guild_id, total_trees_planted, created_at) VALUES ('fake_admin_${guild.id}', 'admin_${guild.id}@fake.com', 'Admin ${guild.name}', '${guild.id}', ${Math.floor(Math.random() * 50 + 50)}, ${Date.now()});\n`;
  
  // Create 5 to 10 members for each guild
  const numMembers = Math.floor(Math.random() * 6) + 5;
  for (let i = 1; i <= numMembers; i++) {
    const userId = `fake_member_${guild.id}_${i}`;
    const username = `EcoMember ${Math.floor(Math.random() * 1000)}`;
    const trees = Math.floor(Math.random() * 40 + 1);
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username.replace(' ', '')}`;
    
    queries += `INSERT OR IGNORE INTO users (id, email, username, guild_id, total_trees_planted, avatar, created_at) VALUES ('${userId}', 'member_${i}@${guild.id}.com', '${username}', '${guild.id}', ${trees}, '${avatar}', ${Date.now()});\n`;
  }
}

// Write queries to file and execute
fs.writeFileSync('seed.sql', queries);
runCommand(`npx wrangler d1 execute ecostride-db --local --file=seed.sql`);
console.log("Seeded fake communities and members.");
