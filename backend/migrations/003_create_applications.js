exports.up = function(knex) {
  return knex.schema.createTable('applications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('applicant_id').references('id').inTable('applicants').onDelete('CASCADE');
    table.string('destination_country').notNullable();
    table.date('intended_arrival_date').notNullable();
    table.date('intended_departure_date');
    table.string('intended_address').notNullable();
    table.string('intended_city').notNullable();
    table.string('purpose_of_visit').notNullable();
    table.json('travel_itinerary');
    table.enum('status', [
      'draft', 
      'submitted', 
      'payment_pending',
      'payment_completed',
      'in_progress', 
      'under_review',
      'additional_info_required',
      'clear', 
      'not_clear',
      'cancelled'
    ]).defaultTo('draft');
    table.decimal('fee_amount', 10, 2);
    table.string('currency', 3).defaultTo('USD');
    table.json('metadata').defaultTo('{}'); // Additional flexible data
    table.timestamp('submitted_at');
    table.timestamp('completed_at');
    table.timestamps(true, true);
    
    table.index(['applicant_id']);
    table.index(['destination_country']);
    table.index(['status']);
    table.index(['intended_arrival_date']);
    table.index(['submitted_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('applications');
};