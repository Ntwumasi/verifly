exports.up = function(knex) {
  return knex.schema.createTable('verification_runs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('application_id').references('id').inTable('applications').onDelete('CASCADE');
    table.enum('status', [
      'queued',
      'in_progress',
      'completed',
      'failed',
      'cancelled'
    ]).defaultTo('queued');
    table.enum('decision', [
      'clear',
      'review',
      'not_clear'
    ]);
    table.decimal('risk_score', 5, 2); // 0.00 to 100.00
    table.json('reason_codes').defaultTo('[]'); // Array of reason codes
    table.string('policy_version').notNullable();
    table.json('source_results').defaultTo('{}'); // Results from each data source
    table.json('scoring_breakdown').defaultTo('{}'); // How the score was calculated
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.timestamps(true, true);
    
    table.index(['application_id']);
    table.index(['status']);
    table.index(['decision']);
    table.index(['risk_score']);
    table.index(['started_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('verification_runs');
};