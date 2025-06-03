import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../user.controller';
import { UsersService } from '../user.service';
import { User } from '../entities/user.entity';
import { UserResponseDto } from '../dto/user-response.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    password: 'hashedpassword',
    refresh_token: 'refreshtoken123'
  };

  const mockService = {
    create: jest.fn().mockResolvedValue(mockUser),
    findAll: jest.fn().mockResolvedValue([mockUser]),
    findById: jest.fn().mockResolvedValue(mockUser),
    findByUsername: jest.fn().mockResolvedValue(mockUser),
    update: jest.fn().mockResolvedValue(mockUser),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createDto: CreateUserDto = {
        username: 'testuser',
        password: 'password123'
      };

      const result = await controller.create(createDto);
      
      expect(result).toEqual(new UserResponseDto(mockUser));
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const result = await controller.findAll();
      
      expect(result).toEqual([new UserResponseDto(mockUser)]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const result = await controller.findOne(userId);
      
      expect(result).toEqual(new UserResponseDto(mockUser));
      expect(service.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(service, 'findById').mockResolvedValueOnce(null);
      
      const userId = 'non-existing-id';
      await expect(controller.findOne(userId)).rejects.toThrow(NotFoundException);
      expect(service.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateDto: UpdateUserDto = {
        username: 'updateduser'
      };

      const result = await controller.update(userId, updateDto);
      
      expect(result).toEqual(new UserResponseDto(mockUser));
      expect(service.update).toHaveBeenCalledWith(userId, updateDto);
    });

    it('should throw NotFoundException when updating non-existing user', async () => {
      jest.spyOn(service, 'update').mockRejectedValueOnce(new NotFoundException());
      
      const userId = 'non-existing-id';
      const updateDto: UpdateUserDto = {
        username: 'updateduser'
      };

      await expect(controller.update(userId, updateDto)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(userId, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      await controller.remove(userId);
      
      expect(service.remove).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException when deleting non-existing user', async () => {
      jest.spyOn(service, 'remove').mockRejectedValueOnce(new NotFoundException());
      
      const userId = 'non-existing-id';
      await expect(controller.remove(userId)).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledWith(userId);
    });
  });
});