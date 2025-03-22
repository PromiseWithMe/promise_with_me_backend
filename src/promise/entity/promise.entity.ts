import { PromiseState } from 'src/common/enum/promise-state';
import { User } from 'src/user/entity/user.entity';
import { AfterLoad, Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('promise')
export class Promise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  title: string;

  @Column({ comment: 'Number Array를 String으로 저장', nullable: true })
  dayOfWeek: string;

  @Column({
    type: 'enum',
    enum: PromiseState,
    default: PromiseState.NotCompleted,
  })
  promiseState: PromiseState;

  @ManyToOne(() => User, (user) => user.promises)
  user: User;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;
}
