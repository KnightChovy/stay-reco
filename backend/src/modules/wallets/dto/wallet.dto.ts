import { walletTransactionListQuerySchema } from '@stayreco/shared';
import { zodDto } from '../../../common/pipes/validation';

export class WalletTransactionListQueryDto extends zodDto(
  walletTransactionListQuerySchema,
) {}
