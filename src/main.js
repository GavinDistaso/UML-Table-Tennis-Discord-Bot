const { Client, Events, GatewayIntentBits, Collection, ChatIn, REST, Routes, MessageFlags} = require('discord.js');
const { token, clientID } = require('./../config.json');

const eloSystem = require('./elo')

const db = require('./database');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const eBoardRoleID = '832388508458287132';

const adminBypassUserID = '279386278112264193'; // just my id for testing

client.once(Events.ClientReady, (client) => {
	console.log(`Bot running... "${client.user.tag}"`);
});

client.slashCommands = new Collection();

//

//

let commands = [
    ...require('./commands/playerEdits').commands,
    ...require('./commands/playerInfo').commands,
    ...require('./commands/matches').commands,
    ...require('./commands/rankings').commands,
    ...require('./commands/util').commands,
]

let apiCommands = [];

for (const command of commands) {
    client.slashCommands.set(command.command.name, command);
    apiCommands.push(command.command.toJSON())
}

//

const rest = new REST({ version: '10' }).setToken(token);

const data = await rest.put(Routes.applicationCommands(clientID), { body: apiCommands });

//

client.on('interactionCreate', async (interaction) => {
    let isEboard = interaction.member.roles.cache.has(eBoardRoleID) || interaction.user.id == adminBypassUserID;

    if (interaction.isCommand()) {
        const command = client.slashCommands.get(interaction.commandName);

        if((command['eboardOnly'] && command['eboardOnly'] == true && isEboard) || !command['eboardOnly']){
            await command.func(interaction);
        }
        else {
            await interaction.reply({content: "insufficient permissions", flags: [MessageFlags.Ephemeral]})
        }

    }
    if (interaction.isButton()) {
        
    }
});

//

client.login(token);
