const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');
const eloSystem = require('../elo');

const charting = require('../chart')

const ELO_SYSTEM_INFO_LINK = 'https://mattmazzola.medium.com/implementing-the-elo-rating-system-a085f178e065'
const KVALUE_INFO_LINK = 'https://www.desmos.com/calculator/drekstd8cp'

exports.commands = [
    {
        command: (new SlashCommandBuilder())
            .setName("player_info")
            .setDescription("Retrives a specific players information.")
            .addStringOption((option) =>
                option.setName('user').setDescription('target nickname').setMinLength(1).setRequired(true)
            ),
        func: async (interaction)=>{
            const targetNick = interaction.options.getString('user');

            const playerId = await db.getPlayerIdByNick(targetNick);

            if(!(await db.playerExists(playerId))){
                interaction.reply("Player doesnt exist, use `/set_elo` to add them");
                return;
            }

            let playerData = await db.getPlayerData(playerId);

            let chart = await charting.createChart(playerId);

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
                .setImage('attachment://chart.png')
                .setTimestamp()

            interaction.reply({ embeds: [embed], files: [chart]});

        }
    },
]
