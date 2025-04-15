import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateHottakeDto, PostHottakeDto } from './dto/create-hottake.dto';
import { UpdateHottakeDto } from './dto/update-hottake.dto';
import { BaseResponseTypeDTO } from 'src/utils';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/users/entities/user.entity';
import { Model } from 'mongoose';
import { FILTERS, HotTake } from './entities/hottake.entity';

@Injectable()
export class HottakesService {
  constructor(
    @InjectModel(HotTake.name) private readonly hotTakeModel: Model<HotTake>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async createHottakes(dto: CreateHottakeDto): Promise<BaseResponseTypeDTO> {
    const username = dto.to.toLowerCase();
    const user = await this.userModel.findOne({ username });
    if (!user) throw new NotFoundException(`User not found.`);

    const hottake = new this.hotTakeModel({
      ...dto,
      recipientUsername: user.username,
    });
    await hottake.save();
    const data = await hottake.save();

    return {
      data,
      success: true,
      code: HttpStatus.CREATED,
      message: 'HotTake Created',
    };
  }

  async postHottakes(dto: PostHottakeDto): Promise<BaseResponseTypeDTO> {
    const username = dto.sender.toLowerCase();
    const user = await this.userModel.findOne({ username });
    if (!user) throw new NotFoundException(`User not found.`);

    const hottake = new this.hotTakeModel({
      ...dto,
      sender: user.username,
    });
    await hottake.save();
    const data = await hottake.save();

    return {
      data,
      success: true,
      code: HttpStatus.CREATED,
      message: 'HotTake Created',
    };
  }

  async getTakesForUser(
    username: string,
    filter?: FILTERS,
  ): Promise<BaseResponseTypeDTO> {
    const user = await this.userModel.findOne({ username });
    if (!user) throw new NotFoundException(`User not found.`);
  
    let hottakes: any[];
  
    const matchUserTakes = {
      $or: [
        { recipientUsername: username },
        { sender: username },
      ],
    };
  
    switch (filter) {
      case 'trending':
        // Trending: Top 5 user-related takes with highest total reactions
        hottakes = await this.hotTakeModel.aggregate([
          { $match: matchUserTakes },
          {
            $addFields: {
              totalReactions: {
                $add: [
                  { $ifNull: ['$hot', 0] },
                  { $ifNull: ['$spicy', 0] },
                  { $ifNull: ['$trash', 0] },
                  { $ifNull: ['$mid', 0] },
                  { $ifNull: ['$cold', 0] },
                ],
              },
            },
          },
          { $sort: { totalReactions: -1 } },
          { $limit: 5 },
        ]);
        break;
  
      case 'controversial':
        // Controversial: Top 5 most recent takes with mixed reactions (hot, trash, cold)
        hottakes = await this.hotTakeModel.aggregate([
          { $match: matchUserTakes },
          {
            $addFields: {
              hot: { $ifNull: ['$hot', 0] },
              spicy: { $ifNull: ['$spicy', 0] },
              trash: { $ifNull: ['$trash', 0] },
              cold: { $ifNull: ['$cold', 0] },
              mid: { $ifNull: ['$mid', 0] },
            },
          },
          {
            $addFields: {
              positive: { $add: ['$hot', '$spicy'] },
              negative: { $add: ['$trash', '$cold'] },
              totalReactions: {
                $add: ['$hot', '$spicy', '$trash', '$cold', '$mid'],
              },
            },
          },
          {
            $match: {
              totalReactions: { $gte: 10 }, // Optional engagement threshold
            },
          },
          {
            $addFields: {
              polarityScore: {
                $abs: {
                  $divide: [
                    { $subtract: ['$positive', '$negative'] },
                    '$totalReactions',
                  ],
                },
              },
            },
          },
          { $sort: { polarityScore: 1, createdAt: -1 } },
          { $limit: 5 },
        ]);
        break;
  
      case 'newest':
        // Newest: Latest 20 takes involving the user
        hottakes = await this.hotTakeModel
          .find(matchUserTakes)
          .sort({ createdAt: -1 })
          .limit(20)
          .exec();
        break;
  
      default:
        // No filter: Return all takes involving the user, sorted by newest
        hottakes = await this.hotTakeModel
          .find(matchUserTakes)
          .sort({ createdAt: -1 })
          .exec();
        break;
    }
  
    return {
      totalCount: hottakes.length,
      data: hottakes,
      success: true,
      code: HttpStatus.OK,
      message: hottakes.length ? 'Hot Takes Fetched' : 'No Hot Takes',
    };
  }
    
  async getAllTakes(filter?: FILTERS): Promise<BaseResponseTypeDTO> {
    let hottakes: HotTake[];

    switch (filter) {
      case 'trending':
        // Trending = Top 5 takes with highest total reactions
        hottakes = await this.hotTakeModel.aggregate([
          {
            $addFields: {
              totalReactions: {
                $add: [
                  { $ifNull: ['$hot', 0] },
                  { $ifNull: ['$spicy', 0] },
                  { $ifNull: ['$trash', 0] },
                  { $ifNull: ['$mid', 0] },
                  { $ifNull: ['$cold', 0] },
                ],
              },
            },
          },
          { $sort: { totalReactions: -1 } },
          { $limit: 5 },
        ]);
        break;

      case 'controversial':
        // Controversial = Most recent 5 takes with high polarity (mix of hot/trash/cold)
        hottakes = await this.hotTakeModel.aggregate([
          {
            $addFields: {
              hot: { $ifNull: ['$hot', 0] },
              spicy: { $ifNull: ['$spicy', 0] },
              trash: { $ifNull: ['$trash', 0] },
              cold: { $ifNull: ['$cold', 0] },
              mid: { $ifNull: ['$mid', 0] },
            },
          },
          {
            $addFields: {
              positive: { $add: ['$hot', '$spicy'] },
              negative: { $add: ['$trash', '$cold'] },
              totalReactions: {
                $add: ['$hot', '$spicy', '$trash', '$cold', '$mid'],
              },
            },
          },
          {
            $match: {
              totalReactions: { $gte: 10 }, // Optional threshold to ensure enough engagement
            },
          },
          {
            $addFields: {
              polarityScore: {
                $abs: {
                  $divide: [
                    { $subtract: ['$positive', '$negative'] },
                    '$totalReactions',
                  ],
                },
              },
            },
          },
          { $sort: { polarityScore: 1, createdAt: -1 } }, // Lower score = more balanced = more controversial
          { $limit: 5 },
        ]);
        break;

      case 'newest':
        hottakes = await this.hotTakeModel
          .find()
          .sort({ createdAt: -1 })
          .limit(20)
          .exec();
        break;

      default:
        hottakes = await this.hotTakeModel
          .find()
          .sort({ createdAt: -1 })
          .exec();
        break;
    }

    return {
      totalCount: hottakes.length,
      data: hottakes,
      success: true,
      code: HttpStatus.OK,
      message: hottakes.length ? 'Hot Takes Fetched' : 'No Hot Takes Available',
    };
  }

  async getSingleTake(id: string): Promise<BaseResponseTypeDTO> {
    const take = await this.hotTakeModel.findById(id);
    if (!take) throw new NotFoundException('Hot take not found');
    return {
      data: take,
      success: true,
      code: HttpStatus.OK,
      message: 'Take Fetched',
    };
  }

  async deleteTake(id: string): Promise<BaseResponseTypeDTO> {
    const take = await this.hotTakeModel.findById(id);
    if (!take) throw new NotFoundException('Hot take not found');
    await take.deleteOne();
    return {
      success: true,
      code: HttpStatus.OK,
      message: 'Take Deleted',
    };
  }

  async reactToHotTake(
    hotTakeId: string,
    reaction: string,
  ): Promise<BaseResponseTypeDTO> {
    const validReactions = ['hot', 'spicy', 'trash', 'mid'];

    if (!validReactions.includes(reaction)) {
      throw new Error('Invalid reaction type');
    }

    const hotTake = await this.hotTakeModel.findById(hotTakeId);
    if (!hotTake) throw new NotFoundException('Hot take not found');

    hotTake[reaction] += 1;
    hotTake.save();
    return {
      success: true,
      code: HttpStatus.OK,
      message: `${reaction} added`,
    };
  }
}
