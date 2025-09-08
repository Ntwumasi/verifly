exports.up = function(knex) {
  return knex.schema.createTable('source_hits', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('verification_run_id').references('id').inTable('verification_runs').onDelete('CASCADE');
    table.string('source_name').notNullable(); // sanctions, pep, sex_offender, etc.
    table.string('source_type').notNullable(); // watchlist, registry, news, etc.
    table.json('query_terms').notNullable(); // What was searched
    table.decimal('match_confidence', 5, 2).notNullable(); // 0.00 to 100.00
    table.string('match_type').notNullable(); // exact, fuzzy, phonetic
    table.json('record_data').notNullable(); // Matched record details (redacted)
    table.string('record_url'); // Link to source if available
    table.string('jurisdiction'); // Country/region of the source
    table.enum('severity', ['low', 'medium', 'high', 'critical']).notNullable();
    table.date('record_date'); // When the original record was created
    table.json('metadata').defaultTo('{}'); // Additional source-specific data
    table.timestamps(true, true);
    
    table.index(['verification_run_id']);
    table.index(['source_name']);
    table.index(['match_confidence']);
    table.index(['severity']);
    table.index(['record_date']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('source_hits');
};