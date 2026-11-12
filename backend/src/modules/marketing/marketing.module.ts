import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { BrandVoiceService } from './brand-voice.service';
import { ContentController } from './content.controller';
import { ContentIdeasService } from './content-ideas.service';
import { ContentService } from './content.service';
import { MarketingController } from './marketing.controller';
import { MetricsService } from './metrics.service';
import { PublishDueService } from './publish-due.service';
import { FacebookPublisher } from './publishers/facebook.publisher';
import { InstagramPublisher } from './publishers/instagram.publisher';
import { PublisherRegistry } from './publishers/publisher.registry';
import { TiktokPublisher } from './publishers/tiktok.publisher';
import { ScheduleService } from './schedule.service';
import { FacebookOauthService } from './facebook-oauth.service';
import { SocialAccountsService } from './social-accounts.service';
import { SocialController } from './social.controller';

@Module({
  controllers: [MarketingController, ContentController, SocialController],
  providers: [
    AiService,
    BrandVoiceService,
    ContentService,
    ContentIdeasService,
    SocialAccountsService,
    FacebookOauthService,
    ScheduleService,
    MetricsService,
    PublishDueService,
    FacebookPublisher,
    InstagramPublisher,
    TiktokPublisher,
    PublisherRegistry,
  ],
  exports: [AiService, BrandVoiceService, ScheduleService, PublishDueService],
})
export class MarketingModule {}
