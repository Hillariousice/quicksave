import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import * as dotenv from "dotenv";

dotenv.config();

// Prisma 7 explicit URL handling
const prisma = new PrismaClient({
  // @ts-ignore
  datasourceUrl: process.env.DATABASE_URL,
});

async function cleanDatabase() {
  console.log("🧹 Cleaning database...");
  // Delete in order (Children first, then Parents)
  await prisma.message.deleteMany();
  await prisma.session.deleteMany();
  await prisma.groupInvite.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.rotationSlot.deleteMany();
  await prisma.contribution.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();
}

async function seedSuperAdmin() {
  console.log("👑 Creating Super Admin...");
  const passwordHash = await bcrypt.hash("AdminPassword123!", 12);
  const pinHash = await bcrypt.hash("1234", 12);

  return await prisma.user.create({
    data: {
      email: "admin@quicksave.com",
      firstName: "Super",
      lastName: "Admin",
      phone: "+23400000000",
      passwordHash,
      pin: pinHash,
      isVerified: true,
      systemRole: "SUPER_ADMIN",
      wallet: { create: {} },
    },
  });
}

async function seedUsers(count = 10) {
  console.log(`👤 Seeding ${count} users...`);
  const passwordHash = await bcrypt.hash("Password123!", 12);
  
  const users = [];
  for (let i = 0; i < count; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        phone: faker.phone.number(),
        passwordHash,
        isVerified: true,
        avatar: faker.image.avatar(),
        wallet: { create: { balance: faker.number.float({ min: 1000, max: 50000, fractionDigits: 2 }) } },
      },
      include: { wallet: true }
    });
    users.push(user);
  }
  return users;
}

async function seedGroups(users: any[]) {
  console.log("👥 Seeding groups...");
  const groups = [];
  
  const groupNames = ["Techies Contribution", "Lagos Business Circle", "Family Savings", "December Travel Fund"];

  for (const name of groupNames) {
    const creator = faker.helpers.arrayElement(users);
    const group = await prisma.group.create({
      data: {
        name,
        description: faker.lorem.sentence(),
        contributionAmount: faker.helpers.arrayElement([5000, 10000, 25000, 50000]),
        frequency: faker.helpers.arrayElement(["WEEKLY", "MONTHLY"]),
        maxCapacity: 10,
        inviteCode: faker.string.alphanumeric(8).toUpperCase(),
        creatorId: creator.id,
        status: "ACTIVE",
        wallet: { create: { balance: 0 } },
        members: {
          create: {
            userId: creator.id,
            role: "ADMIN",
            status: "ACTIVE"
          }
        }
      }
    });
    groups.push(group);
  }
  return groups;
}

async function seedTransactions(users: any[]) {
  console.log("💰 Seeding transactions for dashboard charts...");
  for (const user of users) {
    if (!user.wallet) continue;
    
    await prisma.transaction.createMany({
      data: Array.from({ length: 3 }).map(() => ({
        walletId: user.wallet.id,
        amount: faker.number.float({ min: 1000, max: 10000 }),
        type: faker.helpers.arrayElement(["CONTRIBUTION", "FUNDING"]),
        status: "SUCCESS",
        reference: `REF-${faker.string.uuid()}`,
        description: "Monthly group savings",
        createdAt: faker.date.recent({ days: 7 })
      }))
    });
  }
}

async function main() {
  console.log("🌱 Starting seed...");

  await cleanDatabase();
  
  const admin = await seedSuperAdmin();
  const users = await seedUsers(15);
  const allUsersPlusAdmin = [admin, ...users];
  
  const groups = await seedGroups(users);
  await seedTransactions(allUsersPlusAdmin);

  console.log("-----------------------------------------");
  console.log("✅ Seed complete!");
  console.log("📧 Admin Email: admin@quicksave.com");
  console.log("🔑 Admin Password: AdminPassword123!");
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });