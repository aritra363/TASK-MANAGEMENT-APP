import prisma from "../src/db/client";
import { hashPassword } from "../src/utils/passwords";

async function main() {
  const exist = await prisma.user.findUnique({ where: { username: "aritra363" }});
  if(!exist) {
    const hashed = await hashPassword("Aritra@1234");
    await prisma.user.create({
      data: {
        username: "aritra363",
        name: "Default Admin",
        role: "ADMIN",
        hashedPassword: hashed
      }
    });
    console.log("Admin created");
  } else {
    console.log("Admin already exists");
  }

  const c = await prisma.company.findFirst();
  if(!c) {
    await prisma.company.create({ data: { name: "Work Management System" }});
    console.log("Company created");
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
