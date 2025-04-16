const io = require("socket.io-client");

const socket = io("http://localhost:3000", {
  reconnection: true,
  auth: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNDBlNmQ1NS0yMDQwLTQwNzctOTI1Zi1hZWIxYjdlOTI2ZDUiLCJlbWFpbCI6Imxlb0BnbWFpbC5jb20iLCJyb2xlIjoiU1RVREVOVCIsImlhdCI6MTc0NDgzNTI2OCwiZXhwIjoxNzQ0ODM2MTY4LCJqdGkiOiI1NDM5NTIyYi1hOWE1LTRkOWMtYjkwYy1mOTg4Njg4M2VkZGYifQ.ASbI2pkyIzTuiX8JPF8C6nQvOK8abGqpv_ssAf5TSIo"
  }
});

socket.on("connect", () => {
  console.log("Conectado! ID do socket:", socket.id);
  socket.emit("chatMessage", { conversationId: "626f7794-43e0-49a5-a8c3-3a73d0f83a5a", message: "Olá do terminal!" });
});

socket.on("chatResponse", (data) => {
  console.log("Resposta da IA:", data);
});

socket.on("disconnect", () => {
  console.log("Desconectado!");
});

socket.on("connect_error", (err) => {
  console.log("Erro de conexão:", err.message);
});

process.stdin.on("data", (data) => {
  const message = data.toString().trim();
  if (message === "quit") {
    console.log("Fechando o socket...");
    socket.close();
    process.exit();
  } else {
    socket.emit("chatMessage", { conversationId: "626f7794-43e0-49a5-a8c3-3a73d0f83a5a", message });
  }
});
