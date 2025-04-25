import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateHottakeDto, PostHottakeDto } from './dto/create-hottake.dto';
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
    const recipientUsername = dto.to.toLowerCase();
    let sender = dto.sender?.toLowerCase() ;

    const recipient = await this.userModel.findOne({
      username: recipientUsername,
    });
    if (!recipient) {
      throw new NotFoundException(`Recipient user not found.`);
    }

    const senderr = await this.userModel.findOne({
      username: sender,
    });
    if (!senderr) {
      sender = 'anonymous'
    }

    const hottake = new this.hotTakeModel({
      ...dto,
      recipientUsername: recipient.username,
      sender,
    });
    await hottake.save();

    const takeUrl = await this.generateTakeUrl(hottake._id.toString());
    hottake.takeUrl = takeUrl;
    await hottake.save();

    const whatsappMessage = `See my hot take: ${takeUrl}`;
    const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

    const tweetText = `See my hot take`;
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(takeUrl)}`;

    hottake.whatsappShareUrl = whatsappShareUrl;
    hottake.twitterShareUrl = twitterShareUrl;
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

    const takeUrl = await this.generateTakeUrl(hottake._id.toString());
    hottake.takeUrl = takeUrl;
    await hottake.save();

    const whatsappMessage = `See my hot take: ${takeUrl}`;
    const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

    const tweetText = `See my hot take`;
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(takeUrl)}`;

    hottake.whatsappShareUrl = whatsappShareUrl;
    hottake.twitterShareUrl = twitterShareUrl;
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
    username = username.toLocaleLowerCase();
    const user = await this.userModel.findOne({ username });
    if (!user) throw new NotFoundException(`User not found.`);

    let hottakes: any[];

    const matchUserTakes = {
      $or: [{ recipientUsername: username }, { sender: username }],
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

    // Remove takes where the user has already reacted
    hottakes = hottakes.filter((hotTake) => {
      const reactedUser = hotTake.reactedUsers.find(
        (userReaction) => userReaction.username === username,
      );
      return !reactedUser; // Only include takes where the user has not reacted
    });

    return {
      totalCount: hottakes.length,
      data: hottakes,
      success: true,
      code: HttpStatus.OK,
      message: hottakes.length ? 'Hot Takes Fetched' : 'No Hot Takes',
    };
  }

  async getAllTakes(
    username: string,
    filter?: FILTERS,
  ): Promise<BaseResponseTypeDTO> {
    let hottakes: HotTake[];

    username = username.toLocaleLowerCase();
    const user = await this.userModel.findOne({ username });
    if (!user) throw new NotFoundException(`User not found.`);

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
        // Newest = Latest 20 takes
        hottakes = await this.hotTakeModel
          .find()
          .sort({ createdAt: -1 })
          .limit(20)
          .exec();
        break;

      default:
        // Return all takes sorted by createdAt by default
        hottakes = await this.hotTakeModel
          .find()
          .sort({ createdAt: -1 })
          .exec();
        break;
    }

    // Filter out takes that the user has already reacted to
    hottakes = hottakes.filter((hotTake) => {
      const recipientUsername = hotTake.recipientUsername?.toLowerCase();
      const alreadyReacted = hotTake.reactedUsers?.some(
        (userReaction) => userReaction.username.toLowerCase() === recipientUsername,
      );
      return !alreadyReacted; // Only include takes where the user has not reacted
    });

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
    username: string,
  ): Promise<BaseResponseTypeDTO> {
    const validReactions = ['hot', 'spicy', 'trash', 'mid', 'cold'];
    username = username.toLowerCase();

    if (!validReactions.includes(reaction)) {
      throw new Error('Invalid reaction type');
    }

    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new NotFoundException(`User not found.`);
    }

    const hotTake = await this.hotTakeModel.findById(hotTakeId);
    if (!hotTake) throw new NotFoundException('Hot take not found');

    // Check if the user has already reacted
    const previousReaction = hotTake.reactedUsers.find(
      (reactedUser) => reactedUser.username === username,
    );

    if (previousReaction) {
      // Remove the previous reaction count
      hotTake[previousReaction.reaction] -= 1;
    }

    // Add the new reaction count
    hotTake[reaction] += 1;

    // Update the user's reaction
    hotTake.reactedUsers = hotTake.reactedUsers.filter(
      (reactedUser) => reactedUser.username !== username,
    );
    hotTake.reactedUsers.push({ username, reaction });

    await hotTake.save();

    return {
      success: true,
      code: HttpStatus.OK,
      message: `${reaction} added`,
    };
  }

  async getTakesForUserCount(username: string): Promise<BaseResponseTypeDTO> {
    username = username.toLowerCase()
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new NotFoundException(`User not found.`);
    }

    const hottakes = await this.hotTakeModel.find({
      recipientUsername: username,
    });

    return {
      totalCount: hottakes.length,
      success: true,
      code: HttpStatus.OK,
      message: hottakes.length > 0 ? 'Hot Takes Fetched' : 'No Hot Takes',
    };
  }

  async getPreviousTakes(
    username: string,
    filter?: FILTERS,
  ): Promise<BaseResponseTypeDTO> {
    let hottakes: HotTake[];

    // Convert the username to lowercase to ensure case-insensitive comparison
    username = username.toLowerCase();
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new NotFoundException(`User not found.`);
    }

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
        // Newest = Latest 20 takes
        hottakes = await this.hotTakeModel
          .find()
          .sort({ createdAt: -1 })
          .limit(20)
          .exec();
        break;

      default:
        // Return all takes sorted by createdAt by default
        hottakes = await this.hotTakeModel
          .find()
          .sort({ createdAt: -1 })
          .exec();
        break;
    }

    // Filter to only include takes where the user has already reacted
    hottakes = hottakes.filter((hotTake) => {
      return hotTake.reactedUsers?.some(
        (userReaction) => userReaction.username.toLowerCase() === username,
      );
    });

    return {
      totalCount: hottakes.length,
      data: hottakes,
      success: true,
      code: HttpStatus.OK,
      message: hottakes.length ? 'Hot Takes Found' : 'No Hot Takes Available',
    };
  }

  // async createHottakes(dto: CreateHottakeDto): Promise<BaseResponseTypeDTO> {
  //   const send = dto.to.toLowerCase();
  //   let sender = send ?? 'anonymous'
  //   if (dto.sender) {
  //     const user = await this.userModel.findOne({ username: send });
  //     if (!user) throw new NotFoundException(`User not found.`);
  //   }
  //   const username = dto.to.toLowerCase();
  //   const user = await this.userModel.findOne({ username });
  //   if (!user) throw new NotFoundException(`User not found.`);

  //   const hottake = new this.hotTakeModel({
  //     ...dto,
  //     recipientUsername: user.username,
  //     sender,
  //   });
  //   await hottake.save();
  //   const data = await hottake.save();

  //   return {
  //     data,
  //     success: true,
  //     code: HttpStatus.CREATED,
  //     message: 'HotTake Created',
  //   };
  // }

  // async getTakesForUser(
  //   username: string,
  //   filter?: FILTERS,
  // ): Promise<BaseResponseTypeDTO> {
  //   const user = await this.userModel.findOne({ username });
  //   if (!user) throw new NotFoundException(`User not found.`);

  //   let hottakes: any[];

  //   const matchUserTakes = {
  //     $or: [{ recipientUsername: username }, { sender: username }],
  //   };

  //   switch (filter) {
  //     case 'trending':
  //       // Trending: Top 5 user-related takes with highest total reactions
  //       hottakes = await this.hotTakeModel.aggregate([
  //         { $match: matchUserTakes },
  //         {
  //           $addFields: {
  //             totalReactions: {
  //               $add: [
  //                 { $ifNull: ['$hot', 0] },
  //                 { $ifNull: ['$spicy', 0] },
  //                 { $ifNull: ['$trash', 0] },
  //                 { $ifNull: ['$mid', 0] },
  //                 { $ifNull: ['$cold', 0] },
  //               ],
  //             },
  //           },
  //         },
  //         { $sort: { totalReactions: -1 } },
  //         { $limit: 5 },
  //       ]);
  //       break;

  //     case 'controversial':
  //       // Controversial: Top 5 most recent takes with mixed reactions (hot, trash, cold)
  //       hottakes = await this.hotTakeModel.aggregate([
  //         { $match: matchUserTakes },
  //         {
  //           $addFields: {
  //             hot: { $ifNull: ['$hot', 0] },
  //             spicy: { $ifNull: ['$spicy', 0] },
  //             trash: { $ifNull: ['$trash', 0] },
  //             cold: { $ifNull: ['$cold', 0] },
  //             mid: { $ifNull: ['$mid', 0] },
  //           },
  //         },
  //         {
  //           $addFields: {
  //             positive: { $add: ['$hot', '$spicy'] },
  //             negative: { $add: ['$trash', '$cold'] },
  //             totalReactions: {
  //               $add: ['$hot', '$spicy', '$trash', '$cold', '$mid'],
  //             },
  //           },
  //         },
  //         {
  //           $match: {
  //             totalReactions: { $gte: 10 }, // Optional engagement threshold
  //           },
  //         },
  //         {
  //           $addFields: {
  //             polarityScore: {
  //               $abs: {
  //                 $divide: [
  //                   { $subtract: ['$positive', '$negative'] },
  //                   '$totalReactions',
  //                 ],
  //               },
  //             },
  //           },
  //         },
  //         { $sort: { polarityScore: 1, createdAt: -1 } },
  //         { $limit: 5 },
  //       ]);
  //       break;

  //     case 'newest':
  //       // Newest: Latest 20 takes involving the user
  //       hottakes = await this.hotTakeModel
  //         .find(matchUserTakes)
  //         .sort({ createdAt: -1 })
  //         .limit(20)
  //         .exec();
  //       break;

  //     default:
  //       // No filter: Return all takes involving the user, sorted by newest
  //       hottakes = await this.hotTakeModel
  //         .find(matchUserTakes)
  //         .sort({ createdAt: -1 })
  //         .exec();
  //       break;
  //   }

  //   return {
  //     totalCount: hottakes.length,
  //     data: hottakes,
  //     success: true,
  //     code: HttpStatus.OK,
  //     message: hottakes.length ? 'Hot Takes Fetched' : 'No Hot Takes',
  //   };
  // }

  // async getAllTakes(username: string, filter?: FILTERS): Promise<BaseResponseTypeDTO> {
  //   let hottakes: HotTake[];

  //   switch (filter) {
  //     case 'trending':
  //       // Trending = Top 5 takes with highest total reactions
  //       hottakes = await this.hotTakeModel.aggregate([
  //         {
  //           $addFields: {
  //             totalReactions: {
  //               $add: [
  //                 { $ifNull: ['$hot', 0] },
  //                 { $ifNull: ['$spicy', 0] },
  //                 { $ifNull: ['$trash', 0] },
  //                 { $ifNull: ['$mid', 0] },
  //                 { $ifNull: ['$cold', 0] },
  //               ],
  //             },
  //           },
  //         },
  //         { $sort: { totalReactions: -1 } },
  //         { $limit: 5 },
  //       ]);
  //       break;

  //     case 'controversial':
  //       // Controversial = Most recent 5 takes with high polarity (mix of hot/trash/cold)
  //       hottakes = await this.hotTakeModel.aggregate([
  //         {
  //           $addFields: {
  //             hot: { $ifNull: ['$hot', 0] },
  //             spicy: { $ifNull: ['$spicy', 0] },
  //             trash: { $ifNull: ['$trash', 0] },
  //             cold: { $ifNull: ['$cold', 0] },
  //             mid: { $ifNull: ['$mid', 0] },
  //           },
  //         },
  //         {
  //           $addFields: {
  //             positive: { $add: ['$hot', '$spicy'] },
  //             negative: { $add: ['$trash', '$cold'] },
  //             totalReactions: {
  //               $add: ['$hot', '$spicy', '$trash', '$cold', '$mid'],
  //             },
  //           },
  //         },
  //         {
  //           $match: {
  //             totalReactions: { $gte: 10 }, // Optional threshold to ensure enough engagement
  //           },
  //         },
  //         {
  //           $addFields: {
  //             polarityScore: {
  //               $abs: {
  //                 $divide: [
  //                   { $subtract: ['$positive', '$negative'] },
  //                   '$totalReactions',
  //                 ],
  //               },
  //             },
  //           },
  //         },
  //         { $sort: { polarityScore: 1, createdAt: -1 } }, // Lower score = more balanced = more controversial
  //         { $limit: 5 },
  //       ]);
  //       break;

  //     case 'newest':
  //       hottakes = await this.hotTakeModel
  //         .find()
  //         .sort({ createdAt: -1 })
  //         .limit(20)
  //         .exec();
  //       break;

  //     default:
  //       hottakes = await this.hotTakeModel
  //         .find()
  //         .sort({ createdAt: -1 })
  //         .exec();
  //       break;
  //   }

  //   return {
  //     totalCount: hottakes.length,
  //     data: hottakes,
  //     success: true,
  //     code: HttpStatus.OK,
  //     message: hottakes.length ? 'Hot Takes Fetched' : 'No Hot Takes Available',
  //   };
  // }

  // async reactToHotTake(
  //   hotTakeId: string,
  //   reaction: string,
  // ): Promise<BaseResponseTypeDTO> {
  //   const validReactions = ['hot', 'spicy', 'trash', 'mid'];

  //   if (!validReactions.includes(reaction)) {
  //     throw new Error('Invalid reaction type');
  //   }

  //   const hotTake = await this.hotTakeModel.findById(hotTakeId);
  //   if (!hotTake) throw new NotFoundException('Hot take not found');

  //   hotTake[reaction] += 1;
  //   hotTake.save();
  //   return {
  //     success: true,
  //     code: HttpStatus.OK,
  //     message: `${reaction} added`,
  //   };
  // }

  generateTakeUrl(id: string): string {
    const baseUrl = process.env.APP_BASE_URL;
    return `${baseUrl}/${encodeURIComponent(id.toLowerCase())}`;
  }
}


