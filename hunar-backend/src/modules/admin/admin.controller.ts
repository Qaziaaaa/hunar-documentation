import { Body, Controller, Get, Param, ParseUUIDPipe, Put, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import {
  AdminJobListQueryDto,
  AdminUserListQueryDto,
  AdminWorkerListQueryDto,
  SuspendUserDto,
} from './admin.validation';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.interface';

// Admin-only directory + moderation APIs (Admin flow §M2).
// Global JwtAuthGuard + RolesGuard enforce authentication and the ADMIN/SUPER_ADMIN role.
@Controller('admin')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ----- Customers -----

  @Get('customers')
  listCustomers(@Query() query: AdminUserListQueryDto) {
    return this.adminService.listCustomers(query);
  }

  @Get('customers/:id')
  getCustomer(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getCustomerDetail(id);
  }

  @Put('customers/:id/suspend')
  suspendCustomer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendUserDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.adminService.suspendCustomer(id, actor, dto.reason);
  }

  @Put('customers/:id/reactivate')
  reactivateCustomer(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtPayload) {
    return this.adminService.reactivateCustomer(id, actor);
  }

  // ----- Workers -----

  @Get('workers')
  listWorkers(@Query() query: AdminWorkerListQueryDto) {
    return this.adminService.listWorkers(query);
  }

  @Get('workers/:id')
  getWorker(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getWorkerDetail(id);
  }

  @Put('workers/:id/suspend')
  suspendWorker(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendUserDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.adminService.suspendWorker(id, actor, dto.reason);
  }

  @Put('workers/:id/reactivate')
  reactivateWorker(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtPayload) {
    return this.adminService.reactivateWorker(id, actor);
  }

  // ----- Jobs -----

  @Get('jobs')
  listJobs(@Query() query: AdminJobListQueryDto) {
    return this.adminService.listJobs(query);
  }
}
