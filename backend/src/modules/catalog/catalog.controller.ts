import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  amenityResponseSchema,
  bedTypeResponseSchema,
  z,
} from '@stayreco/shared';
import { Public } from '../../common/decorators/public.decorator';
import { ApiData } from '../../common/swagger/api-docs.decorators';
import { CatalogService } from './catalog.service';

@ApiTags('catalog')
@Public()
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  /** List amenities (names and groups in Vietnamese, lucide-react icon names) */
  @ApiData(z.array(amenityResponseSchema))
  @Get('amenities')
  amenities() {
    return this.catalog.amenities();
  }

  /** List bed types */
  @ApiData(z.array(bedTypeResponseSchema))
  @Get('bed-types')
  bedTypes() {
    return this.catalog.bedTypes();
  }
}
