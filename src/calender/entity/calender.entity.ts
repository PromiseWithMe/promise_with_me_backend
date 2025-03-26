import { User } from 'src/user/entity/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SuccessPromise } from './success-promise.entity';

@Entity('calender')
export class Calender {
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

  @ManyToOne(() => User, (user) => user.calenders)
  user: User;

  @OneToMany(() => SuccessPromise, (successPromise) => successPromise.calender)
  successPromises: SuccessPromise[];
}
