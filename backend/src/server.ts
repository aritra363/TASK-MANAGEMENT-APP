import http from "http";
import app from "./app";
import dotenv from "dotenv";
import { initSocket } from "./sockets/socket";
dotenv.config();

const PORT = Number(process.env.PORT) || 4000;

const server = http.createServer(app);

initSocket(server);

server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
