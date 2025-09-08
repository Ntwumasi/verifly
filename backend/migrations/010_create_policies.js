exports.up = function(knex) {
  return knex.schema.createTable('policies', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('version').notNullable();
    table.text('description');
    table.json('rules').notNullable(); // Policy configuration and thresholds
    table.json('thresholds').notNullable(); // Risk score thresholds
    table.json('source_weights').defaultTo('{}'); // Weight for each data source
    table.boolean('is_active').defaultTo(false);
    table.string('destination_country');
    table.timestamp('effective_from').notNullable();
    table.timestamp('effective_until');
    table.uuid('created_by').references('id').inTable('users').onDelete('RESTRICT');
    table.timestamps(true, true);
    
    table.index(['is_active']);
    table.index(['destination_country']);
    table.index(['effective_from']);
    table.index(['version']);
    table.unique(['name', 'version']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('policies');
};