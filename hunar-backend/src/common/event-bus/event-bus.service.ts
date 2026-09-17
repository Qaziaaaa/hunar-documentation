import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HunarDomainEvents, HunarEventName } from './events';

// Thin typed wrapper over NestJS EventEmitter2.
// Modules emit domain events here; the Notifications module (Hakim Ullah) subscribes to them.
@Injectable()
export class EventBusService {
  constructor(private readonly emitter: EventEmitter2) {}

  emit<K extends HunarEventName>(event: K, payload: HunarDomainEvents[K]): boolean {
    return this.emitter.emit(event, payload);
  }

  on<K extends HunarEventName>(
    event: K,
    handler: (payload: HunarDomainEvents[K]) => void | Promise<void>,
  ): void {
    this.emitter.on(event, handler);
  }
}
