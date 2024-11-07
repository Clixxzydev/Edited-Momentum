import { 
    ChatInputCommandInteraction, 
    SlashCommandBuilder, 
    EmbedBuilder,
    GuildMember
} from "discord.js";
import mongoose from 'mongoose';
import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

// Define User and Profile types since they're from external models
interface IUser extends mongoose.Document {
    discordId: string;
    accountId: string;
}

interface IProfile extends mongoose.Document {
    accountId: string;
    profiles: {
        common_core: {
            items: {
                'Currency:MtxPurchased': {
                    quantity: number;
                }
            }
        }
    }
}

// Import models with types
const Users = mongoose.model<IUser>('Users');
const Profiles = mongoose.model<IProfile>('Profiles');

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Command constants
const COOLDOWN_HOURS = 24;
const MULTIPLIER_ROLE_ID = ''; // Replace with your actual role ID
const MULTIPLIER_VALUE = 2.0;

// Interfaces
interface UserStreak {
    discord_id: string;
    streak: number;
    last_claim: number;
    created_at: number;
    updated_at: number;
}

interface StreakData {
    streak: number;
    lastClaim: Date;
}

interface StreakRewards {
    [key: number]: number;
}

// Progressive rewards based on streak
const STREAK_REWARDS: StreakRewards = {
    1: 300,
    2: 500,
    3: 750,
    4: 1000,
    5: 1300,
    6: 1500,
    7: 1700,
    8: 2000,
    9: 2300,
    10: 2500
};

// Database initialization
let db: Database | null = null;

async function initializeDatabase(): Promise<void> {
    try {
        db = await open({
            filename: path.join(__dirname, 'streaks.db'),
            driver: sqlite3.Database
        });

        // Create streaks table if it doesn't exist
        await db.exec(`
            CREATE TABLE IF NOT EXISTS user_streaks (
                discord_id TEXT PRIMARY KEY,
                streak INTEGER DEFAULT 0,
                last_claim INTEGER,
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                updated_at INTEGER DEFAULT (strftime('%s', 'now'))
            )
        `);

        console.log('Streaks database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Initialize database when module loads
initializeDatabase();

export const data = new SlashCommandBuilder()
    .setName('dailyvbucks')
    .setDescription('Claim your daily V-Bucks reward')
    .setDMPermission(false);

async function getUserStreak(discordId: string): Promise<StreakData> {
    if (!db) throw new Error('Database not initialized');

    const user = await db.get<UserStreak>(
        'SELECT * FROM user_streaks WHERE discord_id = ?',
        [discordId]
    );
    
    if (!user) {
        // Create new user record if doesn't exist
        await db.run(
            'INSERT INTO user_streaks (discord_id, streak, last_claim) VALUES (?, 0, 0)',
            [discordId]
        );
        return { streak: 0, lastClaim: new Date(0) };
    }

    return {
        streak: user.streak,
        lastClaim: new Date(user.last_claim)
    };
}

async function updateUserStreak(discordId: string, streak: number, lastClaim: Date): Promise<void> {
    if (!db) throw new Error('Database not initialized');

    await db.run(
        `UPDATE user_streaks 
         SET streak = ?, last_claim = ?, updated_at = strftime('%s', 'now')
         WHERE discord_id = ?`,
        [streak, lastClaim.getTime(), discordId]
    );
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
        if (!db) {
            await interaction.reply({
                content: 'Database is not initialized. Please try again in a few moments.',
                ephemeral: true
            });
            return;
        }

        const discordId = interaction.user.id;
        const now = new Date();

        // Get user's streak data from database
        const userData = await getUserStreak(discordId);
        const timeDiff = now.getTime() - userData.lastClaim.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // Check cooldown
        if (hoursDiff < COOLDOWN_HOURS) {
            const remainingHours = Math.ceil(COOLDOWN_HOURS - hoursDiff);
            await interaction.reply({
                content: `You can claim your daily V-Bucks again in ${remainingHours} hours!`,
                ephemeral: true
            });
            return;
        }

        // Calculate new streak
        let newStreak = userData.streak;
        if (hoursDiff > 48) {
            // Reset streak if more than 48 hours have passed
            newStreak = 0;
        }
        // Increment streak and cap at 10
        newStreak = Math.min(newStreak + 1, 10);

        // Calculate base reward amount
        let rewardAmount = STREAK_REWARDS[newStreak] || STREAK_REWARDS[10];
        
        // Check for multiplier role
        const hasMultiplierRole = (interaction.member as GuildMember)?.roles?.cache?.has(MULTIPLIER_ROLE_ID) || false;
        let multiplierApplied = false;
        
        if (hasMultiplierRole) {
            rewardAmount = Math.floor(rewardAmount * MULTIPLIER_VALUE);
            multiplierApplied = true;
        }

        // Find user and update V-Bucks in the backend profile
        const user = await Users.findOne({ discordId });
        if (!user) {
            await interaction.reply({ 
                content: "You need to link your Discord account first!", 
                ephemeral: true 
            });
            return;
        }

        const profile = await Profiles.findOneAndUpdate(
            { accountId: user.accountId },
            { $inc: { 'profiles.common_core.items.Currency:MtxPurchased.quantity': rewardAmount } },
            { new: true }
        );
        
        if (!profile) {
            await interaction.reply({ 
                content: "Failed to find your Fortnite profile", 
                ephemeral: true 
            });
            return;
        }

        // Update streak in database
        await updateUserStreak(discordId, newStreak, now);

        // Create embed response
        const embed = new EmbedBuilder()
            .setTitle("Daily V-Bucks Claimed!")
            .setDescription(
                `🎉 Successfully claimed ${rewardAmount} V-Bucks!` +
                (multiplierApplied ? ` (${MULTIPLIER_VALUE}x multiplier applied!)` : '') +
                `\nCurrent Streak: Day ${newStreak}\n` +
                `${newStreak < 10 ? `Next reward: ${STREAK_REWARDS[newStreak + 1]}${multiplierApplied ? ` (${Math.floor(STREAK_REWARDS[newStreak + 1] * MULTIPLIER_VALUE)} with multiplier)` : ''} V-Bucks` : "Maximum streak achieved!"}\n\n` +
                `⚠️ Remember to claim daily to maintain your streak!`
            )
            .setColor("#2b2d31")
            .setFooter({
                text: "Reborn",
                iconURL: "https://cdn.discordapp.com/app-assets/432980957394370572/1084188429077725287.png",
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error in dailyvbucks command:', error);
        await interaction.reply({
            content: 'An error occurred while processing your daily V-Bucks claim.',
            ephemeral: true
        });
    }
}

// Add a function to get all streaks (useful for debugging or admin commands)
export async function getAllStreaks(): Promise<UserStreak[]> {
    if (!db) throw new Error('Database not initialized');
    
    try {
        return await db.all<UserStreak[]>('SELECT * FROM user_streaks ORDER BY streak DESC');
    } catch (error) {
        console.error('Error getting all streaks:', error);
        return [];
    }
}

export default { data, execute, getAllStreaks };