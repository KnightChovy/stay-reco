import { Module } from '@nestjs/common';
import { BrandVoiceService } from './brand-voice.service';
import { ClaudeService } from './claude.service';
import { ContentController } from './content.controller';
import { ContentIdeasService } from './content-ideas.service';
import { ContentService } from './content.service';
import { MarketingController } from './marketing.controller';

@Module({
  controllers: [MarketingController, ContentController],
  providers: [
    ClaudeService,
    BrandVoiceService,
    ContentService,
    ContentIdeasService,
  ],
  exports: [ClaudeService, BrandVoiceService],
})
export class MarketingModule {}
