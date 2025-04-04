import { User } from 'src/user/entity/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SuccessPromise } from './success-promise.entity';

@Entity('calendar')
export class Calendar {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    nullable: false,
  })
  date: Date;

  @Column({
    type: 'text',
    nullable: true,
  })
  diary: string;

  @ManyToOne(() => User, (user) => user.calendars)
  user: User;

  @OneToMany(() => SuccessPromise, (successPromise) => successPromise.calendar)
  successPromises: SuccessPromise[];
}
