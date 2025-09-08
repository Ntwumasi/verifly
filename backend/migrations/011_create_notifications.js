exports.up = function(knex) {
  return knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('application_id').references('id').inTable('applications').onDelete('CASCADE');
    table.enum('type', [
      'application_submitted',
      'payment_received', 
      'verification_started',
      'verification_completed',
      'additional_info_required',
      'decision_made',
      'admin_note_added'
    ]).notNullable();
    table.enum('channel', ['email', 'sms', 'in_app']).notNullable();
    table.string('subject');
    table.text('message').notNullable();
    table.json('template_data').defaultTo('{}');
    table.enum('status', ['pending', 'sent', 'delivered', 'failed']).defaultTo('pending');
    table.timestamp('sent_at');
    table.timestamp('delivered_at');
    table.string('external_id'); // ID from email/SMS provider
    table.string('failure_reason');
    table.integer('retry_count').defaultTo(0);
    table.timestamps(true, true);
    
    table.index(['user_id']);
    table.index(['application_id']);
    table.index(['type']);
    table.index(['channel']);
    table.index(['status']);
    table.index(['sent_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notifications');
};