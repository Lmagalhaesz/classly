import {
    WebSocketGateway,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketServer,
    SubscribeMessage
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { ChatService } from './chat.service';
  
  @WebSocketGateway({ cors: { origin: '*' } })
  export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    constructor(private readonly chatService: ChatService) {}
  
    afterInit(server: Server) {
      console.log('ChatGateway Initialized');
    }
  
    handleConnection(client: Socket, ...args: any[]) {
      console.log(`Client connected: ${client.id}`);
    }
  
    handleDisconnect(client: Socket) {
      console.log(`Client disconnected: ${client.id}`);
    }
  
    @SubscribeMessage('chatMessage')
    async handleMessage(client: Socket, payload: { conversationId: string; message: string }): Promise<void> {
      await this.chatService.addStudentMessage(payload.conversationId, payload.message);
      
      const aiResponse = await this.chatService.processMessageWithIA(payload.conversationId , payload.message);
      
      client.emit('chatResponse', { conversationId: payload.conversationId, message: aiResponse });
    }
  }