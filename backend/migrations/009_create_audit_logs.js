exports.up = function(knex) {
  return knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('action').notNullable(); // login, create_application, view_case, etc.
    table.string('entity_type'); // application, user, payment, etc.
    table.uuid('entity_id');
    table.string('ip_address').notNullable();
    table.string('user_agent');
    table.json('details').defaultTo('{}'); // Additional context about the action
    table.json('previous_values').defaultTo('{}'); // For update operations
    table.json('new_values').defaultTo('{}'); // For update operations
    table.enum('result', ['success', 'failure', 'error']).notNullable();
    table.string('error_message');
    table.timestamp('timestamp').notNullable();
    
    table.index(['user_id']);
    table.index(['action']);
    table.index(['entity_type', 'entity_id']);
    table.index(['timestamp']);
    table.index(['ip_address']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('audit_logs');
};