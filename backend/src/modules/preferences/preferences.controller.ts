import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { preferencesResponseSchema } from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiData } from '../../common/swagger/api-docs.decorators';
import { UserRole } from '../../generated/prisma/client';
import { UpdatePreferencesDto } from './dto/preference.dto';
import { PreferencesService } from './preferences.service';

/** A customer's saved preferences, read by the screens that ask and by the recommender of phase 5. */
@ApiTags('preferences')
@Controller('me/preferences')
export class PreferencesController {
  constructor(private readonly preferences: PreferencesService) {}

  @ApiOperation({
    summary: 'My saved preferences',
    description:
      'An object of key-value pairs; `{}` when nothing has been saved. The keys are agreed between the FE and the recommender, not fixed by the backend.',
  })
  @ApiData(preferencesResponseSchema)
  @Roles(UserRole.CUSTOMER)
  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.preferences.get(user.accountId);
  }

  @ApiOperation({
    summary: 'Save my preferences',
    description:
      'Writes the keys it is given, removes the ones set to `null` and leaves the rest alone, so a screen can save the one field it owns without reading the others first. Answers the whole set afterwards.',
  })
  @ApiData(preferencesResponseSchema)
  @Roles(UserRole.CUSTOMER)
  @Put()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdatePreferencesDto) {
    return this.preferences.update(user.accountId, dto);
  }
}
