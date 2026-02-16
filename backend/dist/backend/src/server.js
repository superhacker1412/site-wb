"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const prisma_1 = require("./lib/prisma");
const server = app_1.app.listen(env_1.env.PORT, () => {
    console.log(`Backend server listening on http://localhost:${env_1.env.PORT}`);
});
process.on("SIGINT", async () => {
    await prisma_1.prisma.$disconnect();
    server.close(() => process.exit(0));
});
process.on("SIGTERM", async () => {
    await prisma_1.prisma.$disconnect();
    server.close(() => process.exit(0));
});
//# sourceMappingURL=server.js.map