import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('example')
@Controller('example')
export class ExampleController {
  @Get()
  @ApiOperation({ summary: 'Retorna uma mensagem Hello World' })
  @ApiResponse({ status: 200, description: 'Mensagem de sucesso', type: String })
  helloWorld(): string {
    return 'Hello World!';
  }
}
