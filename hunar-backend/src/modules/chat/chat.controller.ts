import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { ChatService } from './chat.service';
import { MessageListQueryDto, SendMessageDto } from './chat.validation';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @Roles(Role.WORKER, Role.CUSTOMER)
  listConversations(@CurrentUser() user: JwtPayload) {
    return this.chatService.listConversations(user.sub);
  }

  @Get(':conversationId/messages')
  @Roles(Role.WORKER, Role.CUSTOMER)
  getMessages(
    @CurrentUser() user: JwtPayload,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query() query: MessageListQueryDto,
  ) {
    return this.chatService.getMessages(conversationId, user.sub, query);
  }

  @Post(':conversationId/messages')
  @Roles(Role.WORKER, Role.CUSTOMER)
  sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(conversationId, user.sub, dto);
  }
}
