const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');
const eloSystem = require('../elo');

exports.commands = [
    {
        command: (new SlashCommandBuilder())
            .setName("rankings")
            .setDescription("Displays the current rankings in decending order")
            .addNumberOption((option) =>
                option.setName('num_entries').setDescription('Number of ranks to show').setMinValue(1).setRequired(false)
            ),
        func: async (interaction)=>{
            const rankings = await db.getRankings();
            let topRanksEmbed = new EmbedBuilder()
                .setColor(0x22067d)
                .setTitle(`Top Rankings`)

            let numRankings = parseInt(interaction.options.getNumber('num_entries'));
            if(isNaN(numRankings)){
                numRankings = 25;
            }

            let nicknames = [];
            let elos = [];
            let numMatches = [];

            let currentPlace = 1;
            for(const entry of rankings){
                let nickname = entry['nickname'];

                if(currentPlace <= 3){
                    nickname = ['\u{1F947}', '\u{1F948}', '\u{1F949}'][currentPlace - 1] + nickname;
                }

                nicknames.push(nickname);
                elos.push(entry['ELO']);
                numMatches.push(entry['numMatches']);

                if(currentPlace++ >= numRankings){
                    break;
                }
            }

            topRanksEmbed.addFields(
                { name: `Player`, value: nicknames.join('\n'), inline: true },
                { name: `Elo`, value: elos.join('\n'), inline: true },
                { name: `numMatches`, value: numMatches.join('\n'), inline: true }
            )

            interaction.reply({ embeds: [topRanksEmbed]});
        }
    }
]
