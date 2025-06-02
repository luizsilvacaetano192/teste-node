import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller() 
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getMessage(): string {
    return this.appService.getHello();
  }

  @Get('hello')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('status')
  status() {
    return {
      status: 'online',
      timestamp: new Date().toISOString(),
      versao: '1.0.0'
    };
  }
}