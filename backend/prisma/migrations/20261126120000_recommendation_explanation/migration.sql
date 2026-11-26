-- Why each recommendation is there, written by the recommender beside `reason`: the weights of the three parts
-- (history, content, guests like them), each part's predicted rating, and what matched. Read by the "Vì sao?" view.
ALTER TABLE "recommendation" ADD COLUMN "explanation" JSONB;
