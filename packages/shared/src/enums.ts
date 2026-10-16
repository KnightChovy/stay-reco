/** Mirrors the Prisma enums (UserRole, AccountStatus) in backend/prisma/schema.prisma. Keep both in sync. */
export const Role = {
  CUSTOMER: 'CUSTOMER',
  HOTEL_PARTNER: 'HOTEL_PARTNER',
  HOTEL_STAFF: 'HOTEL_STAFF',
  PLATFORM_MANAGER: 'PLATFORM_MANAGER',
  ADMIN: 'ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const AccountStatus = {
  ACTIVE: 'ACTIVE',
  INVITED: 'INVITED',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED',
} as const;
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];
