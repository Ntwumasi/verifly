const bcrypt = require('bcryptjs');

exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(function () {
      // Hash password for admin user
      const hashedPassword = bcrypt.hashSync('admin123!', 12);
      
      // Inserts seed entries
      return knex('users').insert([
        {
          id: knex.raw('gen_random_uuid()'),
          email: 'admin@verifly.com',
          password_hash: hashedPassword,
          role: 'admin',
          email_verified: true,
          phone_verified: false,
          is_active: true,
          preferences: JSON.stringify({}),
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: knex.raw('gen_random_uuid()'),
          email: 'reviewer@verifly.com',
          password_hash: hashedPassword,
          role: 'reviewer',
          email_verified: true,
          phone_verified: false,
          is_active: true,
          preferences: JSON.stringify({}),
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: knex.raw('gen_random_uuid()'),
          email: 'finance@verifly.com',
          password_hash: hashedPassword,
          role: 'finance',
          email_verified: true,
          phone_verified: false,
          is_active: true,
          preferences: JSON.stringify({}),
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: knex.raw('gen_random_uuid()'),
          email: 'test@example.com',
          password_hash: hashedPassword,
          role: 'applicant',
          email_verified: true,
          phone_verified: false,
          is_active: true,
          preferences: JSON.stringify({}),
          created_at: new Date(),
          updated_at: new Date(),
        }
      ]);
    });
};