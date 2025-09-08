exports.up = function(knex) {
  return knex.schema.createTable('applicants', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('first_name').notNullable();
    table.string('middle_name');
    table.string('last_name').notNullable();
    table.date('date_of_birth').notNullable();
    table.string('nationality').notNullable();
    table.string('passport_number').notNullable();
    table.string('passport_country').notNullable();
    table.date('passport_expiry');
    table.json('address_history').notNullable(); // Array of address objects with dates
    table.string('current_address').notNullable();
    table.string('current_city').notNullable();
    table.string('current_country').notNullable();
    table.string('current_postal_code');
    table.json('consent_records').notNullable(); // Versioned consent with timestamps
    table.timestamps(true, true);
    
    table.index(['passport_number', 'passport_country']);
    table.index(['nationality']);
    table.index(['user_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('applicants');
};