import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, ILike } from 'typeorm';
import { CreateProducerDto, DocumentType } from './dto/create-producer.dto';
import { UpdateProducerDto } from './dto/update-producer.dto';
import { ProducerResponseDto } from './dto/producer-response.dto';
import { Producer } from './entities/producer.entity';
import { RedisService } from '../redis/redis.service';
import { paginate, Pagination, IPaginationOptions } from 'nestjs-typeorm-paginate';
import { LoggerService } from '../../shared/logger/logger.service';

@Injectable()
export class ProducersService {

  constructor(
    @InjectRepository(Producer)
    private readonly producerRepository: Repository<Producer>,
    private readonly redisService: RedisService,
    private readonly logger: LoggerService
  ) {}

  private cleanDocument(documentNumber: string): string {
    return documentNumber.replace(/\D/g, '');
  }

  private validateCPF(cpf: string): boolean {
    cpf = cpf.replace(/\D/g, '');

    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;

    let sum = 0;
    let rest;

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i - 1, i), 10) * (11 - i);
    }
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cpf.substring(9, 10), 10)) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i - 1, i), 10) * (12 - i);
    }
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    return rest === parseInt(cpf.substring(10, 11), 10);
  }

  private validateCNPJ(cnpj: string): boolean {
    cnpj = cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

    const validateDigit = (cnpj: string, pos: number) => {
      let sum = 0;
      let size = pos - 7;
      for (let i = pos; i >= 1; i--) {
        sum += parseInt(cnpj.charAt(pos - i), 10) * size--;
        if (size < 2) size = 9;
      }
      const result = sum % 11;
      return result < 2 ? 0 : 11 - result;
    };

    return (
      validateDigit(cnpj, 12) === parseInt(cnpj.charAt(12), 10) &&
      validateDigit(cnpj, 13) === parseInt(cnpj.charAt(13), 10)
    );
  }

  private async existsDocument(documentNumber: string): Promise<boolean> {
    const count = await this.producerRepository.count({ where: { documentNumber } });
    return count > 0;
  }

  async create(createProducerDto: CreateProducerDto): Promise<Producer> {
    this.logger.log('Iniciando criação de produtor');
    const documentNumber = this.cleanDocument(createProducerDto.documentNumber);
    const { documentType } = createProducerDto;

    if (documentType === DocumentType.CPF && !this.validateCPF(documentNumber)) {
      this.logger.warn('CPF inválido informado');
      throw new BadRequestException('CPF inválido');
    }

    if (documentType === DocumentType.CNPJ && !this.validateCNPJ(documentNumber)) {
      this.logger.warn('CNPJ inválido informado');
      throw new BadRequestException('CNPJ inválido');
    }

    if (await this.existsDocument(documentNumber)) {
      this.logger.warn(`Documento duplicado: ${documentNumber}`);
      throw new BadRequestException('Documento já cadastrado');
    }

    const newProducer = this.producerRepository.create({
      ...createProducerDto,
      documentNumber,
    });

    const savedProducer = await this.producerRepository.save(newProducer);
    await this.redisService.set(`producer:${savedProducer.id}`, JSON.stringify(savedProducer));

    this.logger.log(`Produtor criado com sucesso: ${savedProducer.id}`);
    return savedProducer;
  }

  async findAll(options?: IPaginationOptions): Promise<Pagination<ProducerResponseDto>> {
    this.logger.log('findAll chamado com opções:', options);

    const queryBuilder = this.producerRepository
      .createQueryBuilder('producer')
      .leftJoinAndSelect('producer.farms', 'farm');

    if (options?.page && options?.limit) {
      this.logger.log(`Paginação ativada: página ${options.page}, limite ${options.limit}`);

      const result = await paginate<Producer>(queryBuilder, options);

      const items = result.items.map((producer) => new ProducerResponseDto(producer));

      this.logger.log(`Paginação retornou ${items.length} itens, total ${result.meta.totalItems}`);

      return {
        ...result,
        items,
      };
    } else {
      this.logger.log('Nenhuma paginação informada, buscando todos os produtores.');

      const data = await queryBuilder.getMany();

      const items = data.map((producer) => new ProducerResponseDto(producer));

      this.logger.log(`Foram retornados ${items.length} produtores`);

      return {
        items,
        meta: {
          totalItems: items.length,
          itemCount: items.length,
          itemsPerPage: items.length,
          totalPages: 1,
          currentPage: 1,
        },
        links: {
          first: '',
          previous: '',
          next: '',
          last: '',
        },
      };
    }
  }

  async findOne(id: string): Promise<ProducerResponseDto> {
    this.logger.log(`findOne chamado com ID: ${id}`);

    const producer = await this.producerRepository
      .createQueryBuilder('producer')
      .leftJoinAndSelect('producer.farms', 'farm')
      .where('producer.id = :id', { id })
      .getOne();

    if (!producer) {
      this.logger.warn(`Produtor com id ${id} não encontrado`);
      throw new NotFoundException(`Produtor com id ${id} não encontrado`);
    }

    this.logger.log(`Produtor encontrado: ${producer.name} com ${producer.farms?.length || 0} fazenda(s)`);

    const result = new ProducerResponseDto(producer);
    this.logger.log(`DTO retornado: ${JSON.stringify(result)}`);

    return result;
  }



  async update(id: string, updateProducerDto: UpdateProducerDto): Promise<Producer> {
    this.logger.log(`Atualizando produtor: ${id}`);
    const producer = await this.findOne(id);
    const documentNumber = this.cleanDocument(updateProducerDto.documentNumber);
    const { documentType } = updateProducerDto;

    if (documentType === DocumentType.CPF && !this.validateCPF(documentNumber)) {
      this.logger.warn('CPF inválido na atualização');
      throw new BadRequestException('CPF inválido');
    }

    if (documentType === DocumentType.CNPJ && !this.validateCNPJ(documentNumber)) {
      this.logger.warn('CNPJ inválido na atualização');
      throw new BadRequestException('CNPJ inválido');
    }

    const exists = await this.producerRepository.findOne({
      where: {
        documentNumber,
        id: Not(id),
      },
    });

    if (exists) {
      this.logger.warn(`Documento já utilizado por outro produtor: ${documentNumber}`);
      throw new BadRequestException('Documento já cadastrado para outro produtor');
    }

    Object.assign(producer, updateProducerDto, { documentNumber });
    const updatedProducer = await this.producerRepository.save(producer);
    await this.redisService.set(`producer:${id}`, JSON.stringify(updatedProducer));

    this.logger.log(`Produtor atualizado com sucesso: ${id}`);
    return updatedProducer;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removendo produtor: ${id}`);
    const result = await this.producerRepository.delete(id);
    if (result.affected === 0) {
      this.logger.warn(`Tentativa de remoção falhou. Produtor não encontrado: ${id}`);
      throw new NotFoundException('Produtor não encontrado');
    }
    await this.redisService.del(`producer:${id}`);
    this.logger.log(`Produtor removido com sucesso: ${id}`);
  }

  async searchByName(name: string): Promise<Producer[]> {
    this.logger.log(`Buscando produtores por nome: ${name}`);
    return this.producerRepository.find({
      where: {
        name: ILike(`%${name}%`),
      },
    });
  }

  async findByDocumentType(type: DocumentType): Promise<Producer[]> {
    this.logger.log(`Buscando produtores por tipo de documento: ${type}`);
    return this.producerRepository.find({
      where: {
        documentType: type,
      },
    });
  }

  async findByDocument(type: DocumentType, number: string): Promise<Producer[]> {
    const cleanNumber = this.cleanDocument(number);
    this.logger.log(`Buscando produtores por documento (${type}): ${cleanNumber}`);
    return this.producerRepository.find({
      where: {
        documentType: type,
        documentNumber: cleanNumber,
      },
    });
  }
}
