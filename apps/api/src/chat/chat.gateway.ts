import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  // Configura o middleware para extrair e verificar o token JWT do handshake
  afterInit(server: Server) {
    console.log('ChatGateway Initialized');
    server.use((socket: Socket, next) => {
      const token = socket.handshake.auth?.token; // O token deve ser enviado na seção "auth" do handshake
      if (!token) {
        return next(new Error('Token não fornecido.'));
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        // Armazena os dados do usuário no objeto do socket para uso futuro
        socket.data.user = decoded;
        return next();
      } catch (error) {
        return next(new Error('Token inválido.'));
      }
    });
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('chatMessage')
  async handleMessage(client: Socket, payload: { conversationId: string; message: string }): Promise<void> {
    // Recupere os dados do usuário a partir do middleware de autenticação
    const user = client.data.user;
    if (!user || !user.userId) {
      client.emit('error', { message: 'Usuário não autenticado.' });
      return;
    }

    // Use o userId ao criar a mensagem do estudante
    await this.chatService.addStudentMessage(payload.conversationId, payload.message, user.userId);

    // Processa a mensagem com IA (o método pode gerar e armazenar a resposta da IA)
    const aiResponse = await this.chatService.processMessageWithIA(payload.conversationId, payload.message);

    client.emit('chatResponse', { conversationId: payload.conversationId, message: aiResponse });
  }
}
