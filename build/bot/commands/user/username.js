import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Users from '../../../model/user.js';
export const data = new SlashCommandBuilder()
    .setName('username')
    .setDescription('Lets you change your userame')
    .addStringOption(option => option.setName('username')
    .setDescription('Your desired username')
    .setRequired(true));
export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const user = await Users.findOne({ discordId: interaction.user.id });
    if (!user)
        return interaction.reply({ content: "You are not registered!", ephemeral: true });
    let accessToken = global.accessTokens.find(i => i.accountId == user.accountId);
    if (accessToken)
        return interaction.editReply({ content: "Failed to change username as you are currently logged in to Fortnite.\nRun the /sign-out-of-all-sessions command to sign out." });
    const username = interaction.options.getString('username');
    await user.updateOne({ $set: { username: username } });
    const embed = new EmbedBuilder()
        .setTitle("Username changed")
        .setDescription("Your account username has been changed to " + username + "")
        .setColor("#2b2d31")
        .setFooter({
        text: "Reborn",
        iconURL: "https://media.discordapp.net/attachments/1244218942210179083/1298786508697895043/Chapter_2_Season_4_-_Key_Art_-_Fortnite.jpg?ex=671ad4b1&is=67198331&hm=7107d3a708fe663b5aa25d5dda745bb95e76554b7d7bf3e2c503612dee400e76&=&format=webp",
    })
        .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
}
//# sourceMappingURL=username.js.map