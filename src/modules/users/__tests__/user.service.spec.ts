import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../user.service';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const userMock: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    password: '123456',
    refresh_token: 'mocked-refresh-token',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should create a user', async () => {
    mockUserRepository.create.mockReturnValue(userMock);
    mockUserRepository.save.mockResolvedValue(userMock);

    const result = await service.create({ username: 'testuser', password: '123456' });

    expect(result).toEqual(userMock);
    expect(mockUserRepository.create).toHaveBeenCalledWith({ username: 'testuser', password: '123456' });
    expect(mockUserRepository.save).toHaveBeenCalledWith(userMock);
  });

  it('should return all users', async () => {
    mockUserRepository.find.mockResolvedValue([userMock]);

    const result = await service.findAll();

    expect(result).toEqual([userMock]);
    expect(mockUserRepository.find).toHaveBeenCalled();
  });

  it('should return user by ID', async () => {
    mockUserRepository.findOneBy.mockResolvedValue(userMock);

    const result = await service.findById(userMock.id);

    expect(result).toEqual(userMock);
    expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: userMock.id });
  });

  it('should return user by username', async () => {
    mockUserRepository.findOneBy.mockResolvedValue(userMock);

    const result = await service.findByUsername('testuser');

    expect(result).toEqual(userMock);
    expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ username: 'testuser' });
  });

  it('should update user and return updated user', async () => {
    mockUserRepository.update.mockResolvedValue({ affected: 1 });
    mockUserRepository.findOneBy.mockResolvedValue(userMock);

    const result = await service.update(userMock.id, { username: 'updated' });

    expect(mockUserRepository.update).toHaveBeenCalledWith(userMock.id, { username: 'updated' });
    expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: userMock.id });
    expect(result).toEqual(userMock);
  });

  it('should throw NotFoundException when updating non-existing user', async () => {
    mockUserRepository.update.mockResolvedValue({ affected: 0 });

    await expect(service.update('non-existing-id', { username: 'fail' })).rejects.toThrow(NotFoundException);
    expect(mockUserRepository.update).toHaveBeenCalledWith('non-existing-id', { username: 'fail' });
  });

  it('should delete user successfully', async () => {
    mockUserRepository.delete.mockResolvedValue({ affected: 1 });

    await expect(service.remove(userMock.id)).resolves.toBeUndefined();
    expect(mockUserRepository.delete).toHaveBeenCalledWith(userMock.id);
  });

  it('should throw NotFoundException when deleting non-existing user', async () => {
    mockUserRepository.delete.mockResolvedValue({ affected: 0 });

    await expect(service.remove('non-existing-id')).rejects.toThrow(NotFoundException);
    expect(mockUserRepository.delete).toHaveBeenCalledWith('non-existing-id');
  });
});
