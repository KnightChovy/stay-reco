-- One row per page per hotel: reconnecting a page has to update the row a published post already points at,
-- rather than add a second one beside it (decision M16).
CREATE UNIQUE INDEX "social_account_hotel_id_platform_account_name_key" ON "social_account"("hotel_id", "platform", "account_name");
