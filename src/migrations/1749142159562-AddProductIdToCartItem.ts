import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductIdToCartItem1749142159562 implements MigrationInterface {
  name = 'AddProductIdToCartItem1749142159562';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`cart_item\` ADD \`product_id\` varchar(36) NULL`);
    await queryRunner.query(
      `ALTER TABLE \`cart_item\` ADD CONSTRAINT \`FK_cart_item_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`product\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`cart_item\` DROP FOREIGN KEY \`FK_cart_item_product\``);
    await queryRunner.query(`ALTER TABLE \`cart_item\` DROP COLUMN \`product_id\``);
  }
}
