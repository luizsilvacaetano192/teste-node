import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth
} from '@nestjs/swagger';
import { PlantedService } from './planted.service';
import { CreatePlantedDto } from './dto/create-planted.dto';
import { UpdatePlantedDto } from './dto/update-planted.dto';
import { PlantedResponseDto } from './dto/planted-response.dto';
import { Pagination } from 'nestjs-typeorm-paginate';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('Culturas Plantadas')
@Controller('planted-cultures')
export class PlantedController {
  constructor(private readonly service: PlantedService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar nova cultura plantada',
    description: 'Cria um novo registro de cultura plantada com os dados informados',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Cultura plantada criada com sucesso',
    type: PlantedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  @ApiBody({
    description: 'Dados da cultura plantada para criação',
    type: CreatePlantedDto,
    examples: {
      exemplo1: {
        summary: 'Exemplo de criação de cultura plantada',
        value: {
          name: 'Soja',
          cropId: '1',
        },
      },
    },
  })
  async create(@Body() dto: CreatePlantedDto): Promise<PlantedResponseDto> {
    return this.service.create(dto);
  }

  @ApiTags('Culturas Plantadas')
  @Get()
  @ApiOperation({
    summary: 'Listar culturas plantadas com paginação',
    description: 'Retorna uma lista paginada de culturas plantadas cadastradas',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página (padrão 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Quantidade de itens por página (padrão 10)',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista paginada de culturas plantadas',
    type: PlantedResponseDto,
    isArray: false,
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<Pagination<PlantedResponseDto>> {
    return this.service.findAll({ page, limit });
  }

  @Get('by-crop')
  @ApiOperation({
    summary: 'Buscar culturas plantadas por safra',
    description: 'Retorna as culturas plantadas associadas a uma safra específica',
  })
  @ApiQuery({
    name: 'cropId',
    required: true,
    description: 'ID da safra',
    type: String,
    example: 'uuid-da-safra',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de culturas plantadas encontradas',
    type: [PlantedResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Safra não encontrada',
  })
  async findByCrop(@Query('cropId') cropId: string): Promise<PlantedResponseDto[]> {
    return this.service.findByCropId(cropId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obter cultura plantada por ID',
    description: 'Retorna os detalhes de uma cultura plantada específica',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da cultura plantada',
    type: String,
    required: true,
    example: 'uuid-da-cultura-plantada',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detalhes da cultura plantada',
    type: PlantedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cultura plantada não encontrada',
  })
  async findOne(@Param('id') id: string): Promise<PlantedResponseDto> {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar cultura plantada',
    description: 'Atualiza os dados de uma cultura plantada existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da cultura plantada a ser atualizada',
    type: String,
    required: true,
    example: 'uuid-da-cultura-plantada',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cultura plantada atualizada com sucesso',
    type: PlantedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cultura plantada não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  @ApiBody({
    description: 'Dados para atualizar a cultura plantada',
    type: UpdatePlantedDto,
    examples: {
      exemplo: {
        summary: 'Alteração da área plantada',
        value: {
          area: 150,
          plantingDate: '2023-01-20',
        },
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePlantedDto,
  ): Promise<PlantedResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover cultura plantada',
    description: 'Remove permanentemente uma cultura plantada do sistema',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da cultura plantada a ser removida',
    type: String,
    required: true,
    example: 'uuid-da-cultura-plantada',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Cultura plantada removida com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cultura plantada não encontrada',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
