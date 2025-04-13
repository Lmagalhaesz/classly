import { Module } from '@nestjs/common';
import { PaymentPlanController } from './payment-plan.controller';
import { PaymentPlanService } from './payment-plan.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StudentPaymentController } from './student-payment.controller';
import { PaymentService } from './payment.service';
import { TeacherModule } from 'src/teacher/teacher.module';
import { TeacherPaymentController } from './teacher-payment.controller';

@Module({
  imports: [PrismaModule, TeacherModule],
  controllers: [PaymentPlanController, StudentPaymentController, TeacherPaymentController],
  providers: [PaymentPlanService, PaymentService],
  exports: [PaymentPlanService, PaymentService],
})
export class PaymentsModule {}
