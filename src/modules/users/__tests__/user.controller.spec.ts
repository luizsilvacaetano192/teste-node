import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../user.controller';
import { UsersService } from '../user.service';
import { User } from '../entities/user.entity';
import { UserResponseDto } from '../dto/user-response.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const userMock: User = {
    id: 'uuid-1234-5678',
    username: 'testuser',
    password: '123456',
    refresh_token: 'any_token',
  };

  const mockService = {
    create: jest.fn().mockResolvedValue(userMock),
    findAll: jest.fn().mockResolvedValue([userMock]),
    findById: jest.fn().mockResolvedValue(userMock),
    findByUsername: jest.fn().mockResolvedValue(userMock),
    update: jest.fn().mockResolvedValue(userMock),
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

  it('should create a user', async () => {
    const result = await controller.create({ username: 'testuser', password: '123456' });
    expect(result).toEqual(new UserResponseDto(userMock));
    expect(mockService.create).toHaveBeenCalledWith({ username: 'testuser', password: '123456' });
  });

  it('should return all users', async () => {
    const result = await controller.findAll();
    expect(result).toEqual([new UserResponseDto(userMock)]);
    expect(mockService.findAll).toHaveBeenCalled();
  });

  it('should return user by ID', async () => {
    const result = await controller.findOne('1');
    expect(result).toEqual(new UserResponseDto(userMock));
    expect(mockService.findById).toHaveBeenCalledWith(1);
  });

  it('should update a user', async () => {
    const result = await controller.update('1', { username: 'updated' });
    expect(result).toEqual(new UserResponseDto(userMock));
    expect(mockService.update).toHaveBeenCalledWith(1, { username: 'updated' });
  });

  it('should delete a user', async () => {
    await controller.remove('1');
    expect(mockService.remove).toHaveBeenCalledWith(1);
  });
});
