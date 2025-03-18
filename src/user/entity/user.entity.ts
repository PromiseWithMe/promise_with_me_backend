import { ROLE } from 'src/common/enum/role';
import { Promise } from 'src/promise/entity/promise.entity';
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn } from 'typeorm';

@Entity('user')
export class User {
  @PrimaryColumn('varchar', {
    length: 80,
  })
  email: string;

  @Column({
    nullable: false,
  })
  password: string;

  @Column({
    length: 30,
    nullable: false,
  })
  nickname: string;

  @Column('enum', {
    enum: ROLE,
    enumName: 'role',
    nullable: false,
    default: 0,
  })
  role: ROLE;

  @Column({
    default: true,
    nullable: false,
  })
  avaliable: boolean;

  @Column({
    default: null,
  })
  withdrawDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Promise, (promise) => promise.user)
  promises: Promise[]
}
