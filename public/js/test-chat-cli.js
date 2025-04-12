const io = require("socket.io-client");

const socket = io("http://localhost:3000", {
  reconnection: true,
});

socket.on("connect", () => {
  console.log("Conectado! ID do socket:", socket.id);
  // socket.emit("chatMessage", { conversationId: "terminal-test", message: "Olá do terminal!" });
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
    socket.emit("chatMessage", { conversationId: "eb207520-dc7c-4ee3-8f98-583d7b827da0", message });
  }
});
