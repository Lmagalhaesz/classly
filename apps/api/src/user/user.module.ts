import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ExampleController } from './example.controller';

@Module({
  providers: [UserService],
  controllers: [UserController, ExampleController],
})
export class UserModule {}
