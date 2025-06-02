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
import { CropsService } from './crops.service';
import { CreateCropDto } from './dto/create-crop.dto';
import { UpdateCropDto } from './dto/update-crop.dto';
import { CropResponseDto } from './dto/crop-response.dto';
import { Pagination } from 'nestjs-typeorm-paginate';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';


@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Crops')
@Controller('crops')
export class CropsController {
  constructor(private readonly cropsService: CropsService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar nova cultura',
    description: 'Cria um novo registro de cultura agrícola com os dados informados',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Cultura criada com sucesso',
    type: CropResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  @ApiBody({
    description: 'Dados da cultura para criação',
    type: CreateCropDto,
    examples: {
      exemplo1: {
        summary: 'Exemplo de criação de cultura',
        value: {
          name: 'Safra 2017',
          year: '2017',
          farmId: 1
        },
      },
    },
  })
  async create(@Body() createCropDto: CreateCropDto): Promise<CropResponseDto> {
    return this.cropsService.create(createCropDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar culturas com paginação',
    description: 'Retorna uma lista paginada de culturas agrícolas cadastradas',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página (padrão 1). Se não informado, retorna todos os registros',
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
    description: 'Lista paginada de culturas',
    type: [CropResponseDto],
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<Pagination<CropResponseDto>> {
    return this.cropsService.findAll({ page, limit });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obter Safre  por ID',
    description: 'Retorna os detalhes de uma Safra agrícola específica',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da cultura',
    type: String,
    required: true,
    example: '1',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detalhes da cultura',
    type: CropResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cultura não encontrada',
  })
  async findOne(@Param('id') id: string): Promise<CropResponseDto> {
    return this.cropsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar cultura',
    description: 'Atualiza os dados de uma cultura agrícola existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da cultura a ser atualizada',
    type: String,
    required: true,
    example: '1',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cultura atualizada com sucesso',
    type: CropResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cultura não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  @ApiBody({
    description: 'Dados para atualizar a cultura',
    type: UpdateCropDto,
    examples: {
      exemplo: {
        summary: 'Alteração da data de colheita',
        value: {
          name: 'Safra 2019',
          year: '2019',
          farmId: 1
        },
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() updateCropDto: UpdateCropDto,
  ): Promise<CropResponseDto> {
    return this.cropsService.update(id, updateCropDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover cultura',
    description: 'Remove permanentemente uma cultura agrícola do sistema',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da cultura a ser removida',
    type: String,
    required: true,
    example: '2',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Cultura removida com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cultura não encontrada',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.cropsService.remove(id);
  }

  @Get('search/by-name')
  @ApiOperation({
    summary: 'Buscar culturas por nome',
    description: 'Busca culturas agrícolas cujo nome contenha o termo pesquisado',
  })
  @ApiQuery({
    name: 'name',
    required: true,
    description: 'Parte do nome da cultura',
    example: 'Soj',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de culturas encontradas',
    type: [CropResponseDto],
  })
  async searchByName(@Query('name') name: string): Promise<CropResponseDto[]> {
    return this.cropsService.searchByName(name);
  }

  @Get('search/by-farm/:farmId')
  @ApiOperation({
    summary: 'Buscar culturas por fazenda',
    description: 'Busca culturas agrícolas associadas a uma fazenda específica',
  })
  @ApiParam({
    name: 'farmId',
    description: 'ID da fazenda',
    type: String,
    required: true,
    example: '1',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de culturas encontradas na fazenda',
    type: [CropResponseDto],
  })
  async searchByFarm(@Param('farmId') farmId: string): Promise<CropResponseDto[]> {
    return this.cropsService.searchByFarm(farmId);
  }

  @Get('search/by-date-range')
  @ApiOperation({
    summary: 'Buscar culturas por período',
    description: 'Busca culturas agrícolas plantadas ou colhidas em um período específico',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Data inicial no formato YYYY-MM-DD',
    example: '2023-09-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'Data final no formato YYYY-MM-DD',
    example: '2023-12-31',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Pegando os plantios por data',
    example: 'planting',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de culturas encontradas no período',
    type: [CropResponseDto],
  })
  async searchByDateRange(
    @Query('starYear') startYear: string,
    @Query('endYear') endYear: string,
  ): Promise<CropResponseDto[]> {
    return this.cropsService.searchByDateRange(startYear, endYear);
  }
}