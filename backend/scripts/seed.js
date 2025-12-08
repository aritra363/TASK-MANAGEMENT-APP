"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../src/db/client"));
const passwords_1 = require("../src/utils/passwords");
async function main() {
    const exist = await client_1.default.user.findUnique({ where: { username: "aritra363" } });
    if (!exist) {
        const hashed = await (0, passwords_1.hashPassword)("Aritra@1234");
        await client_1.default.user.create({
            data: {
                username: "aritra363",
                name: "Default Admin",
                role: "ADMIN",
                hashedPassword: hashed
            }
        });
        console.log("Admin created");
    }
    else {
        console.log("Admin already exists");
    }
    const c = await client_1.default.company.findFirst();
    if (!c) {
        await client_1.default.company.create({ data: { name: "Work Management System" } });
        console.log("Company created");
    }
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await client_1.default.$disconnect(); });
