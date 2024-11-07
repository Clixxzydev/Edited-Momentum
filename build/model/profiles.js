import mongoose from "mongoose";
const ProfilesSchema = new mongoose.Schema({
    created: { type: Date, required: true },
    accountId: { type: String, required: true, unique: true },
    profiles: { type: Object, required: true }
}, {
    collection: "profiles"
});
const profileSchema = new mongoose.Schema({
    accountId: { type: String, required: true },
    lastVBucksClaim: { type: Date, default: null },
    profiles: {
        common_core: {
            items: {
                'Currency:MtxPurchased': {
                    quantity: { type: Number, default: 0 }
                }
            }
        }
    }
    // ... rest of your schema
});
const model = mongoose.model('ProfilesSchema', ProfilesSchema);
export default model;
//# sourceMappingURL=profiles.js.map