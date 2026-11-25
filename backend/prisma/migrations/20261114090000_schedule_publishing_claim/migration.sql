-- The publisher job claims a row (SCHEDULED -> PUBLISHING) before calling the platform, so two instances or two
-- runs can never send the same post, and a cancel cannot land while the call is in flight.
ALTER TYPE "schedule_status" ADD VALUE 'PUBLISHING' AFTER 'SCHEDULED';
