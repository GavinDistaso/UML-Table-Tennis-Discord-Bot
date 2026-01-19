const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');
const eloSystem = require('../elo');

exports.commands = [
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
    }
]
