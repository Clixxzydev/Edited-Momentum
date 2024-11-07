// Path: /routes/vbucks.ts
// Create this new file

import { Router } from "express";
const app = Router();

import User from "../model/user";
import Profile from "../model/profiles";
import error from "../utilities/structs/error";
import { verifyToken } from "../middleware/auth";

app.post("/account/api/public/vbucks/claim", verifyToken, async (req: any, res) => {
    const DAILY_VBUCKS = 150;
    const COOLDOWN_HOURS = 24;
    
    try {
        const user = await User.findOne({ accountId: req.user.accountId });
        if (!user) {
            return error.createError(
                "errors.com.epicgames.account.account_not_found",
                "Account not found",
                undefined,
                18007,
                undefined,
                404,
                res
            );
        }

        // Check if user is banned
        if (user.banned) {
            return error.createError(
                "errors.com.epicgames.account.account_banned",
                `Account ${user.accountId} is banned`,
                [user.accountId],
                18007,
                undefined,
                403,
                res
            );
        }

        // Check cooldown
        const now = new Date();
        if (user.lastVBucksClaim) {
            const timeSinceLastClaim = now.getTime() - new Date(user.lastVBucksClaim).getTime();
            const hoursRemaining = COOLDOWN_HOURS - (timeSinceLastClaim / (1000 * 60 * 60));
            
            if (hoursRemaining > 0) {
                return error.createError(
                    "errors.com.epicgames.vbucks.cooldown",
                    `Cannot claim vbucks yet. Try again in ${Math.ceil(hoursRemaining)} hours`,
                    undefined,
                    1001,
                    undefined,
                    400,
                    res
                );
            }
        }

        // Update vbucks in profile
        const profile = await Profile.findOneAndUpdate(
            { accountId: user.accountId },
            { 
                $inc: { 
                    'profiles.common_core.items.Currency:MtxPurchased.quantity': DAILY_VBUCKS 
                }
            },
            { new: true }
        );

        if (!profile) {
            return error.createError(
                "errors.com.epicgames.profile.not_found",
                "Profile not found",
                undefined,
                18007,
                undefined,
                404,
                res
            );
        }

        // Update last claim time
        await User.updateOne(
            { accountId: user.accountId },
            { $set: { lastVBucksClaim: now } }
        );

        res.json({
            status: "success",
            vbucksGranted: DAILY_VBUCKS,
            nextClaimTime: new Date(now.getTime() + (COOLDOWN_HOURS * 60 * 60 * 1000)).toISOString()
        });

    } catch (err) {
        return error.createError(
            "errors.com.epicgames.common.server_error",
            "Internal Server Error",
            undefined,
            1000,
            undefined,
            500,
            res
        );
    }
});

export default app;
