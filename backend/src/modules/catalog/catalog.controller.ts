import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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

  @ApiOperation({
    summary:
      'List amenities (names and groups in Vietnamese, lucide-react icon names)',
  })
  @ApiData(z.array(amenityResponseSchema))
  @Get('amenities')
  amenities() {
    return this.catalog.amenities();
  }

  @ApiOperation({ summary: 'List bed types' })
  @ApiData(z.array(bedTypeResponseSchema))
  @Get('bed-types')
  bedTypes() {
    return this.catalog.bedTypes();
  }
}
