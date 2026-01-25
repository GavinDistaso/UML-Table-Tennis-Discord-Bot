const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder} = require('discord.js');

const db = require('../database')

exports.commands = [
    {
        command: (new SlashCommandBuilder())
            .setName("download_db")
            .setDescription("Download a SQLite DB that contains a backup of everything."),
        func: async (interaction)=>{
            try{
                const file = new AttachmentBuilder('ratings.sqlite');
                await interaction.reply({
                    files: [file]
                })
            } catch(e){
                console.error(e)
                await interaction.reply("Upload fail")
            }
        }
    },
    {
        command: (new SlashCommandBuilder())
            .setName("dev_fix_sbet500")
            .setDescription("Rawr"),
        func: async (interaction)=>{
            await db.dev_repair_set_all_starting_elo();
        },
        eboardOnly: true
    }
]
