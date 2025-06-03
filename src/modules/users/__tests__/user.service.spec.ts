import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../user.service';
import { User } from '../entities/user.entity';
import { RedisService } from '../../redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock bcrypt at module level
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword'),
  compare: jest.fn().mockImplementation((plain: string, hash: string) => 
    Promise.resolve(plain + '_compared' === hash)
  ),
}));

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let redisService: RedisService;
  let loggerService: LoggerService;

  const mockUser: User = {
    id: '1',
    username: 'luiz_teste',
    password: 'hashedpassword',
    refresh_token: 'refreshtoken'
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn().mockImplementation((options: { where: Partial<User> }) => {
              if (options.where.username === 'luiz_teste') {
                return Promise.resolve(mockUser);
              }
              return Promise.resolve(null);
            }),
            save: jest.fn().mockImplementation((user: User) => Promise.resolve(user)),
            create: jest.fn().mockImplementation((dto: Partial<User>) => ({
              id: '1',
              username: dto.username,
              password: 'hashedpassword',
              refresh_token: dto.refresh_token
            })),
            update: jest.fn().mockResolvedValue({ affected: 1 }),
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
            find: jest.fn().mockResolvedValue([mockUser]),
            findOneBy: jest.fn().mockImplementation(({ id, username, refresh_token }: 
              { id?: string, username?: string, refresh_token?: string }) => {
              if (id === '1' || username === 'luiz_teste' || refresh_token === 'refreshtoken') {
                return Promise.resolve(mockUser);
              }
              return Promise.resolve(null);
            }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => 
              key === 'user:1' ? Promise.resolve(JSON.stringify(mockUser)) : Promise.resolve(null)
            ),
            set: jest.fn().mockResolvedValue('OK'),
            del: jest.fn().mockResolvedValue(1),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn().mockImplementation((message: string) => console.log(message)),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    redisService = module.get<RedisService>(RedisService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const createUserDto = {
        username: 'new_user',
        password: 'password123'
      };

      const result = await service.create(createUserDto);
      
      expect(result).toEqual({
        id: '1',
        username: 'new_user',
        password: 'hashedpassword',
        refresh_token: undefined
      });

      expect(require('bcrypt').hash).toHaveBeenCalledWith('password123', 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        username: 'new_user',
        password: 'hashedpassword'
      });
      expect(userRepository.save).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalledWith(
        'user:1',
        JSON.stringify({
          id: '1',
          username: 'new_user',
          password: 'hashedpassword',
          refresh_token: undefined
        })
      );
      expect(loggerService.log).toHaveBeenCalledWith('Iniciando criação de usuário');
      expect(loggerService.log).toHaveBeenCalledWith('Usuário criado com sucesso: 1');
    });

    it('should throw BadRequestException if username exists', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
      await expect(service.create({ username: 'luiz_teste', password: 'pass' }))
        .rejects.toThrow(BadRequestException);
      expect(loggerService.warn).toHaveBeenCalledWith('Usuário já existe com o nome: luiz_teste');
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockUser]);
      expect(userRepository.find).toHaveBeenCalled();
      expect(loggerService.log).toHaveBeenCalledWith('Buscando todos os usuários');
      expect(loggerService.log).toHaveBeenCalledWith('Total de usuários encontrados: 1');
    });
  });

  describe('findById', () => {
    it('should return user from cache if available', async () => {
      const result = await service.findById('1');
      expect(result).toEqual(mockUser);
      expect(redisService.get).toHaveBeenCalledWith('user:1');
      expect(userRepository.findOneBy).not.toHaveBeenCalled();
      expect(loggerService.log).toHaveBeenCalledWith('Buscando usuário por ID: 1');
      expect(loggerService.log).toHaveBeenCalledWith('Usuário encontrado no cache Redis: 1');
    });

    it('should fetch from database if not in cache', async () => {
      (redisService.get as jest.Mock).mockResolvedValueOnce(null);
      const result = await service.findById('1');
      expect(result).toEqual(mockUser);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: '1' });
      expect(loggerService.log).toHaveBeenCalledWith('Usuário encontrado: luiz_teste');
    });

    it('should return null if user not found', async () => {
      (redisService.get as jest.Mock).mockResolvedValueOnce(null);
      (userRepository.findOneBy as jest.Mock).mockResolvedValueOnce(null);
      const result = await service.findById('999');
      expect(result).toBeNull();
      expect(loggerService.warn).toHaveBeenCalledWith('Usuário não encontrado com ID: 999');
    });
  });

  describe('findByUsername', () => {
    it('should return user by username', async () => {
      const result = await service.findByUsername('luiz_teste');
      expect(result).toEqual(mockUser);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ username: 'luiz_teste' });
      expect(loggerService.log).toHaveBeenCalledWith('Buscando usuário por username: luiz_teste');
      expect(loggerService.log).toHaveBeenCalledWith('Usuário encontrado: ID 1');
    });

    it('should return null when user not found', async () => {
      (userRepository.findOneBy as jest.Mock).mockResolvedValueOnce(null);
      const result = await service.findByUsername('unknown');
      expect(result).toBeNull();
      expect(loggerService.warn).toHaveBeenCalledWith('Usuário não encontrado com username: unknown');
    });
  });

  describe('validatePassword', () => {
    it('should validate correct password', async () => {
      const isValid = await service.validatePassword('password', 'password_compared');
      expect(isValid).toBe(true);
      expect(require('bcrypt').compare).toHaveBeenCalledWith('password', 'password_compared');
    });

    it('should reject incorrect password', async () => {
      const isValid = await service.validatePassword('wrong', 'password_compared');
      expect(isValid).toBe(false);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const updateData = { username: 'updated_user' };
      await service.update('1', updateData);
      expect(userRepository.update).toHaveBeenCalledWith('1', updateData);
      expect(loggerService.log).toHaveBeenCalledWith('Atualizando usuário ID: 1');
      expect(loggerService.log).toHaveBeenCalledWith('Usuário atualizado com sucesso: 1');
    });

    it('should hash password if provided', async () => {
      const updateData = { password: 'newpassword' };
      await service.update('1', updateData);
      expect(require('bcrypt').hash).toHaveBeenCalledWith('newpassword', 10);
    });

    it('should throw if user not found', async () => {
      (userRepository.findOneBy as jest.Mock).mockResolvedValueOnce(null);
      await expect(service.update('999', {})).rejects.toThrow(NotFoundException);
      expect(loggerService.warn).toHaveBeenCalledWith('Usuário não encontrado para atualização: 999');
    });
  });

  describe('updateRefreshToken', () => {
    it('should update refresh token', async () => {
      await service.updateRefreshToken('1', 'new_token');
      expect(userRepository.update).toHaveBeenCalledWith('1', { refresh_token: 'new_token' });
      expect(redisService.del).toHaveBeenCalledWith('user:1');
      expect(loggerService.log).toHaveBeenCalledWith('Atualizando refresh token do usuário ID: 1');
    });
  });

  describe('findByRefreshToken', () => {
    it('should return user by refresh token', async () => {
      const result = await service.findByRefreshToken('refreshtoken');
      expect(result).toEqual(mockUser);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ refresh_token: 'refreshtoken' });
      expect(loggerService.log).toHaveBeenCalledWith('Buscando usuário por refresh token');
    });

    it('should return null when refresh token not found', async () => {
      (userRepository.findOneBy as jest.Mock).mockResolvedValueOnce(null);
      const result = await service.findByRefreshToken('invalidtoken');
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should delete user', async () => {
      await service.remove('1');
      expect(userRepository.delete).toHaveBeenCalledWith('1');
      expect(redisService.del).toHaveBeenCalledWith('user:1');
      expect(loggerService.log).toHaveBeenCalledWith('Removendo usuário ID: 1');
      expect(loggerService.log).toHaveBeenCalledWith('Usuário removido com sucesso: 1');
    });

    it('should throw if user not found', async () => {
      (userRepository.delete as jest.Mock).mockResolvedValueOnce({ affected: 0 });
      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
      expect(loggerService.warn).toHaveBeenCalledWith('Tentativa de remoção falhou. Usuário não encontrado: 999');
    });
  });
});