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
import { plainToInstance } from 'class-transformer';
import { Pagination } from 'nestjs-typeorm-paginate';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Farms')
@Controller('farms')
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar nova fazenda',
    description: 'Cria um novo registro de fazenda com os dados informados.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Fazenda criada com sucesso.',
    type: FarmResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos.',
  })
  @ApiBody({
    description: 'Dados da fazenda para criação.',
    type: CreateFarmDto,
    examples: {
      exemplo: {
        summary: 'Exemplo de criação de fazenda',
        value: {
          name: 'Fazenda teste 1',
          city: 'Uberlândia',
          state: 'MG',
          totalArea: 150,
          arableArea: 100,
          vegetationArea: 50,
          producerId: 'uuid-do-produtor',
        },
      },
    },
  })
  async create(@Body() createFarmDto: CreateFarmDto): Promise<FarmResponseDto> {
    const farm = await this.farmsService.create(createFarmDto);
    return plainToInstance(FarmResponseDto, farm);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar fazendas com paginação',
    description: 'Retorna uma lista paginada de fazendas cadastradas.',
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
    description: 'Quantidade de itens por página (padrão 10, máximo 100)',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista paginada de fazendas.',
    type: FarmResponseDto,
    isArray: true,
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<Pagination<FarmResponseDto>> {
    const limitNumber = Math.min(limit, 100); // limite máximo 100

    const result = await this.farmsService.findAll({
      page,
      limit: limitNumber,
    });

    return {
      items: result.items.map(farm => plainToInstance(FarmResponseDto, farm)),
      meta: result.meta,
      links: result.links,
    };
  }

  @Get('search/by-name')
  @ApiOperation({
    summary: 'Buscar fazendas por nome',
    description: 'Busca fazendas cujo nome contenha o termo pesquisado.',
  })
  @ApiQuery({
    name: 'name',
    required: true,
    description: 'Parte do nome da fazenda',
    example: 'Boa',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de fazendas encontradas.',
    type: [FarmResponseDto],
  })
  async searchByName(@Query('name') name: string): Promise<FarmResponseDto[]> {
    const farms = await this.farmsService.searchByName(name);
    return farms.map(farm => plainToInstance(FarmResponseDto, farm));
  }

  @Get('search/by-state-city')
  @ApiOperation({
    summary: 'Buscar fazendas por estado e cidade',
    description: 'Busca fazendas pelo estado (obrigatório) e cidade (opcional).',
  })
  @ApiQuery({
    name: 'state',
    required: true,
    description: 'Sigla ou nome do estado da fazenda',
    example: 'MG',
  })
  @ApiQuery({
    name: 'city',
    required: false,
    description: 'Nome da cidade (opcional)',
    example: 'Uberlândia',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de fazendas encontradas.',
    type: [FarmResponseDto],
  })
  async searchByStateAndCity(
    @Query('state') state: string,
    @Query('city') city?: string,
  ): Promise<FarmResponseDto[]> {
    const farms = await this.farmsService.searchByStateAndCity(state, city);
    return farms.map(farm => plainToInstance(FarmResponseDto, farm));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obter fazenda por ID',
    description: 'Retorna os detalhes de uma fazenda específica.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da fazenda',
    type: String,
    required: true,
    example: '1',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detalhes da fazenda.',
    type: FarmResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Fazenda não encontrada.',
  })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<FarmResponseDto> {
    const farm = await this.farmsService.findOne(id);
    return plainToInstance(FarmResponseDto, farm);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar fazenda',
    description: 'Atualiza os dados de uma fazenda existente.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da fazenda a ser atualizada',
    type: String,
    required: true,
    example: '1',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fazenda atualizada com sucesso.',
    type: FarmResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Fazenda não encontrada.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos.',
  })
  @ApiBody({
    description: 'Dados para atualizar a fazenda.',
    type: UpdateFarmDto,
    examples: {
      exemplo: {
        summary: 'Alteração completa dos dados da fazenda',
        value: {
          name: 'Fazenda Boa Vista Alterada',
          city: 'Uberlândia',
          state: 'MG',
          totalArea: 160,
          arableArea: 110,
          vegetationArea: 50,
        },
      },
    },
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateFarmDto: UpdateFarmDto,
  ): Promise<FarmResponseDto> {
    const farm = await this.farmsService.update(id, updateFarmDto);
    return plainToInstance(FarmResponseDto, farm);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover fazenda',
    description: 'Remove permanentemente uma fazenda do sistema.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da fazenda a ser removida',
    type: String,
    required: true,
    example: '2',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Fazenda removida com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Fazenda não encontrada.',
  })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<void> {
    await this.farmsService.remove(id);
  }
}
