-- CreateTable
CREATE TABLE "slots" (
    "id" SERIAL NOT NULL,
    "hostId" INTEGER NOT NULL,
    "eventTypeId" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "slots_hostId_startAt_idx" ON "slots"("hostId", "startAt");

-- CreateIndex
CREATE INDEX "slots_eventTypeId_startAt_status_idx" ON "slots"("eventTypeId", "startAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "slots_eventTypeId_startAt_endAt_key" ON "slots"("eventTypeId", "startAt", "endAt");

-- AddForeignKey
ALTER TABLE "slots" ADD CONSTRAINT "slots_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slots" ADD CONSTRAINT "slots_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "event_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
