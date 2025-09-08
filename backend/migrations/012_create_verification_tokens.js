exports.up = function(knex) {
  return knex.schema.createTable('verification_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('application_id').references('id').inTable('applications').onDelete('CASCADE');
    table.string('token_hash').unique().notNullable(); // Hashed version of the actual token
    table.string('qr_code_url'); // URL to QR code image
    table.json('validation_data').defaultTo('{}'); // Data that can be validated
    table.boolean('is_active').defaultTo(true);
    table.timestamp('expires_at').notNullable();
    table.integer('validation_count').defaultTo(0);
    table.timestamp('last_validated_at');
    table.string('last_validated_by'); // Entity that validated (airline, immigration)
    table.timestamps(true, true);
    
    table.index(['application_id']);
    table.index(['token_hash']);
    table.index(['is_active']);
    table.index(['expires_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('verification_tokens');
};