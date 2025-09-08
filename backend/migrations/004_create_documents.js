exports.up = function(knex) {
  return knex.schema.createTable('documents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('application_id').references('id').inTable('applications').onDelete('CASCADE');
    table.enum('type', [
      'passport',
      'selfie',
      'itinerary',
      'supporting_document',
      'additional_id',
      'address_proof'
    ]).notNullable();
    table.string('original_filename').notNullable();
    table.string('storage_path').notNullable();
    table.string('storage_bucket');
    table.string('mime_type').notNullable();
    table.integer('file_size').notNullable();
    table.string('file_hash').notNullable(); // SHA-256 hash for integrity
    table.json('verification_results').defaultTo('{}'); // OCR, face match, etc.
    table.boolean('is_verified').defaultTo(false);
    table.json('metadata').defaultTo('{}'); // EXIF data, extraction results
    table.timestamp('verified_at');
    table.timestamps(true, true);
    
    table.index(['application_id']);
    table.index(['type']);
    table.index(['file_hash']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('documents');
};