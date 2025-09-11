import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../database/database.entity';
import { Users } from '../../users/entities/users.entity';

@Entity('news')
export class News extends AbstractEntity<News> {
  @Column()
  name?: string;

  @Column('simple-json', { nullable: true })
  images?: string[];

  @Column({ type: 'longtext' })
  description?: string;

  @Column({ default: 0 })
  views?: number;

  @Column({ default: 0 })
  likes?: number;

  @Column({ length: 50, nullable: true })
  type?: string;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: 'author_id' })
  author?: Users;
}
