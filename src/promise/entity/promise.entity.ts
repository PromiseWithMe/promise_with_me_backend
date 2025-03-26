import { Chat } from 'src/chat/entity/chat.entity';
import { dayOfWeeks } from 'src/common/set/day-of-weeks';
import { PromiseState } from 'src/common/enum/promise-state';
import { User } from 'src/user/entity/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('promise')
export class Promise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  title: string;

  @Column({ type: 'set', enum: dayOfWeeks, nullable: false })
  dayOfWeek: string;

  @Column({
    type: 'enum',
    enum: PromiseState,
    default: PromiseState.NotCompleted,
  })
  promiseState: PromiseState;

  @ManyToOne(() => User, (user) => user.promises)
  user: User;

  @OneToMany(() => Chat, (chat) => chat.promise)
  chates: Chat;

  @Column({ nullable: false })
  createdAt: Date;
}
