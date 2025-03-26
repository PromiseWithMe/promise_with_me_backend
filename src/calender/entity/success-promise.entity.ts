import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Calender } from './calender.entity';

@Entity('success_promise')
export class SuccessPromise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  title: string;

  @ManyToOne(() => Calender, (calender) => calender.successPromises)
  calender: Calender;
}
