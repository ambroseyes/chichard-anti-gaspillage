-- CreateEnum
CREATE TYPE "StorePipelineStage" AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost');

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "pipeline_expected_value" DOUBLE PRECISION,
ADD COLUMN     "pipeline_next_action_at" TIMESTAMP(3),
ADD COLUMN     "pipeline_notes" TEXT,
ADD COLUMN     "pipeline_owner_email" TEXT,
ADD COLUMN     "pipeline_stage" "StorePipelineStage" NOT NULL DEFAULT 'new',
ADD COLUMN     "pipeline_stage_changed_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Store_pipeline_owner_email_idx" ON "Store"("pipeline_owner_email");
