const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');
const eloSystem = require('../elo');

const ELO_SYSTEM_INFO_LINK = 'https://mattmazzola.medium.com/implementing-the-elo-rating-system-a085f178e065'
const KVALUE_INFO_LINK = 'https://www.desmos.com/calculator/drekstd8cp'

exports.commands = [
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
