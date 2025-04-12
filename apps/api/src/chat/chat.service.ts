// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import { Sender } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  // Método para criar uma nova conversa para o usuário
  async createConversation(userId: string): Promise<{ id: string }> {
    const conversation = await this.prisma.conversation.create({
      data: {
        userId,
      },
    });
    return conversation; 
  }

  async addStudentMessage(conversationId: string, message: string): Promise<void> {

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new Error(`Conversa com id ${conversationId} não encontrada.`);
    }
    await this.prisma.chatMessage.create({
      data: {
        content: message,
        sender: Sender.STUDENT,
        conversation: {
          connect: { id: conversationId },
        },
      },
    });
  }

  async processMessageWithIA(conversationId: string, message: string): Promise<string> {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return 'OpenAI API key não configurada.';
    }
    
    // Obtenha o histórico de mensagens para a conversa
    const history = await this.getConversationHistory(conversationId);
    
    // Construa o array de mensagens para a API do OpenAI
    // Assumindo que o histórico salvo tem "sender" e "content"
    // Mapeie os remetentes para os papéis esperados pela API: "system", "user" e "assistant" (neste exemplo, usamos "user" para mensagens do aluno)
    const messagesForAPI = history.map(msg => {
      let role;
      // Para o nosso caso, se a mensagem foi enviada pelo aluno, usamos "user"
      // Se foi enviada pela IA, usamos "assistant"; se for de outro tipo, você pode adaptar
      if (msg.sender === Sender.STUDENT) {
        role = "user";
      } else if (msg.sender === Sender.AI) {
        role = "assistant";
      } else {
        role = "system"; // ou definir conforme a lógica do seu projeto
      }
      return { role, content: msg.content };
    });
    
    // Adicione a nova mensagem ao histórico (como se fosse enviada agora)
    messagesForAPI.push({ role: "user", content: message });
    
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Você é um assistente de apoio para ajudar alunos.' },
          ...messagesForAPI
        ],
        max_tokens: 150,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
      });
      
      const aiMessage = response.data.choices[0].message.content;
      
      // Opcional: Salve a mensagem da IA na conversa
      await this.prisma.chatMessage.create({
        data: {
          content: aiMessage,
          sender: Sender.AI,
          conversation: {
            connect: { id: conversationId },
          },
        },
      });
      
      return aiMessage;
    } catch (error) {
      console.error('Erro ao chamar a API do OpenAI:', error.response?.data || error.message);
      return 'Desculpe, ocorreu um erro ao processar sua mensagem.';
    }
  }

  async getConversationHistory(conversationId: string): Promise<any[]> {
    const messages = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: { 
        content: true, 
        sender: true, 
        createdAt: true 
      },
    });
    return messages;
  }
  
}


