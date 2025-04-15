import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentService {

  constructor(private readonly prisma: PrismaService) {}

  async getPerformanceStats(studentId: string) {
    // Recupera todas as tentativas da atividade do aluno
    const attempts = await this.prisma.taskAttempt.findMany({
      where: { studentId },
      orderBy: { startedAt: 'asc' },
    });

    const totalAttempts = attempts.length;
    const totalCorrect = attempts.reduce((sum, attempt) => sum + attempt.correctAnswers, 0);
    const totalIncorrect = attempts.reduce((sum, attempt) => sum + attempt.incorrectAnswers, 0);
    let percentCorrect = 0;
    if (totalCorrect + totalIncorrect > 0) {
      percentCorrect = (totalCorrect / (totalCorrect + totalIncorrect)) * 100;
    }

    // Calcula a pontuação média, considerando apenas tentativas com score definido
    const scores = attempts
      .filter((attempt) => attempt.score !== null)
      .map((attempt) => attempt.score as number);
    const averageScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : null;

    // Calcula uma "taxa de aprendizado" comparando as duas metades das tentativas
    let learningRate = 0;
    if (totalAttempts > 1) {
      const midIndex = Math.floor(totalAttempts / 2);
      const firstHalf = attempts.slice(0, midIndex);
      const secondHalf = attempts.slice(midIndex);

      // Calcula o percentual de acertos para cada metade
      const totalFirst = firstHalf.reduce((sum, attempt) => sum + (attempt.correctAnswers + attempt.incorrectAnswers), 0) || 1;
      const totalSecond = secondHalf.reduce((sum, attempt) => sum + (attempt.correctAnswers + attempt.incorrectAnswers), 0) || 1;
      const percentFirst = (firstHalf.reduce((sum, attempt) => sum + attempt.correctAnswers, 0) / totalFirst) * 100;
      const percentSecond = (secondHalf.reduce((sum, attempt) => sum + attempt.correctAnswers, 0) / totalSecond) * 100;
      learningRate = percentSecond - percentFirst;
    }

    return {
      totalAttempts,
      totalCorrect,
      totalIncorrect,
      percentCorrect,
      averageScore,
      learningRate,
    };
  }
}
