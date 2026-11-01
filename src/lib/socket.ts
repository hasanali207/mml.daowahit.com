import { io } from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_BASE_API!, {
  transports: ["websocket"],

  autoConnect: false,

  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,

  timeout: 10000,
});

export default socket;
