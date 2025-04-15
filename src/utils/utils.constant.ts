export enum NODE_ENVIRONMENT {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
}
export const NODE_ENV = process.env.NODE_ENV ?? NODE_ENVIRONMENT.DEVELOPMENT;

export const DefaultPassportLink = {
  male: 'https://ik.imagekit.io/cmz0p5kwiyok/public-images/male-icon_LyevsSXsx.png?updatedAt=1641364918016',
  female:
    'https://ik.imagekit.io/cmz0p5kwiyok/public-images/female-icon_MeVg4u34xW.png?updatedAt=1641364923710',
};

export enum DecodedTokenKey {
  USER_ID = 'id',
  EMAIL = 'email',
  ROLE = 'role',
  AUTH_PROVIDER = 'authProvider',
  TOKEN_INITIALIZED_ON = 'iat',
  TOKEN_EXPIRES_IN = 'exp',
  USER = 'user',
}
export enum ElectricityProvider {
  IBEDC = "IBEDC",
  KEDCO = "KEDCO",
  APLE = "APLE",
  AES_JEDC = "AES_JEDC",
  CEL_JEDC = "CEL_JEDC",
  BEDC = "BEDC",
  EKEDC = "EKEDC",
  KAEDCO = "KAEDCO",
  AEDC = "AEDC",
  PHEDC = "PHEDC",
  IKEDC = "IKEDC",
  EEDC = "EEDC"
}

export enum AirtimeProvider {
  MTN = 'MTN',
  NINE_MOBILE = '9MOBILE',
  GLO = 'GLO',
  AIRTEL = 'AIRTEL',
}

export enum CableProvider {
  GOTV = 'GOTV',
  DSTV = 'DSTV',
  STARTIMES = 'STARTIMES',
}
export enum TransactionType {
  DEBIT = 'Debit',
  CREDIT = 'Credit',
}

export enum CurrencyType {
  NAIRA = 'NGN',
  GBP = 'GBP',
  USD = 'USD',
}

export enum PaymentStatus {
  SUCCESSFUL = 'SUCCESSFUL',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
}

export enum FundRequestsatus {
  ACCEPTED = 'ACCEPTED',
  PENDING = 'PENDING',
  DECLINED = 'DECLINED',
}

export enum ScheduledTypes{
  Airtime = 'Airtime',
  Cable = 'Cable',
  Data = 'Data',
  Electricity = 'Electricity',
  Betting = 'Betting',
  Transfer = 'Transfer',
}

export enum ScheduledTypesProvider{
  IBEDC = "IBEDC",
  KEDCO = "KEDCO",
  APLE = "APLE",
  AES_JEDC = "AES_JEDC",
  CEL_JEDC = "CEL_JEDC",
  BEDC = "BEDC",
  EKEDC = "EKEDC",
  KAEDCO = "KAEDCO",
  AEDC = "AEDC",
  PHEDC = "PHEDC",
  IKEDC = "IKEDC",
  EEDC = "EEDC",
  MTN = 'MTN',
  NINE_MOBILE = '9MOBILE',
  GLO = 'GLO',
  AIRTEL = 'AIRTEL',
  GOTV = 'GOTV',
  DSTV = 'DSTV',
  STARTIMES = 'STARTIMES',
}

export enum RequestStatus {
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED',
}

export enum AuthProvider {
  LOCAL = 'LOCAL',
  FACEBOOK = 'FACEBOOK',
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
}

export enum AppRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum AccessPermission {
  TRANSACTION = 'TRANSACTION',
  CONTENTMODERATION = 'CONTENTMODERATION',
  USERDETAILS = 'USERDETAILS',
  PROMOTION = 'PROMOTION',
  CANDELETEUSERS = 'CANDELETEUSERS',
  CANSUSPENDUSERS = 'CANSUSPENDUSERS',
  CANREADUSERSMESSAGES = 'CANREADUSERSMESSAGES',
  EXPORTDATA = 'EXPORTDATA',
  ADDEMPLOYEE = 'ADDEMPLOYEE',
  ALL = 'ALL',
}

export enum UserNotificationType {
  SYSTEM = 'SYSTEM',
  USER_SPECIFIC = ' USER_SPECIFIC',
  REQUEST="Request"
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}
