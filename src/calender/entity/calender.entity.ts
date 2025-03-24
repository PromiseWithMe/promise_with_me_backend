import { User } from 'src/user/entity/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

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
}
