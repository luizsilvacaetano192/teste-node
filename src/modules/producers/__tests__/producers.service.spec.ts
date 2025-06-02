import { Test, TestingModule } from '@nestjs/testing';
import { ProducersService } from '../producers.service';
import { CreateProducerDto } from '../dto/create-producer.dto';
import { DocumentType, Producer } from '../entities/producer.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock RedisService
const mockRedisService = {
  del: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
};


// Factory do repositório em memória — criamos uma função para limpar o banco entre os testes
const mockRepository = () => {
  const db = new Map<string, Producer>();

  return {
    save: jest.fn(async (producer: Producer) => {
      const id = producer.id ?? `${Math.random()}`.substring(2);
      const saved = { ...producer, id };
      db.set(id, saved);
      return saved;
    }),
    findOneBy: jest.fn(async (where: any) => {
      for (const value of db.values()) {
        if ((where.id && value.id === where.id) ||
            (where.documentNumber && value.documentNumber === where.documentNumber)) {
          return value;
        }
      }
      return null;
    }),
    delete: jest.fn(async ({ id }) => {
      const existed = db.delete(id);
      return { affected: existed ? 1 : 0 };
    }),
    clearDb: () => db.clear(),
  };
};

describe('ProducersService', () => {
  let service: ProducersService;
  let repository: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    repository = mockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProducersService,
        { provide: 'RedisService', useValue: mockRedisService },
        { provide: 'ProducerRepository', useValue: repository },
      ],
    }).compile();

    service = module.get<ProducersService>(ProducersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.clearDb();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('criar', () => {
    it('deve criar um produtor com CPF válido', async () => {
      const producerData: CreateProducerDto = {
        name: 'Rebeca Santos',
        documentNumber: '123.456.789-09',
        documentType: DocumentType.CPF,
      };

      jest.spyOn(service as any, 'validateCPF').mockReturnValue(true);

      const result = await service.create(producerData);

      expect(result).toMatchObject({
        id: expect.any(String),
        name: 'Rebeca Santos',
        documentNumber: '12345678909', // sem pontuação
        documentType: DocumentType.CPF,
      });
    });

    it('deve criar um produtor com CNPJ válido', async () => {
      const producerData: CreateProducerDto = {
        name: 'Fazenda Teste 1',
        documentNumber: '40.703.515/0001-72',
        documentType: DocumentType.CNPJ,
      };

      jest.spyOn(service as any, 'validateCNPJ').mockReturnValue(true);

      const result = await service.create(producerData);

      expect(result).toMatchObject({
        id: expect.any(String),
        name: 'Fazenda Teste 1',
        documentNumber: '40703515000172',
        documentType: DocumentType.CNPJ,
      });
    });

    it('deve lançar erro com CPF inválido', async () => {
      const producerData: CreateProducerDto = {
        name: 'Thales Silva',
        documentNumber: '000.000.000-00',
        documentType: DocumentType.CPF,
      };

      jest.spyOn(service as any, 'validateCPF').mockReturnValue(false);

      await expect(service.create(producerData)).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro com CNPJ inválido', async () => {
      const producerData: CreateProducerDto = {
        name: 'Fazenda Feliz LTDA',
        documentNumber: '11.111.111/1111-11',
        documentType: DocumentType.CNPJ,
      };

      jest.spyOn(service as any, 'validateCNPJ').mockReturnValue(false);

      await expect(service.create(producerData)).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro quando documento já existe', async () => {
      const producerData: CreateProducerDto = {
        name: 'Rebeca Santos',
        documentNumber: '123.456.789-09',
        documentType: DocumentType.CPF,
      };

      jest.spyOn(service as any, 'validateCPF').mockReturnValue(true);

      await service.create(producerData);

      // segunda tentativa com mesmo documento deve lançar erro
      await expect(service.create(producerData)).rejects.toThrow(BadRequestException);
    });
  });

  describe('buscarPorId', () => {
    it('deve retornar um produtor existente', async () => {
      jest.spyOn(service as any, 'validateCPF').mockReturnValue(true);

      const producer = await service.create({
        name: 'Rebeca Santos',
        documentNumber: '123.456.789-09',
        documentType: DocumentType.CPF,
      });

      const result = await service.findOne(producer.id);
      expect(result).toEqual(producer);
    });

    it('deve lançar erro quando produtor não existe', async () => {
      await expect(service.findOne('id_inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('atualizar', () => {
    it('deve atualizar os dados do produtor', async () => {
      jest.spyOn(service as any, 'validateCPF').mockReturnValue(true);

      const producer = await service.create({
        name: 'João Silva',
        documentNumber: '123.456.789-09',
        documentType: DocumentType.CPF,
      });

      const update = {
        name: 'João Silva Santos',
        documentNumber: '123.456.789-09',
        documentType: DocumentType.CPF,
      };

      const result = await service.update(producer.id, update);
      expect(result.name).toBe('João Silva Santos');
    });

    it('deve lançar erro ao atualizar produtor inexistente', async () => {
      const update = {
        name: 'Nome qualquer',
        documentNumber: '123.456.789-09',
        documentType: DocumentType.CPF,
      };

      await expect(service.update('id_inexistente', update)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remover', () => {
    it('deve remover um produtor existente', async () => {
      jest.spyOn(service as any, 'validateCPF').mockReturnValue(true);

      const producer = await service.create({
        name: 'João Silva',
        documentNumber: '123.456.789-09',
        documentType: DocumentType.CPF,
      });

      await service.remove(producer.id);
      await expect(service.findOne(producer.id)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar erro ao remover produtor inexistente', async () => {
      await expect(service.remove('id_inexistente')).rejects.toThrow(NotFoundException);
    });
  });
});
