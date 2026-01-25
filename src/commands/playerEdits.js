const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');

exports.commands = [
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

            if(!(await db.playerExists(target.id))){
                interaction.reply("Player doesnt exist, use `/set_elo` to add them");
                return;
            }

            db.setPlayerNick(target.id, nickname);

            interaction.reply(`Set <@${target.id}>'s nickname to "${nickname}"`)
        },
        eboardOnly: true
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
        },
        eboardOnly: true
    }
]
