import mongoose, { HydratedDocument, Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import bcrypt, { compareSync, hashSync, genSaltSync, genSalt } from "bcrypt";

@Schema({ timestamps: true, versionKey: false, collection: "users" })
export class User {
    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
        default: null,
        index: true,
    })
    role: Types.ObjectId;

    @Prop({ type: String, default: "", index: true })
    firstName: string;

    @Prop({ type: String, default: "", index: true })
    lastName: string;

    @Prop({ type: String, default: "", index: true })
    fullName: string;

    @Prop({ type: String, default: "" })
    countryCode: string;

    @Prop({ type: String, default: "", index: true })
    phone: string;

    @Prop({ type: String, default: "", index: true })
    email: string;

    @Prop({ type: String, default: "" })
    password: string;

    @Prop({ type: String, default: "" })
    profileImage?: string;

    @Prop({ default: false, type: Boolean })
    isAccountVerified: boolean;

    @Prop({ type: String, default: "", index: true })
    stripeCustomerId: string;

    @Prop({ default: false, type: Boolean })
    usedFreeSubscription: boolean;

    @Prop({ type: Date, default: null })
    freeSubscriptionActivatedDate: Date;

    @Prop({ type: Date, default: null })
    freeSubscriptionExpiredDate: Date;

    @Prop({ default: false, type: Boolean })
    freeSubscriptionExpired: boolean;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subscription",
        default: null,
        index: true,
    })
    subscriptionId: Types.ObjectId;

    @Prop({
        type: String,
        default: "Active",
        enum: ["Active", "Inactive"],
        index: true,
    })
    status: string;

    @Prop({ type: Boolean, default: false, index: true })
    isDeleted: boolean;

    @Prop({ type: Boolean, default: false, index: true })
    rememberMe: boolean;

    @Prop({ type: String, default: "", index: true })
    googleId: string;

    @Prop({ type: String, default: "", index: true })
    appleId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);


UserSchema.methods.validPassword = function (password: string) {
    return compareSync(password, this.password);
};

UserSchema.methods.generateHash = function (password: string) {
    return hashSync(password, genSaltSync(Number(process.env.SALT_ROUND) || 10));
};
UserSchema.pre("save", async function (next: any) {
    const user = this as UserDocument;
    if (user.firstName || (user.lastName || user.fullName)) {
        if (user.fullName) {
            const nameParts = user.fullName.split(/\s+/);
            user.firstName = nameParts.slice(0, -1).join(' ').trim() || nameParts[0].trim();
            user.lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1].trim() : "";
        } else {
            user.fullName = `${user.firstName?.trim() || ''} ${user.lastName?.trim() || ''}`.trim();
        }
    }

    if (!user.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    const hash = bcrypt.hashSync(user.password, salt);
    user.password = hash;
    next();
});

UserSchema.pre('findOneAndUpdate', async function (next: any) {
    let update = this.getUpdate() as Partial<UserDocument>;
    if (!update) return next();

    if (update.fullName || update.firstName || update.lastName) {
        const fullName =
            update.fullName ??
            `${update.firstName ?? ""} ${update.lastName ?? ""}`.trim();

        if (fullName) {
            const parts = fullName.trim().split(/\s+/);
            update.firstName = parts[0];
            update.lastName = parts.slice(1).join(" ");
            update.fullName = `${update.firstName} ${update.lastName}`.trim();
        }
    }

    // Hash password if modified
    if (update.password) {
        const salt = await genSalt(10);
        update.password = hashSync(update.password, salt);
    }

    this.setUpdate(update);
    next();
});

export type UserDocument = HydratedDocument<User> & {
    validPassword: (password: string) => boolean;
    generateHash: (password: string) => string;
};
