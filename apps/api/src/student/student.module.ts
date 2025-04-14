import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GroupsModule } from 'src/groups/groups.module';

@Module({
  imports: [PrismaModule, GroupsModule],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
