import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Calendar } from './calendar.entity';

@Entity('success_promise')
export class SuccessPromise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  title: string;

  @ManyToOne(() => Calendar, (calendar) => calendar.successPromises)
  calendar: Calendar;
}
