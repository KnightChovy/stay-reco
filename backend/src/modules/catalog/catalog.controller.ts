import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CatalogService } from './catalog.service';

@ApiTags('catalog')
@Public()
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('amenities')
  amenities() {
    return this.catalog.amenities();
  }

  @Get('bed-types')
  bedTypes() {
    return this.catalog.bedTypes();
  }
}
