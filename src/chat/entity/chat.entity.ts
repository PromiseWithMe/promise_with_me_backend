import { ROLE } from 'src/common/enum/role';
import { Promise } from 'src/promise/entity/promise.entity';
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('chat')
@Index(['promise'])
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Promise, (promise) => promise.chates, { nullable: false })
  promise: Promise;

  @Column({
    type: 'enum',
    enum: ROLE,
    nullable: false,
  })
  role: ROLE;

  @Column({
    type: 'text',
    nullable: false,
  })
  content: string;

  @Column({ nullable: false })
  createdAt: Date;
}
