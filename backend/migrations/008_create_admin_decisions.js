exports.up = function(knex) {
  return knex.schema.createTable('admin_decisions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('application_id').references('id').inTable('applications').onDelete('CASCADE');
    table.uuid('admin_user_id').references('id').inTable('users').onDelete('RESTRICT');
    table.enum('decision', ['approve', 'deny', 'request_more_info']).notNullable();
    table.text('notes').notNullable();
    table.json('reason_codes').defaultTo('[]');
    table.enum('override_type', ['manual_review', 'policy_override', 'appeal_decision']);
    table.json('additional_requirements').defaultTo('[]'); // What extra info is needed
    table.timestamp('decision_date').notNullable();
    table.timestamps(true, true);
    
    table.index(['application_id']);
    table.index(['admin_user_id']);
    table.index(['decision']);
    table.index(['decision_date']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('admin_decisions');
};