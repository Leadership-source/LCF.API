import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { teams } from "./seedData/teams.js";
import { events } from "./seedData/events.js";

const prisma = new PrismaClient();

const main = async () => {
  console.log("Seeding admin user...");

  const hashedPassword = await bcrypt.hash("Changeme@2026", 10);

  await prisma.user.upsert({
    where: { email: "o.mariam@solvurix.co.uk" },
    update: { role: "SUPERADMIN" },
    create: {
      name: "Mariam",
      email: "o.mariam@solvurix.co.uk",
      password: hashedPassword,
      role: "SUPERADMIN",
    },
  });

  console.log("Admin user seeded.");

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
