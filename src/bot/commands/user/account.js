import Asteria from "../../../utilities/asteriasdk/index.js";
const asteria = new Asteria({
    collectAnonStats: true,
    throwErrors: true,
});
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Users from '../../../model/user.js';
import Profiles from '../../../model/profiles.js';
export const data = new SlashCommandBuilder()
    .setName('account')
    .setDescription('Shows you your account information');
export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
        const user = await Users.findOne({ discordId: interaction.user.id });
        if (!user)
            return interaction.editReply({ content: "You are not registered!" });
        const profile = await Profiles.findOne({ accountId: user.accountId });
        if (!profile)
            return interaction.editReply({ content: "You are not registered!" });
        const selectedSkin = profile.profiles.athena.stats.attributes.favorite_character;
        const selectedSkinSplit = selectedSkin.split(":") || "CID_005_Athena_Commando_M_Default";
        let cosmetic = { images: { icon: "" } };
        try {
            cosmetic = await asteria.getCosmetic("id", selectedSkinSplit[1], true);
        }
        catch (err) {
            cosmetic = { images: { icon: "" } };
        }
        if (!cosmetic)
            cosmetic = { images: { icon: "" } };
        let icon = cosmetic.images.icon;
        const embed = new EmbedBuilder()
            .setTitle("Your account")
            .setDescription("These are your account details")
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
            {
                name: "MFA enabled?",
                value: user.mfa.toString(),
            },
        ])
            .setThumbnail(icon)
            .setFooter({
            text: "Reborn",
            iconURL: "https://media.discordapp.net/attachments/1244218942210179083/1298786508697895043/Chapter_2_Season_4_-_Key_Art_-_Fortnite.jpg?ex=671ad4b1&is=67198331&hm=7107d3a708fe663b5aa25d5dda745bb95e76554b7d7bf3e2c503612dee400e76&=&format=webp",
        })
            .setTimestamp();
        interaction.editReply({ embeds: [embed] });
    }
    catch (err) {
        console.log(err);
        interaction.editReply({ content: "An error occured while executing this command!\n\n" + err });
    }
}
//# sourceMappingURL=account.js.map