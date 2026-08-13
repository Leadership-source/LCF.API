import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email = process.argv[2];
const role = process.argv[3] ?? "SUPERADMIN";

if (!email) {
  console.error("Usage: node scripts/promote.js <email> [role]");
  process.exit(1);
}

const user = await prisma.user.update({
  where: { email },
  data: { role },
  select: { id: true, name: true, email: true, role: true },
});

console.log("Updated:", user);
await prisma.$disconnect();
