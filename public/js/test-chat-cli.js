const io = require("socket.io-client");

// Altere a URL para onde o Socket.IO Gateway está rodando
const socket = io("http://localhost:3000", {
  reconnection: true,
  // Se tiver CORS ou algo do tipo, você pode passar mais opções aqui
});

socket.on("connect", () => {
  console.log("Conectado! ID do socket:", socket.id);
  // Se precisar mandar algo assim que conectar, pode fazer aqui
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

// Leitura de linha de comando para enviar mensagens em tempo real
process.stdin.on("data", (data) => {
  const message = data.toString().trim();
  if (message === "quit") {
    console.log("Fechando o socket...");
    socket.close();
    process.exit();
  } else {
    // Envia a mensagem digitada para o servidor
    socket.emit("chatMessage", { conversationId: "eb207520-dc7c-4ee3-8f98-583d7b827da0", message });
  }
});
