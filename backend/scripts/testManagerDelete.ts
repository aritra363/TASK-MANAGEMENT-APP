import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // create a manager
  const manager = await prisma.user.create({
    data: {
      role: "manager",
      name: "Temp Manager",
      username: `mgr_test_${Date.now()}`,
      hashedPassword: "temp",
    },
  });
  console.log("manager created", manager.id);

  // create an employee assigned to that manager
  const employee = await prisma.user.create({
    data: {
      role: "employee",
      name: "Temp Employee",
      username: `emp_test_${Date.now()}`,
      hashedPassword: "temp",
      managerId: manager.id,
    },
  });
  console.log("employee created", employee.id, "managerId", employee.managerId);

  // delete the manager
  await prisma.user.delete({ where: { id: manager.id } });
  console.log("manager deleted");

  // fetch the employee after manager delete
  const empAfter = await prisma.user.findUnique({ where: { id: employee.id } });
  console.log("employee after manager delete:", empAfter);

  // cleanup - remove the employee
  await prisma.user.delete({ where: { id: employee.id } });
  console.log("employee removed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
