import { Module } from '@nestjs/common';
import { BrandVoiceService } from './brand-voice.service';
import { AiService } from './ai.service';
import { ContentController } from './content.controller';
import { ContentIdeasService } from './content-ideas.service';
import { ContentService } from './content.service';
import { MarketingController } from './marketing.controller';

@Module({
  controllers: [MarketingController, ContentController],
  providers: [
    AiService,
    BrandVoiceService,
    ContentService,
    ContentIdeasService,
  ],
  exports: [AiService, BrandVoiceService],
})
export class MarketingModule {}
