// src/chat/chat.gateway.ts
import {
  WebSocketGateway, OnGatewayInit, OnGatewayConnection,
  OnGatewayDisconnect, WebSocketServer, SubscribeMessage
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly chatService: ChatService) {}

  afterInit(server: Server) {
    console.log('[Gateway] inicializado');
    server.use((socket: Socket, next) => {
      console.log('[Gateway][auth] handshake.auth =', socket.handshake.auth);
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Token não fornecido'));
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        console.log('[Gateway][auth] decoded =', decoded);
        socket.data.user = decoded;
        return next();
      } catch (err) {
        console.error('[Gateway][auth] erro ao verificar token:', err);
        return next(new Error('Token inválido'));
      }
    });
  }

  handleConnection(client: Socket) {
    console.log(`[Gateway] cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Gateway] cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('chatMessage')
  async handleMessage(client: Socket, payload: any): Promise<void> {
    console.log('[Gateway] evento chatMessage recebido:', payload);
    try {
      const user = client.data.user;
      if (!user?.sub) {
        console.warn('[Gateway] usuário não autenticado');
        return;
      }

      console.log('[Gateway] salvando mensagem do aluno...');
      await this.chatService.addStudentMessage(
        payload.conversationId,
        payload.message,
        user.sub
      );

      console.log('[Gateway] processando IA...');
      const ai = await this.chatService.processMessageWithIA(
        payload.conversationId,
        payload.message
      );
      console.log('[Gateway] IA respondeu:', ai);

      client.emit('chatResponse', { conversationId: payload.conversationId, message: ai });
    } catch (err) {
      console.error('[Gateway] erro em handleMessage:', err);
      client.emit('error', { message: err.message || 'Erro interno' });
    }
  }
}
