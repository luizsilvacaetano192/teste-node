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
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { ProducersService } from './producers.service';
import { CreateProducerDto, DocumentType } from './dto/create-producer.dto';
import { UpdateProducerDto } from './dto/update-producer.dto';
import { ProducerResponseDto } from './dto/producer-response.dto';
import { Pagination } from 'nestjs-typeorm-paginate';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('Producers')
@Controller('producers')
export class ProducersController {
  constructor(private readonly producersService: ProducersService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar novo produtor rural',
    description: 'Cria um novo registro de produtor rural com CPF ou CNPJ',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Produtor criado com sucesso',
    type: ProducerResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos ou documento já cadastrado',
  })
  @ApiBody({
    description: 'Dados do produtor rural',
    type: CreateProducerDto,
    examples: {
      exemploCPF: {
        summary: 'Cadastro com CPF',
        value: {
          name: 'Luiz Silva Caetano',
          documentNumber: '32314319800',
          documentType: DocumentType.CPF,
        },
      },
      exemploCNPJ: {
        summary: 'Cadastro com CNPJ',
        value: {
          name: 'Luiz Silva Caetano Jr MEI',
          documentNumber: '40703515000172',
          documentType: DocumentType.CNPJ,
        },
      },
    },
  })
  async create(@Body() createProducerDto: CreateProducerDto): Promise<ProducerResponseDto> {
    const producer = await this.producersService.create(createProducerDto);
    return new ProducerResponseDto(producer);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar produtores com paginação',
    description: 'Retorna uma lista paginada de produtores cadastrados',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista paginada de produtores',
    type: ProducerResponseDto,
    isArray: true,
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<Pagination<ProducerResponseDto>> {
    const result = await this.producersService.findAll({
      page: page ?? 1,
      limit: limit ?? 10,
    });

    return {
      items: result.items.map((p) => new ProducerResponseDto(p)),
      meta: result.meta,
      links: result.links,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obter produtor por ID',
    description: 'Retorna os detalhes de um produtor rural específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do produtor rural',
    type: String,
    example: '1',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detalhes do produtor rural',
    type: ProducerResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Produtor não encontrado',
  })
  async findOne(@Param('id') id: string): Promise<ProducerResponseDto> {
    const producer = await this.producersService.findOne(id);
    return new ProducerResponseDto(producer);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar produtor rural',
    description: 'Atualiza os dados de um produtor rural existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do produtor rural',
    type: String,
    example: '1',
  })
  @ApiBody({
    description: 'Dados para atualizar o produtor',
    type: UpdateProducerDto,
    examples: {
      exemplo: {
        summary: 'Alteração do nome',
        value: {
          name: 'Luiz Caetano',
          documentNumber: '47194877007',
          documentType: DocumentType.CPF,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Produtor atualizado com sucesso',
    type: ProducerResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Produtor não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  async update(
    @Param('id') id: string,
    @Body() updateProducerDto: UpdateProducerDto,
  ): Promise<ProducerResponseDto> {
    const updated = await this.producersService.update(id, updateProducerDto);
    return new ProducerResponseDto(updated);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover produtor rural',
    description: 'Remove permanentemente um produtor rural do sistema',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do produtor rural',
    type: String,
    example: '2',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Produtor removido com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Produtor não encontrado',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.producersService.remove(id);
  }

  @Get('search/by-name')
  @ApiOperation({
    summary: 'Buscar produtores por nome',
    description: 'Busca produtores rurais cujo nome contenha o termo pesquisado',
  })
  @ApiQuery({
    name: 'name',
    required: true,
    description: 'Parte do nome do produtor',
    example: 'Luiz',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de produtores encontrados',
    type: [ProducerResponseDto],
  })
  async searchByName(@Query('name') name: string): Promise<ProducerResponseDto[]> {
    const results = await this.producersService.searchByName(name);
    return results.map((p) => new ProducerResponseDto(p));
  }

  @Get('search/by-document-type/:type')
  @ApiOperation({
    summary: 'Filtrar produtores por tipo de documento',
    description: 'Retorna produtores rurais filtrando por CPF ou CNPJ',
  })
  @ApiParam({
    name: 'type',
    description: 'Tipo de documento (CPF ou CNPJ)',
    enum: DocumentType,
    example: 'CPF',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de produtores filtrados',
    type: [ProducerResponseDto],
  })
  async findByDocumentType(@Param('type') type: DocumentType): Promise<ProducerResponseDto[]> {
    const results = await this.producersService.findByDocumentType(type);
    return results.map((p) => new ProducerResponseDto(p));
  }

  @Get('search/by-document')
  @ApiOperation({
    summary: 'Filtrar produtores por tipo e número de documento',
    description: 'Retorna produtores rurais filtrando por CPF ou CNPJ e número do documento',
  })
  @ApiQuery({
    name: 'type',
    enum: DocumentType,
    required: true,
    description: 'Tipo do documento: CPF ou CNPJ',
    example: 'CPF',
  })
  @ApiQuery({
    name: 'number',
    required: true,
    description: 'Número do documento para filtrar',
    example: '32314319800',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de produtores filtrados',
    type: [ProducerResponseDto],
  })
  async findByDocument(
    @Query('type') type: DocumentType,
    @Query('number') number: string,
  ): Promise<ProducerResponseDto[]> {
    const results = await this.producersService.findByDocument(type, number);
    return results.map((p) => new ProducerResponseDto(p));
  }
}
