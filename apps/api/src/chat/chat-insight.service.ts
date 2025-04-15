import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class ChatInsightService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recupera o histórico de mensagens da conversa e formata para a análise.
   * Retorna um array com objetos no formato { role, content }.
   */
  async getConversationHistory(conversationId: string): Promise<{ role: string; content: string }[]> {
    const messages = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: { 
        content: true, 
        user: { select: { role: true } }  // Se o model User tiver o campo role
      },
    });

    // Converte o role para um formato que a IA entenda (ex.: "student" ou "teacher")
    return messages.map(msg => ({
      role: msg.user?.role?.toLowerCase() || 'user',
      content: msg.content,
    }));
  }

  /**
   * Gera os insights a partir do histórico de conversa e grava no banco.
   *
   * @param conversationId - O ID da conversa a ser analisada.
   * @param studentId - O ID do aluno (usado para associar os insights).
   * @returns Uma string com os insights gerados.
   */
  async generateAndSaveInsights(conversationId: string, studentId: string): Promise<string> {
    // Recupera e formata o histórico da conversa
    const history = await this.getConversationHistory(conversationId);
    const conversationText = history.map(msg => `${msg.role}: ${msg.content}`).join('\n');

    // Monta o prompt para a IA
    const prompt = `
Você é um analista educacional experiente. Analise o seguinte histórico de conversa de um aluno e identifique:
1. Qual a maior dificuldade apresentada pelo aluno.
2. Quais pontos o professor pode melhorar para aprimorar o ensino.
3. Sugestões práticas para ajudar o aluno a superar essas dificuldades.

Histórico da conversa:
${conversationText}
    `;

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new InternalServerErrorException('OpenAI API key não configurada.');
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'Você é um analista educacional que gera insights para melhorar o ensino.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 250,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`,
          },
        }
      );

      const generatedInsight = response.data.choices[0].message.content;

      // Armazena o insight no banco usando o modelo ChatInsight
      await this.prisma.chatInsight.create({
        data: {
          conversationId: conversationId,
          studentId: studentId,
          insight: generatedInsight,
        },
      });

      return generatedInsight;
    } catch (error) {
      console.error('Erro ao gerar insights:', error.response?.data || error.message);
      throw new InternalServerErrorException('Falha ao gerar insights.');
    }
  }
}
