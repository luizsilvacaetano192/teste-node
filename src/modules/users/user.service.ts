import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { LoggerService } from '../../shared/logger/logger.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly logger: LoggerService,
    private readonly redisService: RedisService,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    this.logger.log('Iniciando criação de usuário');

    const existingUser = await this.usersRepository.findOne({
      where: { username: userData.username },
    });

    if (existingUser) {
      this.logger.warn(`Usuário já existe com o nome: ${userData.username}`);
      throw new BadRequestException('Nome de usuário já está em uso');
    }

    if (userData.password) {
      const saltRounds = 10;
      userData.password = await bcrypt.hash(userData.password, saltRounds);
    }

    const user = this.usersRepository.create(userData);
    const savedUser = await this.usersRepository.save(user);

    // Salvar no Redis
    await this.redisService.set(`user:${savedUser.id}`, JSON.stringify(savedUser));

    this.logger.log(`Usuário criado com sucesso: ${savedUser.id}`);
    return savedUser;
  }

  async findAll(): Promise<User[]> {
    this.logger.log('Buscando todos os usuários');
    const users = await this.usersRepository.find();
    this.logger.log(`Total de usuários encontrados: ${users.length}`);
    return users;
  }

  async findById(id: string): Promise<User | null> {
    this.logger.log(`Buscando usuário por ID: ${id}`);

    const cached = await this.redisService.get(`user:${id}`);
    if (cached) {
      this.logger.log(`Usuário encontrado no cache Redis: ${id}`);
      return JSON.parse(cached) as User;
    }

    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      this.logger.warn(`Usuário não encontrado com ID: ${id}`);
      return null;
    }

    await this.redisService.set(`user:${id}`, JSON.stringify(user));
    this.logger.log(`Usuário encontrado: ${user.username}`);
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    this.logger.log(`Buscando usuário por username: ${username}`);
    const user = await this.usersRepository.findOneBy({ username });

    if (!user) {
      this.logger.warn(`Usuário não encontrado com username: ${username}`);
      return null;
    }

    await this.redisService.set(`user:${user.id}`, JSON.stringify(user));
    this.logger.log(`Usuário encontrado: ID ${user.id}`);
    return user;
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    this.logger.log(`Atualizando usuário ID: ${id}`);

    const user = await this.findById(id);
    if (!user) {
      this.logger.warn(`Usuário não encontrado para atualização: ${id}`);
      throw new NotFoundException('Usuário não encontrado');
    }

    if (updateData.password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    }

    await this.usersRepository.update(id, updateData);
    const updatedUser = await this.findById(id);

    await this.redisService.set(`user:${id}`, JSON.stringify(updatedUser));
    this.logger.log(`Usuário atualizado com sucesso: ${id}`);
    return updatedUser!;
  }

  async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    this.logger.log(`Atualizando refresh token do usuário ID: ${userId}`);
    await this.usersRepository.update(userId, { refresh_token: refreshToken });
    await this.redisService.del(`user:${userId}`); // forçar recache
  }

  async findByRefreshToken(refreshToken: string): Promise<User | null> {
    this.logger.log(`Buscando usuário por refresh token`);
    const user = await this.usersRepository.findOneBy({ refresh_token: refreshToken });
    return user || null;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removendo usuário ID: ${id}`);
    const result = await this.usersRepository.delete(id);

    if (result.affected === 0) {
      this.logger.warn(`Tentativa de remoção falhou. Usuário não encontrado: ${id}`);
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.redisService.del(`user:${id}`);
    this.logger.log(`Usuário removido com sucesso: ${id}`);
  }
}
