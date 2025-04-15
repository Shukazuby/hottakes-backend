import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Token } from './schema/token.schema';

@Injectable()
export class TokenService {
  constructor(
    @InjectModel(Token.name) private readonly tokenModel: Model<Token>,
  ) {}

  // Function to validate password
  async confirmPassword(plainPassword: string, hashedPassword: string) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Function to generate JWT
  async generateJwt(user: any) {
    const payload = { sub: user._id, phoneNumber: user.phoneNumber };
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign(payload, secret, { expiresIn: '48h' });

    return token;
  }

  async verifyAsync(token: string): Promise<any> {
    const tok = await this.tokenModel.findOne({ token }).exec();
    return new Promise((resolve, reject) => {
      jwt.verify(tok?.token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return reject(new UnauthorizedException('Invalid token'));
        }
        resolve(decoded);
      });
    });
  }

  async saveToken(
    userId: string,
    tok: string,
    typ: string,
    min: number,
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + min);

    const token = new this.tokenModel({
      userId,
      token: tok,
      type: typ,
      expiresAt,
    });

    await token.save();
  }

  async hashPassword(password: string) {
    // Validate password length
    if (password.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      );
    }
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasNumber || !hasSpecialChar) {
      throw new BadRequestException(
        'Password must contain at least one number and one special character',
      );
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    return hashedPassword;
  }

  async hashPin(pin: string) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(pin, saltRounds);

    return hashedPassword;
  }

  async confirmPin(pin: string, hashedPin: string) {
    return bcrypt.compare(pin, hashedPin);
  }

}
