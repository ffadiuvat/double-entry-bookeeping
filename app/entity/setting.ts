import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Setting {

  @PrimaryGeneratedColumn()
  id: string

  @Column()
  companyName: string
}