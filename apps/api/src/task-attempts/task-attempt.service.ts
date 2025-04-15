import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskAttemptDto } from './dto/create-task-attempt.dto';

@Injectable()
export class TaskAttemptService {
  constructor(private readonly prisma: PrismaService) {}

  async createAttempt(createTaskAttemptDto: CreateTaskAttemptDto, studentId: string) {
    return this.prisma.taskAttempt.create({
      data: {
        activity: { connect: { id: createTaskAttemptDto.activityId } },
        student: { connect: { id: studentId } },
        correctAnswers: createTaskAttemptDto.correctAnswers,
        incorrectAnswers: createTaskAttemptDto.incorrectAnswers,
        score: createTaskAttemptDto.score,
        // Se os campos startedAt e finishedAt não forem gerenciados automaticamente,
        // faça a conversão para Date:
        startedAt: createTaskAttemptDto.startedAt ? new Date(createTaskAttemptDto.startedAt) : new Date(),
        finishedAt: createTaskAttemptDto.finishedAt ? new Date(createTaskAttemptDto.finishedAt) : new Date(),
      },
    });
  }
}