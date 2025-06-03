import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('por-estado')
  @ApiOperation({
    summary: 'Distribuição por estado',
    description: 'Retorna a quantidade de fazendas agrupadas por estado',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista com a quantidade de fazendas por estado',
    schema: {
      example: [
        { state: 'SP', total: 10 },
        { state: 'MT', total: 15 },
      ],
    },
  })
  getFarmsByState() {
    return this.dashboardService.getByState();
  }

  @Get('por-cultura')
  @ApiOperation({
    summary: 'Distribuição por cultura',
    description: 'Retorna a quantidade de fazendas ou áreas agrupadas por tipo de cultura',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista com a quantidade de culturas por tipo',
    schema: {
      example: [
        { culture: 'Soja', total: 20 },
        { culture: 'Milho', total: 12 },
      ],
    },
  })
  getFarmsByCulture() {
    return this.dashboardService.getByCulture();
  }

  @Get('uso-solo')
  @ApiOperation({
    summary: 'Distribuição por uso do solo',
    description: 'Retorna a distribuição da área por tipo de uso do solo (ex: lavoura, pastagem, reserva legal)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista com os tipos de uso do solo e suas respectivas áreas',
    schema: {
      example: [
        { landUse: 'Lavoura', area: 3500 },
        { landUse: 'Pastagem', area: 1200 },
        { landUse: 'Reserva Legal', area: 800 },
      ],
    },
  })
  getLandUse() {
    return this.dashboardService.getByLandUse();
  }
}
