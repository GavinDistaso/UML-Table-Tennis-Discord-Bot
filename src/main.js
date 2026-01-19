const { Client, Events, GatewayIntentBits, Collection, ChatIn, REST, Routes} = require('discord.js');
const { token, clientID } = require('./../config.json');

const eloSystem = require('./elo')

const db = require('./database');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

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
    if (interaction.isCommand()) {
        const command = client.slashCommands.get(interaction.commandName);

        if(command){
            await command.func(interaction);
        }

    }
    if (interaction.isButton()) {
        
    }
});

//

client.login(token);
