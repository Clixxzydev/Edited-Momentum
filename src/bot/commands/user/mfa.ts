import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";

import Users from '../../../model/user.js';

export const data = new SlashCommandBuilder()
    .setName('mfa')
    .setDescription('Toggles the multi factor authentication for your account')

export async function execute(interaction: ChatInputCommandInteraction) {

    const user = await Users.findOne({ discordId: interaction.user.id });
    if (!user) return interaction.reply({ content: "You are not registered!", ephemeral: true });

    if (!user.mfa) {
        await interaction.user.send("Checking if your dms are enabled to enable MFA. Ignore this message if you can see it. Deleting in 10 seconds").then(msg => {
            setTimeout(() => {
                msg.delete();
            }, 10000);
        }).catch(() => {
            interaction.reply({ content: "Please enable your dms to use this command", ephemeral: true });
            return;
        });
    }

    const updatedUser = await Users.findOneAndUpdate({ discordId: interaction.user.id }, { mfa: !user.mfa }, { new: true });

    const embed = new EmbedBuilder()
        .setTitle(`MFA ${updatedUser?.mfa ? "Enabled" : "Disabled"}`)
        .setDescription("MFA has been toggled")
        .setColor("#2b2d31")
        .addFields([
            {
                name: "Username",
                value: user.username,
                inline: true
            },
            {
                name: "Email",
                value: user.email,
                inline: true
            },
            {
                name: "Account ID",
                value: user.accountId
            },
        ])
        .setFooter({
            text: "Reborn",
            iconURL: "https://media.discordapp.net/attachments/1244218942210179083/1298786508697895043/Chapter_2_Season_4_-_Key_Art_-_Fortnite.jpg?ex=671ad4b1&is=67198331&hm=7107d3a708fe663b5aa25d5dda745bb95e76554b7d7bf3e2c503612dee400e76&=&format=webp",
        })
        .setTimestamp();

    interaction.reply({ embeds: [embed], ephemeral: true });

}