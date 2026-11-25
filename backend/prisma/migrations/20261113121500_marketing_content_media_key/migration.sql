-- Cloudinary's id for the picture, so replacing or removing it deletes the file as well (M18).
ALTER TABLE "marketing_content" ADD COLUMN "media_storage_key" VARCHAR(255);
