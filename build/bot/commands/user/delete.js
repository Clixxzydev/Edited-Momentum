import { ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import Users from '../../../model/user.js';
import Profiles from '../../../model/profiles.js';
import Friends from '../../../model/friends.js';
export const data = new SlashCommandBuilder()
    .setName('deleteaccount')
    .setDescription('Deletes your account (irreversible)');
export async function execute(interaction) {
    const user = await Users.findOne({ discordId: interaction.user.id });
    if (!user)
        return interaction.reply({ content: "You are not registered!", ephemeral: true });
    if (user.banned)
        return interaction.reply({ content: "You are banned, and your account cannot therefore be deleted.", ephemeral: true });
    const confirm = new ButtonBuilder()
        .setCustomId('confirm')
        .setLabel('Confirm Deletion')
        .setStyle(ButtonStyle.Danger);
    const cancel = new ButtonBuilder()
        .setCustomId('cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary);
    const row = {
        type: 1,
        components: [confirm.toJSON(), cancel.toJSON()]
    };
    const confirmationEmbed = new EmbedBuilder()
        .setTitle("Are you sure you want to delete your account?")
        .setDescription("This action is irreversible, and will delete all your data.")
        .setColor("#2b2d31")
        .setFooter({
        text: "Reborn",
        iconURL: "https://media.discordapp.net/attachments/1244218942210179083/1298786508697895043/Chapter_2_Season_4_-_Key_Art_-_Fortnite.jpg?ex=671ad4b1&is=67198331&hm=7107d3a708fe663b5aa25d5dda745bb95e76554b7d7bf3e2c503612dee400e76&=&format=webp",
    })
        .setTimestamp();
    const confirmationResponse = await interaction.reply({
        embeds: [confirmationEmbed],
        components: [row],
        ephemeral: true
    });
    const filter = (i) => i.user.id === interaction.user.id;
    const collector = confirmationResponse.createMessageComponentCollector({ filter, time: 10000 });
    collector.on("collect", async (i) => {
        switch (i.customId) {
            case "confirm": {
                await Users.findOneAndDelete({ discordId: interaction.user.id });
                await Profiles.findOneAndDelete({ accountId: user.accountId });
                await Friends.findOneAndDelete({ accountId: user.accountId });
                const confirmEmbed = new EmbedBuilder()
                    .setTitle("Account Deleted")
                    .setDescription("Your account has been deleted, we're sorry to see you go!")
                    .setColor("#2b2d31")
                    .setFooter({
                    text: "Reborn",
                    iconURL: "https://media.discordapp.net/attachments/1244218942210179083/1298786508697895043/Chapter_2_Season_4_-_Key_Art_-_Fortnite.jpg?ex=671ad4b1&is=67198331&hm=7107d3a708fe663b5aa25d5dda745bb95e76554b7d7bf3e2c503612dee400e76&=&format=webp",
                })
                    .setTimestamp();
                i.reply({ embeds: [confirmEmbed], ephemeral: true });
                break;
            }
            case "cancel": {
                const cancelEmbed = new EmbedBuilder()
                    .setTitle("Account Deletion Cancelled")
                    .setDescription("Your account has not been deleted.")
                    .setColor("#2b2d31")
                    .setFooter({
                    text: "Reborn",
                    iconURL: "https://media.discordapp.net/attachments/1244218942210179083/1298786508697895043/Chapter_2_Season_4_-_Key_Art_-_Fortnite.jpg?ex=671ad4b1&is=67198331&hm=7107d3a708fe663b5aa25d5dda745bb95e76554b7d7bf3e2c503612dee400e76&=&format=webp",
                })
                    .setTimestamp();
                i.reply({ embeds: [cancelEmbed], ephemeral: true });
                break;
            }
        }
    });
}
//# sourceMappingURL=delete.js.map