import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import {
  AdminCommissionListQueryDto,
  AdminJobListQueryDto,
  AdminPaymentListQueryDto,
  AdminTransactionListQueryDto,
  AdminUserListQueryDto,
  AdminWorkerListQueryDto,
  AdminWithdrawalListQueryDto,
  AdminProcessWithdrawalDto,
  AdminFreezeWalletDto,
  AdminDisputeListQueryDto,
  AdminResolveDisputeDto,
  AdminDisputeNoteDto,
  AdminCategoryListQueryDto,
  AdminCreateCategoryDto,
  AdminUpdateCategoryDto,
  AdminUpdateCommissionRateDto,
  AdminUpdateSettingsDto,
  AdminReportQueryDto,
  AdminAuditListQueryDto,
  AdminNotificationListQueryDto,
  AdminMarkNotificationsReadDto,
  ForceCancelJobDto,
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

  @Get('jobs/:id')
  getJob(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getJobDetail(id);
  }

  @Put('jobs/:id/cancel')
  forceCancelJob(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ForceCancelJobDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.adminService.forceCancelJob(id, actor, dto.reason);
  }

  // ----- Wallet / transactions -----

  @Get('transactions')
  listTransactions(@Query() query: AdminTransactionListQueryDto) {
    return this.adminService.listTransactions(query);
  }

  @Get('payments')
  listPayments(@Query() query: AdminPaymentListQueryDto) {
    return this.adminService.listPayments(query);
  }

  @Get('commission')
  getCommissionSnapshot(@Query() query: AdminCommissionListQueryDto) {
    return this.adminService.getCommissionSnapshot(query);
  }

  // ----- Withdrawal queue -----

  @Get('withdrawals')
  listWithdrawals(@Query() query: AdminWithdrawalListQueryDto) {
    return this.adminService.listWithdrawals(query);
  }

  @Put('withdrawals/:id/process')
  processWithdrawal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminProcessWithdrawalDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.adminService.processWithdrawal(id, actor, dto.action, dto.note);
  }

  // ----- Wallet freeze -----

  @Put('wallet/:workerId/freeze')
  freezeWallet(
    @Param('workerId', ParseUUIDPipe) workerId: string,
    @Body() dto: AdminFreezeWalletDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.adminService.freezeWallet(workerId, actor, dto);
  }

  @Put('wallet/:workerId/unfreeze')
  unfreezeWallet(
    @Param('workerId', ParseUUIDPipe) workerId: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.adminService.unfreezeWallet(workerId, actor);
  }

  // ----- Disputes -----

  @Get('disputes')
  listDisputes(@Query() query: AdminDisputeListQueryDto) {
    return this.adminService.listDisputes(query);
  }

  @Get('disputes/:id')
  getDisputeDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getDisputeDetail(id);
  }

  @Put('disputes/:id/resolve')
  resolveDispute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminResolveDisputeDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.adminService.resolveDispute(id, actor, dto);
  }

  @Put('disputes/:id/dismiss')
  dismissDispute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminDisputeNoteDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.adminService.resolveDispute(id, actor, { ...dto, action: 'dismiss' });
  }

  @Put('disputes/:id/escalate')
  escalateDispute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminDisputeNoteDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.adminService.resolveDispute(id, actor, { ...dto, action: 'escalate' });
  }

  // ----- Categories -----

  @Get('categories')
  listCategories(@Query() query: AdminCategoryListQueryDto) {
    return this.adminService.listCategories(query);
  }

  @Post('categories')
  createCategory(
    @Body() dto: AdminCreateCategoryDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.adminService.createCategory(dto, actor);
  }

  @Put('categories/:id')
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateCategoryDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.adminService.updateCategory(id, dto, actor);
  }

  @Put('categories/:id/deactivate')
  deactivateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.adminService.deactivateCategory(id, actor);
  }

  // ----- Platform Settings -----

  @Get('settings')
  getSettings() {
    return this.adminService.getSettings();
  }

  @Put('settings/commission')
  updateCommissionRate(
    @Body() dto: AdminUpdateCommissionRateDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.adminService.updateCommissionRate(dto, actor);
  }

  @Put('settings')
  updateSettings(
    @Body() dto: AdminUpdateSettingsDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.adminService.updateSettings(dto, actor);
  }

  // ----- Reports -----

  @Get('reports/:type')
  getReport(@Param('type') type: string, @Query() query: Omit<AdminReportQueryDto, 'type'>) {
    return this.adminService.getReport({ ...query, type: type as any });
  }

  @Get('reports/:type/export')
  exportReport(
    @Param('type') type: string,
    @Query() query: Omit<AdminReportQueryDto, 'type'>,
    @Res() res: Response,
  ) {
    return this.adminService.exportReport({ ...query, type: type as any }, res);
  }

  // ----- Audit Trail -----

  @Get('audit')
  listAuditLogs(@Query() query: AdminAuditListQueryDto) {
    return this.adminService.listAuditLogs(query);
  }

  // ----- Admin Notifications -----

  @Get('notifications')
  listNotifications(@Query() query: AdminNotificationListQueryDto) {
    return this.adminService.listNotifications(query);
  }

  @Put('notifications/read')
  markNotificationsRead(
    @Body() dto: AdminMarkNotificationsReadDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.adminService.markNotificationsRead(dto, actor);
  }
}
