import { PrismaClient } from "@prisma/client";
import { teams } from "./seedData/teams.js";
import { events } from "./seedData/events.js";

const prisma = new PrismaClient();

const main = async () => {
  console.log("Seeding teams...");

  for (const team of teams) {
    await prisma.team.create({
      data: team,
    });
  }

  console.log("Teams seeded.");

  console.log("Seeding events...");

  for (const event of events) {
    await prisma.event.create({
      data: event,
    });
  }

  console.log("Events seeded.");
};

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
