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
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FarmsService } from './farms.service';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { FarmResponseDto } from './dto/farm-response.dto';
import { Pagination } from 'nestjs-typeorm-paginate';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('Farms')
@Controller('farms')
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova fazenda' })
  @ApiBody({
    description: 'Dados para criar uma fazenda',
    type: CreateFarmDto,
    examples: {
      exemploValido: {
        summary: 'Exemplo de criação de fazenda',
        value: {
          name: 'Fazenda Santa Maria',
          city: 'Ribeirão Preto',
          state: 'SP',
          totalArea: 150.5,
          arableArea: 100.0,
          vegetationArea: 50.5,
          producerId: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: FarmResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos' })
  async create(@Body() createFarmDto: CreateFarmDto): Promise<FarmResponseDto> {
    return this.farmsService.create(createFarmDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar fazendas com paginação' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: FarmResponseDto, isArray: true })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<Pagination<FarmResponseDto>> {
    return this.farmsService.findAll({ page, limit: Math.min(limit, 100) });
  }

  @Get('search/by-name')
  @ApiOperation({ summary: 'Buscar fazendas por nome' })
  @ApiQuery({ name: 'name', required: true, type: String })
  @ApiResponse({ status: HttpStatus.OK, type: FarmResponseDto, isArray: true })
  async searchByName(@Query('name') name: string): Promise<FarmResponseDto[]> {
    return this.farmsService.searchByName(name);
  }

  @Get('search/by-state-city')
  @ApiOperation({ summary: 'Buscar fazendas por estado e cidade' })
  @ApiQuery({ name: 'state', required: true, type: String })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, type: FarmResponseDto, isArray: true })
  async searchByStateAndCity(
    @Query('state') state: string,
    @Query('city') city?: string,
  ): Promise<FarmResponseDto[]> {
    return this.farmsService.searchByStateAndCity(state, city);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter fazenda por ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'UUID da fazenda' })
  @ApiResponse({ status: HttpStatus.OK, type: FarmResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Fazenda não encontrada' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<FarmResponseDto> {
    return this.farmsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar fazenda' })
  @ApiParam({ name: 'id', type: 'string', description: 'UUID da fazenda' })
  @ApiBody({
    description: 'Dados para atualizar uma fazenda',
    type: UpdateFarmDto,
    examples: {
      exemploAtualizacao: {
        summary: 'Exemplo de atualização de fazenda',
        value: {
          name: 'Fazenda Nova Esperança atualizada',
          city: 'Franca',
          state: 'SP',
          totalArea: 200.0,
          arableArea: 120.0,
          vegetationArea: 80.0,
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, type: FarmResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Fazenda não encontrada' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateFarmDto: UpdateFarmDto,
  ): Promise<FarmResponseDto> {
    return this.farmsService.update(id, updateFarmDto);
  }


  @Delete(':id')
  @ApiOperation({ summary: 'Remover fazenda' })
  @ApiParam({ name: 'id', type: 'string', description: 'UUID da fazenda' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Fazenda removida com sucesso' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Fazenda não encontrada' })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<void> {
    await this.farmsService.remove(id);
  }
}
