import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { OffersService } from './offers.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import {
  CounterOfferDto,
  CreateOfferDto,
  OfferListQueryDto,
  RespondOfferDto,
} from './offers.validation';

@Controller()
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post('jobs/:jobId/offers')
  @Roles(Role.WORKER)
  create(
    @CurrentUser() user: JwtPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: CreateOfferDto,
  ) {
    return this.offersService.createOffer(user.sub, jobId, dto);
  }

  @Get('jobs/:jobId/offers')
  getJobOffers(@CurrentUser() user: JwtPayload, @Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.offersService.getJobOffers(jobId, user);
  }

  @Get('offers/my')
  @Roles(Role.WORKER)
  getMyOffers(@CurrentUser() user: JwtPayload, @Query() query: OfferListQueryDto) {
    return this.offersService.getMyOffers(user.sub, query);
  }

  @Put('jobs/:jobId/offers/:offerId/accept')
  @Roles(Role.CUSTOMER)
  accept(
    @CurrentUser() user: JwtPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Body() dto: RespondOfferDto,
  ) {
    return this.offersService.acceptOffer(jobId, offerId, user, dto);
  }

  @Put('jobs/:jobId/offers/:offerId/reject')
  @Roles(Role.CUSTOMER)
  reject(
    @CurrentUser() user: JwtPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Param('offerId', ParseUUIDPipe) offerId: string,
  ) {
    return this.offersService.rejectOffer(jobId, offerId, user);
  }

  @Put('jobs/:jobId/offers/:offerId/counter')
  counter(
    @CurrentUser() user: JwtPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Body() dto: CounterOfferDto,
  ) {
    return this.offersService.counterOffer(jobId, offerId, user, dto);
  }

  @Put('offers/:offerId/withdraw')
  @Roles(Role.WORKER)
  withdraw(@CurrentUser() user: JwtPayload, @Param('offerId', ParseUUIDPipe) offerId: string) {
    return this.offersService.withdrawOffer(offerId, user);
  }
}
