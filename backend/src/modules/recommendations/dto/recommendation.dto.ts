import { recommendationQuerySchema } from '@stayreco/shared';
import { zodDto } from '../../../common/pipes/validation';

export class RecommendationQueryDto extends zodDto(recommendationQuerySchema) {}
