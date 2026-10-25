import { zodDto } from '../../../common/pipes/validation';
import { sepayTransactionSchema } from '../sepay-webhook';

export class SepayTransactionDto extends zodDto(sepayTransactionSchema) {}
