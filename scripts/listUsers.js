import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const users = await prisma.user.findMany({
  select: { email: true, role: true },
  orderBy: { createdAT: "asc" },
});
console.table(users);
await prisma.$disconnect();
