import { 
    Controller, 
    Get, 
    Post, 
    Put, 
    Delete, 
    Param, 
    Body 
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
  import { UserService } from './user.service';
  import { CreateUserDto } from './dtos/create-user.dto';
  import { UpdateUserDto } from './dtos/update-user.dto';
import { Role } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
  
  @ApiTags('users')
  @Controller('users')
  export class UserController {
    constructor(private readonly userService: UserService) {}
  
    @Post()
    @ApiOperation({ summary: 'Cria um novo usuário' })
    @ApiResponse({ status: 201, description: 'Usuário criado com sucesso.' })
    async createUser(@Body() createUserDto: CreateUserDto) {
      return this.userService.createUser(createUserDto);
    }
  
    @Get()
    @ApiOperation({ summary: 'Retorna todos os usuários' })
    @ApiResponse({ status: 200, description: 'Lista de usuários.' })
    async findAllUsers() {
      return this.userService.getAllUsers();
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Retorna um usuário pelo ID' })
    @ApiResponse({ status: 200, description: 'Usuário encontrado.' })
    async getUserById(@Param('id') id: string) {
      return this.userService.getUserById(id);
    }
  
    @Put(':id')
    @ApiOperation({ summary: 'Atualiza os dados de um usuário pelo ID' })
    @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso.' })
    async updateUser(
      @Param('id') id: string, 
      @Body() updateUserDto: UpdateUserDto,
    ) {
      return this.userService.updateUser(id, updateUserDto);
    }
  
    @Delete(':id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Remove um usuário pelo ID' })
    @ApiResponse({ status: 200, description: 'Usuário removido com sucesso.' })
    async deleteUser(@Param('id') id: string) {
      return this.userService.deleteUser(id);
    }
  }
  