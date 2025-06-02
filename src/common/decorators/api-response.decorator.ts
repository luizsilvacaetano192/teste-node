import { SetMetadata } from '@nestjs/common';

export const ApiResponse = (options: { status: number; description: string }) => {
  return SetMetadata('apiResponse', options);
};
