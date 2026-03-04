import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log(" Starting seed...");

  // Clear in FK-safe order
  await prisma.feedback.deleteMany();
  await prisma.update.deleteMany();
  await prisma.salesRep.deleteMany();
  await prisma.manager.deleteMany();

  // ---- Manager ----
  const manager = await prisma.manager.create({
    data: {
      name: "Ankesh Kumar",
      email: "ankesh@atidan.com",
      role: "manager",
    },
  });

  // ---- Real sales reps from Sales and Marketing dept (DeptId 79) ----
  await prisma.salesRep.createMany({
    data: [
      {
        name: "Pavitra Gurusiddappa",
        email: "pavitra.gurusiddappa@atidan.com",
        role: "Sales Rep",
        team: "Sales and Marketing",
        managerId: manager.id,
      },
      {
        name: "Rishi Roy",
        email: "rishi.roy@atidan.com",
        role: "Sales Rep",
        team: "Sales and Marketing",
        managerId: manager.id,
      },
      {
        name: "Anushka Vikram",
        email: "anushka.vikram@atidan.com",
        role: "Sales Rep",
        team: "Sales and Marketing",
        managerId: manager.id,
      },
      {
        name: "Radha Rani",
        email: "radha.rani@atidan.com",
        role: "Sales Rep",
        team: "Sales and Marketing",
        managerId: manager.id,
      },
      {
        name: "Harshitha S",
        email: "harshitha.s@atidan.com",
        role: "Sales Rep",
        team: "Sales and Marketing",
        managerId: manager.id,
      },
      {
        name: "Anjum Zehra",
        email: "anjum.zehra@atidan.com",
        role: "Sales Rep",
        team: "Sales and Marketing",
        managerId: manager.id,
      },
      {
        name: "Devansh Tanwar",
        email: "devansh.tanwar@atidan.com",
        role: "Sales Rep",
        team: "Sales and Marketing",
        managerId: manager.id,
      },
    ],
  });

  console.log(" Seed complete � 6 real reps registered, no fake data.");
  console.log("   Ingest real content via POST /api/v1/sync/manual");
}

main().finally(() => prisma.$disconnect());
