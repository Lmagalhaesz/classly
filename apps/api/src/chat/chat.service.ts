import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import { Sender } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(userId: string): Promise<{ id: string }> {
    console.log('Criando conversa para o usuário:', userId);
    try {
      const conversation = await this.prisma.conversation.create({
        data: {
          userId,
        },
      });
      console.log('Conversa criada:', conversation);
      return conversation;
    } catch (error: any) {
      console.error('Erro ao criar conversa:', error.message);
      throw new InternalServerErrorException('Erro ao criar conversa.');
    }
  }

  async addStudentMessage(conversationId: string, message: string, userId: string): Promise<void> {
    console.log(`Adicionando mensagem do estudante para a conversa ${conversationId} (userId: ${userId}): "${message}"`);
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
      });
      if (!conversation) {
        const errorMsg = `Conversa com id ${conversationId} não encontrada.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      const createdMessage = await this.prisma.chatMessage.create({
        data: {
          content: message,
          sender: Sender.STUDENT,
          conversation: { connect: { id: conversationId } },
          user: { connect: { id: userId } },
        },
      });
      console.log('Mensagem do estudante criada:', createdMessage);
    } catch (error: any) {
      console.error('Erro ao adicionar mensagem do estudante:', error.message);
      throw new InternalServerErrorException('Erro ao adicionar mensagem do estudante.');
    }
  }

  async processMessageWithIA(conversationId: string, message: string): Promise<string> {
    console.log(`Iniciando processamento com IA para a conversa ${conversationId}. Mensagem: "${message}"`);

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY não configurada.');
      return 'OpenAI API key não configurada.';
    }
    
    let history;
    try {
      history = await this.getConversationHistory(conversationId);
      console.log('Histórico da conversa recuperado:', history);
    } catch (error: any) {
      console.error('Erro ao recuperar histórico da conversa:', error.message);
      return 'Erro ao recuperar histórico da conversa.';
    }
    
    const messagesForAPI = history.map(msg => {
      let role: string;
      if (msg.sender === Sender.STUDENT) {
        role = "user";
      } else if (msg.sender === Sender.AI) {
        role = "assistant";
      } else {
        role = "system";
      }
      return { role, content: msg.content };
    });
    
    messagesForAPI.push({ role: "user", content: message });
    console.log('Mensagens formatadas para envio à API do OpenAI:', messagesForAPI);
    
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'Você é um assistente de apoio para ajudar alunos.' },
            ...messagesForAPI
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`,
          },
        }
      );
      
      console.log('Resposta da API do OpenAI:', response.data);
      const aiMessage = response.data.choices[0].message.content;
      console.log('Mensagem da IA recebida:', aiMessage);
      
      // Verifica a variável de ambiente para o usuário AI
      const aiUserId = process.env.AI_USER_ID;
      if (!aiUserId) {
        console.error("AI_USER_ID não configurado.");
        throw new InternalServerErrorException("AI_USER_ID não configurado.");
      }
      
      try {
        const createdAiMessage = await this.prisma.chatMessage.create({
          data: {
            content: aiMessage,
            sender: Sender.AI,
            conversation: { connect: { id: conversationId } },
            user: { connect: { id: aiUserId } },
          },
        });
        console.log('Mensagem da IA registrada no banco:', createdAiMessage);
      } catch (error: any) {
        console.error('Erro ao criar a mensagem da IA no banco:', error.message);
        throw new InternalServerErrorException('Erro ao salvar a mensagem da IA.');
      }
      
      return aiMessage;
    } catch (error: any) {
      console.error('Erro ao chamar a API do OpenAI:', error.response?.data || error.message);
      return 'Desculpe, ocorreu um erro ao processar sua mensagem.';
    }
  }

  async getConversationHistory(conversationId: string): Promise<any[]> {
    console.log(`Recuperando histórico de conversa para ${conversationId}...`);
    try {
      const messages = await this.prisma.chatMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        select: { 
          content: true, 
          sender: true, 
          createdAt: true 
        },
      });
      console.log('Histórico de mensagens:', messages);
      return messages;
    } catch (error: any) {
      console.error('Erro ao recuperar o histórico de mensagens:', error.message);
      throw new InternalServerErrorException('Erro ao recuperar histórico de mensagens.');
    }
  }
}
