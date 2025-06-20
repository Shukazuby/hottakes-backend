import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsEmail } from "class-validator";

@Schema({ timestamps: true })
export class User {
@Prop()
username: string

@Prop()
hashedUsername: string

@Prop()
@IsEmail()
email?: string

@Prop()
picture?: string

@Prop()
googleId?: string

@Prop() 
token?: string

@Prop()
user_link: string

@Prop()
whatsappShare: string

@Prop()
twitterShare: string

@Prop({default: false})
isWelcomeNotified: boolean

@Prop({default: false})
isInactive1: boolean

@Prop({default: false})
isInactive2: boolean

@Prop({default: false})
isInactive3: boolean
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
