import { HttpStatus, Logger } from "@nestjs/common";
import axios, { type AxiosResponse } from 'axios';
import { BaseResponseTypeDTO } from "./utils.types";
import * as dotenv from 'dotenv';
dotenv.config();


const logger = new Logger('UtilFunctions');


export const getAccessToken = async () => {
  const { JWT } = require('google-auth-library');
  const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];
  return new Promise((resolve, reject) => {
    const jwtClient = new JWT(
      `firebase-adminsdk-xcv49@${String(process.env.FCM_PROJECT_ID)}.iam.gserviceaccount.com`,
      null,
      process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      SCOPES,
      null,
    );
    jwtClient.authorize((err, tokens) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(tokens.access_token);
    });
  });
};

export const sendPushNotification = async (
  message: string,
  devicetoken: string,
  subject: string,
): Promise<BaseResponseTypeDTO> => {
  const data = {
    message: {
      // topic: subject,
      token: devicetoken,
      notification: {
        title: subject,
        body: message,
      },
    }, 
  };

  try {
    const accessToken = await getAccessToken();

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    };

    const url = `https://fcm.googleapis.com/v1/projects/${String(process.env.FCM_PROJECT_ID)}/messages:send`;
    const response = await axios.post(url, data, { headers });
    console.log('e reach here')
    console.log(response)
    if (response.status === 200) {
      return {
        success: true,
        message: 'Push notification was sent',
        code: HttpStatus.BAD_GATEWAY,
      };
    }
  } catch (ex) {
    logger.error(ex);
    return {
      success: false,
      code: HttpStatus.BAD_GATEWAY,
      message: `Not sent: ${ex}`,
    };
  }
};
