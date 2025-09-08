exports.up = function(knex) {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('phone').unique();
    table.string('password_hash');
    table.enum('role', ['applicant', 'admin', 'reviewer', 'finance', 'support', 'auditor']).defaultTo('applicant');
    table.boolean('email_verified').defaultTo(false);
    table.boolean('phone_verified').defaultTo(false);
    table.timestamp('email_verified_at');
    table.timestamp('phone_verified_at');
    table.boolean('is_active').defaultTo(true);
    table.json('preferences').defaultTo('{}');
    table.timestamps(true, true);
    
    table.index(['email']);
    table.index(['phone']);
    table.index(['role']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};