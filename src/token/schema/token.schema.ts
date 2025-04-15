import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum TokenType {
  ACCESS = "access",
  RESET = "reset",
  REFRESH = "refresh",
}

@Schema()
export class Token {
  @ApiProperty()
  @Prop()
  token: TokenType;

  @Prop()
  type: string;

  @Prop()
  userId: string;

  @Prop() 
  expiresAt: Date;

  @Prop({default: Date.now}) 
  createdAt: Date;

  @Prop({default: Date.now}) 
  updatedAt: Date;

}

export type TokenDocument = Token & Document;
export const TokenSchema = SchemaFactory.createForClass(Token);
