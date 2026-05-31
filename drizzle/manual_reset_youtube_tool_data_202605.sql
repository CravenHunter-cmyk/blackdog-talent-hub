-- This reset file is intended for development/test database only.
-- It clears only YouTube Speech Link Collector tool data.
-- Do not run against production.

DO $$
BEGIN
  IF to_regclass('public.tool_exports') IS NOT NULL THEN
    TRUNCATE TABLE "tool_exports" RESTART IDENTITY CASCADE;
  END IF;

  IF to_regclass('public.youtube_duplicate_group_items') IS NOT NULL THEN
    TRUNCATE TABLE "youtube_duplicate_group_items" RESTART IDENTITY CASCADE;
  END IF;

  IF to_regclass('public.youtube_duplicate_groups') IS NOT NULL THEN
    TRUNCATE TABLE "youtube_duplicate_groups" RESTART IDENTITY CASCADE;
  END IF;

  IF to_regclass('public.youtube_result_matches') IS NOT NULL THEN
    TRUNCATE TABLE "youtube_result_matches" RESTART IDENTITY CASCADE;
  END IF;

  IF to_regclass('public.youtube_results') IS NOT NULL THEN
    TRUNCATE TABLE "youtube_results" RESTART IDENTITY CASCADE;
  END IF;

  IF to_regclass('public.tool_search_batches') IS NOT NULL THEN
    TRUNCATE TABLE "tool_search_batches" RESTART IDENTITY CASCADE;
  END IF;

  IF to_regclass('public.youtube_collection_units') IS NOT NULL THEN
    TRUNCATE TABLE "youtube_collection_units" RESTART IDENTITY CASCADE;
  END IF;

  IF to_regclass('public.tool_tasks') IS NOT NULL THEN
    TRUNCATE TABLE "tool_tasks" RESTART IDENTITY CASCADE;
  END IF;

  IF to_regclass('public.youtube_audit_logs') IS NOT NULL THEN
    TRUNCATE TABLE "youtube_audit_logs" RESTART IDENTITY CASCADE;
  END IF;
END $$;
