exports.up = function(knex) {
  return knex.schema.createTable('payments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('application_id').references('id').inTable('applications').onDelete('CASCADE');
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 3).notNullable();
    table.enum('status', [
      'pending',
      'processing',
      'completed',
      'failed',
      'cancelled',
      'refunded',
      'partially_refunded'
    ]).defaultTo('pending');
    table.string('payment_method').notNullable(); // card, mobile_money, bank_transfer
    table.string('processor').notNullable(); // stripe, paystack, flutterwave
    table.string('processor_payment_id').unique();
    table.string('processor_customer_id');
    table.json('processor_metadata').defaultTo('{}');
    table.decimal('refunded_amount', 10, 2).defaultTo(0);
    table.string('failure_reason');
    table.string('receipt_url');
    table.timestamp('processed_at');
    table.timestamps(true, true);
    
    table.index(['application_id']);
    table.index(['status']);
    table.index(['processor_payment_id']);
    table.index(['processed_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payments');
};