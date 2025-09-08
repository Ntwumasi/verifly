exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('policies').del()
    .then(function () {
      // Inserts seed entries
      return knex('policies').insert([
        {
          id: knex.raw('gen_random_uuid()'),
          name: 'Default Global Policy',
          version: '1.0.0',
          description: 'Default verification policy for all applications',
          rules: JSON.stringify({
            sanctions: {
              enabled: true,
              weight: 70,
              auto_deny_threshold: 90,
            },
            pep: {
              enabled: true,
              weight: 40,
              auto_deny_threshold: 85,
            },
            documents: {
              enabled: true,
              weight: 25,
              required_types: ['passport', 'selfie'],
              min_confidence: 70,
            },
            face_match: {
              enabled: true,
              threshold: 0.7,
              required: true,
            }
          }),
          thresholds: JSON.stringify({
            clear: { max: 29 },
            review: { min: 30, max: 59 },
            not_clear: { min: 60 }
          }),
          source_weights: JSON.stringify({
            sanctions: 0.5,
            pep: 0.3,
            documents: 0.2,
          }),
          is_active: true,
          destination_country: null, // Global policy
          effective_from: new Date('2024-01-01'),
          effective_until: null,
          created_by: knex.raw('gen_random_uuid()'), // Will be replaced with actual admin user ID
          created_at: new Date(),
          updated_at: new Date(),
        }
      ]);
    });
};