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

            await db.createPlayerEntryIfNotExist(target.id, nickname, 0);
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
    },
    {
        command: (new SlashCommandBuilder())
            .setName("set_matches_played")
            .setDescription("Set a player's matches played, create player entry if not exist")
            .addUserOption((option) =>
                option.setName('user').setDescription('target').setRequired(true)
            )
            .addNumberOption((option) =>
                option.setName('matches_played').setDescription('matches played').setMinValue(0).setRequired(true)
            ),
        func: async (interaction)=>{
            const matchesPlayed = parseInt(interaction.options.getNumber('matches_played'));
            const target = interaction.options.getUser('user');

            await db.createPlayerEntryIfNotExist(target.id, target.displayName, 0);
            db.setPlayerMatchesPlayed(target.id, matchesPlayed);

            interaction.reply(`Set <@${target.id}>'s matches played to ${matchesPlayed}`)
        },
        eboardOnly: true
    }
]
