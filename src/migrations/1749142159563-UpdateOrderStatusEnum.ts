import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOrderStatusEnum1749142159563 implements MigrationInterface {
  name = 'UpdateOrderStatusEnum1749142159563';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tạo enum mới
    await queryRunner.query(`
      CREATE TYPE "order_status_enum" AS ENUM('pending', 'confirmed', 'delivered', 'success', 'cancelled')
    `);

    // Cập nhật cột status để sử dụng enum mới
    await queryRunner.query(`
      ALTER TABLE "order" 
      ALTER COLUMN "status" TYPE "order_status_enum" 
      USING "status"::"order_status_enum"
    `);

    // Set default value
    await queryRunner.query(`
      ALTER TABLE "order" 
      ALTER COLUMN "status" SET DEFAULT 'pending'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert về string type
    await queryRunner.query(`
      ALTER TABLE "order" 
      ALTER COLUMN "status" TYPE VARCHAR
    `);

    // Xóa enum
    await queryRunner.query(`DROP TYPE "order_status_enum"`);
  }
}
