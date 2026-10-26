import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { LocationService } from './location.service';

@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Public()
  @Get('cities')
  getCities() {
    return this.locationService.getActiveCities();
  }

  @Public()
  @Get('areas')
  getAreas(@Query('city') city?: string) {
    return this.locationService.getActiveAreas(city);
  }
}
