const { Client, Events, GatewayIntentBits, Collection, ChatIn, REST, Routes, SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const { token, clientID } = require('./../config.json');

const eloSystem = require('./elo')

const db = require('./database');

import * as fs from 'fs';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (client) => {
	console.log(`Bot running... "${client.user.tag}"`);
});

client.slashCommands = new Collection();

//

const ELO_SYSTEM_INFO_LINK = 'https://mattmazzola.medium.com/implementing-the-elo-rating-system-a085f178e065'
const KVALUE_INFO_LINK = 'https://www.desmos.com/calculator/drekstd8cp'

//

let commands = [
    {
        command: (new SlashCommandBuilder())
            .setName("set_nick")
            .setDescription("Set a player's nickname, create player entry if not exist")
            .addUserOption((option) =>
                option.setName('user').setDescription('target').setRequired(true)
            )
            .addStringOption((option) =>
                option
                .setName('nickname').setDescription('nickname')
                .setMaxLength(100).setMinLength(1).setRequired(true)
            ),
        func: async (interaction)=>{
            const nickname = interaction.options.getString('nickname');
            const target = interaction.options.getUser('user');

            await db.createPlayerEntryIfNotExist(target.id, nickname, 0);
            db.setPlayerNick(target.id, nickname);

            interaction.reply(`Set <@${target.id}>'s nickname to "${nickname}"`)

            //interaction.reply(JSON.stringify(await db.getPlayerData(target.id)));
        }
    },
    {
        command: (new SlashCommandBuilder())
            .setName("set_elo")
            .setDescription("Set a player's elo, create player entry if not exist")
            .addUserOption((option) =>
                option.setName('user').setDescription('target').setRequired(true)
            )
            .addNumberOption((option) =>
                option.setName('elo').setDescription('elo').setMinValue(0).setRequired(true)
            ),
        func: async (interaction)=>{
            const elo = parseInt(interaction.options.getNumber('elo'));
            const target = interaction.options.getUser('user');

            await db.createPlayerEntryIfNotExist(target.id, target.displayName, 0);
            db.setPlayerELO(target.id, elo);

            interaction.reply(`Set <@${target.id}>'s ELO to ${elo}`)

            //interaction.reply(JSON.stringify(await db.getPlayerData(target.id)));
        }
    },
    {
        command: (new SlashCommandBuilder())
            .setName("game_report")
            .setDescription("report a rating game that took place and automatically update players ELO")
            .addUserOption((option) =>
                option.setName('player_a').setDescription('First Player').setRequired(true)
            )
            .addUserOption((option) =>
                option.setName('player_b').setDescription('Second Player').setRequired(true)
            )
            .addNumberOption((option) =>
                option.setName('score_a').setDescription('First Player Score').setMinValue(0).setRequired(true)
            )
            .addNumberOption((option) =>
                option.setName('score_b').setDescription('Second Player Score').setMinValue(0).setRequired(true)
            ),
        func: async (interaction)=>{
            const playerA = interaction.options.getUser('player_a');
            const playerB = interaction.options.getUser('player_b');

            const scoreA = parseInt(interaction.options.getNumber('score_a'));
            const scoreB = parseInt(interaction.options.getNumber('score_b'));

            if(!(await db.playerExists(playerA.id)) || !(await db.playerExists(playerB.id))){
                interaction.reply("One or both players don't exist, use `/set_elo` to add them");
                return;
            }

            let playerADataPregame = await db.getPlayerData(playerA.id);
            let playerBDataPregame = await db.getPlayerData(playerB.id);

            let [diffA, diffB] = await db.reportGame(playerA.id, playerB.id, scoreA, scoreB);

            //

            let winner = {
                pregameData: playerADataPregame,
                diff: diffA
            };

            let looser = {
                pregameData: playerBDataPregame,
                diff: diffB
            };

            if(scoreB > scoreA){
                let tmp = looser;
                looser = winner;
                winner = tmp;
            }

            //

            let embed = new EmbedBuilder()
                .setColor(0x7f03fc)
                .setTitle(`${playerADataPregame['nickname']} [${playerADataPregame['ELO']}] vs. ${playerBDataPregame['nickname']} [${playerBDataPregame['ELO']}]`)
                .addFields(
                    { name: 'Final score', value: `${scoreA} : ${scoreB}` },
                    { 
                        name: `Winner`, 
                        value: `${winner['pregameData']['nickname']} [${winner['pregameData']['ELO']} + ${Math.abs(winner['diff'])}]\n<@${winner['pregameData']['userDiscordID']}>` 
                    },
                    {
                        name: 'Loser',
                        value: `${looser['pregameData']['nickname']} [${looser['pregameData']['ELO']} - ${Math.abs(looser['diff'])}]\n<@${looser['pregameData']['userDiscordID']}>`
                    }
                )
                .setTimestamp()

            interaction.reply({ embeds: [embed]});
        }
    },
    {
        command: (new SlashCommandBuilder())
            .setName("player_info")
            .setDescription("Retrives a specific players information.")
            .addUserOption((option) =>
                option.setName('user').setDescription('target').setRequired(true)
            ),
        func: async (interaction)=>{
            const target = interaction.options.getUser('user');

            if(!(await db.playerExists(target.id))){
                interaction.reply("Player doesnt exist, use `/set_elo` to add them");
                return;
            }

            let playerData = await db.getPlayerData(target.id);

            let embed = new EmbedBuilder()
                .setColor(0x067d22)
                .setTitle(`${playerData['nickname']} [${playerData['ELO']}]`)
                .setDescription(`<@${playerData['userDiscordID']}>`)
                .addFields(
                    { name: `Nick Name`, value: `${playerData['nickname']}`, inline: true},
                    { name: `ELO`, value: `${playerData['ELO']}`, inline: true},
                    { name: `Matches Played`, value: `${playerData['numMatches']}`, inline: true},
                )
                .addFields(
                    { name: `Discord ID`, value: `${playerData['userDiscordID']}`, inline: true},
                    { 
                        name: `K-Value`, 
                        value: `${eloSystem.calculateKValue(playerData['numMatches'])}[(?)](${KVALUE_INFO_LINK})[(?)](${ELO_SYSTEM_INFO_LINK})`,
                        inline: true
                    }
                )
                .setTimestamp()

            interaction.reply({ embeds: [embed]});

        }
    }
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
