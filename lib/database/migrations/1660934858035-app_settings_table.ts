import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class appSettingsTable1660934858035 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'settings',
            columns: [
                { name: 'id', type: 'integer', isPrimary: true, generationStrategy: 'increment'},
                { name: 'organization_name', type: 'varchar', isNullable: false }
            ]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("settings");
    }

}
