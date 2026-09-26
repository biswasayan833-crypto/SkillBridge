const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const {
  registerValidation,
  loginValidation,
  updatePasswordValidation,
} = require('../../src/utils/validationSchemas');

const {
  createOpportunityValidation,
  updateOpportunityValidation,
} = require('../../src/utils/opportunityValidation');

const {
  createApplicationValidation,
  updateStatusValidation,
  ALLOWED_STATUSES,
} = require('../../src/utils/applicationValidation');

const { updateProfileValidation } = require('../../src/utils/userValidation');

/**
 * Helper to run express-validator middleware chains against a mock request object.
 */
const runValidation = async (validations, req) => {
  for (const validation of validations) {
    await validation.run(req);
  }
  return validationResult(req);
};

describe('Backend Unit Tests — Input Validation Schemas', () => {
  // ==========================================
  // 1. REGISTRATION VALIDATION
  // ==========================================
  describe('Registration Validation (registerValidation)', () => {
    it('should pass with valid student data', async () => {
      const req = {
        body: {
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          password: 'Password123!',
          role: 'student',
        },
      };

      const result = await runValidation(registerValidation, req);
      expect(result.isEmpty()).toBe(true);
    });

    it('should pass with valid recruiter data', async () => {
      const req = {
        body: {
          name: 'Recruiter Bob',
          email: 'bob@company.com',
          password: 'Password123!',
          role: 'recruiter',
        },
      };

      const result = await runValidation(registerValidation, req);
      expect(result.isEmpty()).toBe(true);
    });

    it('should reject missing name or name shorter than 2 characters', async () => {
      const reqEmpty = {
        body: {
          name: '   ',
          email: 'jane@example.com',
          password: 'Password123!',
          role: 'student',
        },
      };
      const resEmpty = await runValidation(registerValidation, reqEmpty);
      expect(resEmpty.isEmpty()).toBe(false);
      expect(resEmpty.array().some((e) => e.path === 'name')).toBe(true);

      const reqShort = {
        body: {
          name: 'A',
          email: 'jane@example.com',
          password: 'Password123!',
          role: 'student',
        },
      };
      const resShort = await runValidation(registerValidation, reqShort);
      expect(resShort.isEmpty()).toBe(false);
      expect(resShort.array().some((e) => e.msg.includes('between 2 and 60'))).toBe(true);
    });

    it('should reject name exceeding 60 characters', async () => {
      const reqLong = {
        body: {
          name: 'A'.repeat(61),
          email: 'jane@example.com',
          password: 'Password123!',
          role: 'student',
        },
      };
      const result = await runValidation(registerValidation, reqLong);
      expect(result.isEmpty()).toBe(false);
      expect(result.array().some((e) => e.path === 'name')).toBe(true);
    });

    it('should reject invalid or missing email format', async () => {
      const reqInvalidEmail = {
        body: {
          name: 'Valid Name',
          email: 'not-an-email',
          password: 'Password123!',
          role: 'student',
        },
      };
      const result = await runValidation(registerValidation, reqInvalidEmail);
      expect(result.isEmpty()).toBe(false);
      expect(result.array().some((e) => e.path === 'email')).toBe(true);
    });

    it('should reject password with fewer than 6 characters', async () => {
      const reqShortPass = {
        body: {
          name: 'Valid Name',
          email: 'valid@example.com',
          password: '12345',
          role: 'student',
        },
      };
      const result = await runValidation(registerValidation, reqShortPass);
      expect(result.isEmpty()).toBe(false);
      expect(result.array().some((e) => e.path === 'password')).toBe(true);
    });

    it('should reject self-registering as admin or any role other than student/recruiter', async () => {
      const reqAdmin = {
        body: {
          name: 'Malicious Admin',
          email: 'admin@example.com',
          password: 'Password123!',
          role: 'admin',
        },
      };
      const result = await runValidation(registerValidation, reqAdmin);
      expect(result.isEmpty()).toBe(false);
      expect(result.array().some((e) => e.path === 'role')).toBe(true);
    });
  });

  // ==========================================
  // 2. LOGIN VALIDATION
  // ==========================================
  describe('Login Validation (loginValidation)', () => {
    it('should pass with valid email and password', async () => {
      const req = {
        body: {
          email: 'user@example.com',
          password: 'Password123!',
        },
      };

      const result = await runValidation(loginValidation, req);
      expect(result.isEmpty()).toBe(true);
    });

    it('should reject missing email or invalid email format', async () => {
      const reqMissing = { body: { password: 'Password123!' } };
      const resMissing = await runValidation(loginValidation, reqMissing);
      expect(resMissing.isEmpty()).toBe(false);
      expect(resMissing.array().some((e) => e.path === 'email')).toBe(true);

      const reqInvalid = { body: { email: 'invalid-email', password: 'Password123!' } };
      const resInvalid = await runValidation(loginValidation, reqInvalid);
      expect(resInvalid.isEmpty()).toBe(false);
      expect(resInvalid.array().some((e) => e.path === 'email')).toBe(true);
    });

    it('should reject missing password', async () => {
      const req = { body: { email: 'user@example.com' } };
      const result = await runValidation(loginValidation, req);
      expect(result.isEmpty()).toBe(false);
      expect(result.array().some((e) => e.path === 'password')).toBe(true);
    });
  });

  // ==========================================
  // 3. PASSWORD UPDATE VALIDATION
  // ==========================================
  describe('Password Update Validation (updatePasswordValidation)', () => {
    it('should pass with valid currentPassword and different newPassword', async () => {
      const req = {
        body: {
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword456!',
        },
      };

      const result = await runValidation(updatePasswordValidation, req);
      expect(result.isEmpty()).toBe(true);
    });

    it('should reject missing currentPassword', async () => {
      const req = {
        body: {
          newPassword: 'NewPassword456!',
        },
      };

      const result = await runValidation(updatePasswordValidation, req);
      expect(result.isEmpty()).toBe(false);
      expect(result.array().some((e) => e.path === 'currentPassword')).toBe(true);
    });

    it('should reject newPassword shorter than 6 characters', async () => {
      const req = {
        body: {
          currentPassword: 'OldPassword123!',
          newPassword: '12345',
        },
      };

      const result = await runValidation(updatePasswordValidation, req);
      expect(result.isEmpty()).toBe(false);
      expect(result.array().some((e) => e.path === 'newPassword')).toBe(true);
    });

    it('should reject newPassword if identical to currentPassword', async () => {
      const req = {
        body: {
          currentPassword: 'SamePassword123!',
          newPassword: 'SamePassword123!',
        },
      };

      const result = await runValidation(updatePasswordValidation, req);
      expect(result.isEmpty()).toBe(false);
      expect(
        result.array().some((e) => e.msg.includes('different from current password'))
      ).toBe(true);
    });
  });

  // ==========================================
  // 4. OPPORTUNITY CREATION VALIDATION
  // ==========================================
  describe('Opportunity Creation Validation (createOpportunityValidation)', () => {
    it('should pass with complete valid opportunity payload', async () => {
      const req = {
        body: {
          title: 'Full Stack Developer Intern',
          company: 'Acme Corp',
          description: 'Build modern responsive web applications using MERN stack.',
          type: 'internship',
          workMode: 'remote',
          location: 'San Francisco, CA',
          skills: 'react, node.js, mongodb',
          stipend: '$2500/month',
          applicationDeadline: '2026-12-31',
        },
      };

      const result = await runValidation(createOpportunityValidation, req);
      expect(result.isEmpty()).toBe(true);
      expect(Array.isArray(req.body.skills)).toBe(true);
      expect(req.body.skills).toContain('react');
    });

    it('should reject missing title or title out of length boundaries (3-100 chars)', async () => {
      const reqEmpty = {
        body: {
          title: '  ',
          company: 'Acme Corp',
          description: 'Valid description',
          type: 'full-time',
          workMode: 'onsite',
          location: 'New York, NY',
        },
      };
      const resEmpty = await runValidation(createOpportunityValidation, reqEmpty);
      expect(resEmpty.isEmpty()).toBe(false);
      expect(resEmpty.array().some((e) => e.path === 'title')).toBe(true);

      const reqShort = {
        body: {
          title: 'AB',
          company: 'Acme Corp',
          description: 'Valid description',
          type: 'full-time',
          workMode: 'onsite',
          location: 'New York, NY',
        },
      };
      const resShort = await runValidation(createOpportunityValidation, reqShort);
      expect(resShort.isEmpty()).toBe(false);
      expect(resShort.array().some((e) => e.path === 'title')).toBe(true);
    });

    it('should reject invalid opportunity type or workMode', async () => {
      const req = {
        body: {
          title: 'Frontend Developer',
          company: 'Acme Corp',
          description: 'Valid description',
          type: 'freelance-unsupported',
          workMode: 'virtual-unsupported',
          location: 'Remote',
        },
      };

      const result = await runValidation(createOpportunityValidation, req);
      expect(result.isEmpty()).toBe(false);
      expect(result.array().some((e) => e.path === 'type')).toBe(true);
      expect(result.array().some((e) => e.path === 'workMode')).toBe(true);
    });

    it('should reject invalid application deadline format', async () => {
      const req = {
        body: {
          title: 'Software Engineer',
          company: 'Acme Corp',
          description: 'Valid description',
          type: 'internship',
          workMode: 'remote',
          location: 'Remote',
          applicationDeadline: '31st December 2026', // Not ISO8601
        },
      };

      const result = await runValidation(createOpportunityValidation, req);
      expect(result.isEmpty()).toBe(false);
      expect(result.array().some((e) => e.path === 'applicationDeadline')).toBe(true);
    });
  });

  // ==========================================
  // 5. OPPORTUNITY UPDATE VALIDATION
  // ==========================================
  describe('Opportunity Update Validation (updateOpportunityValidation)', () => {
    it('should pass with valid partial update fields', async () => {
      const req = {
        body: {
          title: 'Senior Full Stack Developer',
          workMode: 'hybrid',
          isActive: false,
        },
      };

      const result = await runValidation(updateOpportunityValidation, req);
      expect(result.isEmpty()).toBe(true);
    });

    it('should reject empty title or company when provided', async () => {
      const req = {
        body: {
          title: '   ',
        },
      };

      const result = await runValidation(updateOpportunityValidation, req);
      expect(result.isEmpty()).toBe(false);
      expect(result.array().some((e) => e.path === 'title')).toBe(true);
    });

    it('should reject non-boolean isActive', async () => {
      const req = {
        body: {
          isActive: 'not-a-boolean',
        },
      };

      const result = await runValidation(updateOpportunityValidation, req);
      expect(result.isEmpty()).toBe(false);
      expect(result.array().some((e) => e.path === 'isActive')).toBe(true);
    });
  });

  // ==========================================
  // 6. APPLICATION CREATION VALIDATION
  // ==========================================
  describe('Application Creation Validation (createApplicationValidation)', () => {
    it('should pass with valid MongoDB ObjectId for opportunity', async () => {
      const req = {
        body: {
          opportunity: new mongoose.Types.ObjectId().toString(),
          coverLetter: 'I am excited about this software internship opportunity.',
        },
      };

      const result = await runValidation(createApplicationValidation, req);
      expect(result.isEmpty()).toBe(true);
    });

    it('should reject missing or non-MongoId opportunity', async () => {
      const reqMissing = { body: {} };
      const resMissing = await runValidation(createApplicationValidation, reqMissing);
      expect(resMissing.isEmpty()).toBe(false);
      expect(resMissing.array().some((e) => e.path === 'opportunity')).toBe(true);

      const reqInvalidId = { body: { opportunity: '12345-invalid-id' } };
      const resInvalid = await runValidation(createApplicationValidation, reqInvalidId);
      expect(resInvalid.isEmpty()).toBe(false);
      expect(resInvalid.array().some((e) => e.path === 'opportunity')).toBe(true);
    });

    it('should reject cover letter exceeding 2000 characters', async () => {
      const req = {
        body: {
          opportunity: new mongoose.Types.ObjectId().toString(),
          coverLetter: 'X'.repeat(2001),
        },
      };

      const result = await runValidation(createApplicationValidation, req);
      expect(result.isEmpty()).toBe(false);
      expect(result.array().some((e) => e.path === 'coverLetter')).toBe(true);
    });
  });

  // ==========================================
  // 7. APPLICATION STATUS UPDATE VALIDATION
  // ==========================================
  describe('Application Status Update Validation (updateStatusValidation)', () => {
    it('should accept all 6 valid workflow statuses', async () => {
      for (const status of ALLOWED_STATUSES) {
        const req = { body: { status } };
        const result = await runValidation(updateStatusValidation, req);
        expect(result.isEmpty()).toBe(true);
      }
    });

    it('should reject invalid or unsupported status strings', async () => {
      const unsupportedStatuses = ['Pending', 'Accepted', 'Approved', 'Cancelled', 'In Progress'];
      for (const status of unsupportedStatuses) {
        const req = { body: { status } };
        const result = await runValidation(updateStatusValidation, req);
        expect(result.isEmpty()).toBe(false);
        expect(result.array().some((e) => e.path === 'status')).toBe(true);
      }
    });

    it('should reject missing status', async () => {
      const req = { body: {} };
      const result = await runValidation(updateStatusValidation, req);
      expect(result.isEmpty()).toBe(false);
      expect(result.array().some((e) => e.path === 'status')).toBe(true);
    });
  });

  // ==========================================
  // 8. USER PROFILE UPDATE VALIDATION
  // ==========================================
  describe('User Profile Update Validation (updateProfileValidation)', () => {
    it('should pass with valid allowed profile fields', async () => {
      const req = {
        body: {
          name: 'Alex Johnson',
          phone: '+1 555-0199',
          location: 'Austin, TX',
          college: 'University of Texas',
          degree: 'B.S. Computer Science',
          graduationYear: 2026,
          bio: 'Passionate about web applications and cloud architecture.',
          skills: 'javascript, react, node.js',
          github: 'https://github.com/alexjohnson',
          linkedin: 'https://linkedin.com/in/alexjohnson',
        },
      };

      const result = await runValidation(updateProfileValidation, req);
      expect(result.isEmpty()).toBe(true);
    });

    it('should reject modification of protected/forbidden fields', async () => {
      const forbiddenFields = [
        'password',
        'role',
        'resume',
        '_id',
        'createdAt',
        'updatedAt',
        'email',
      ];

      for (const field of forbiddenFields) {
        const req = {
          body: {
            name: 'Valid Name',
            [field]: 'tampered_value',
          },
        };

        const result = await runValidation(updateProfileValidation, req);
        expect(result.isEmpty()).toBe(false);
        expect(
          result.array().some((e) => e.msg.includes(`cannot be updated through the profile endpoint`))
        ).toBe(true);
      }
    });

    it('should reject graduationYear outside allowed bounds (1970 - 2040)', async () => {
      const reqLow = { body: { graduationYear: 1960 } };
      const resLow = await runValidation(updateProfileValidation, reqLow);
      expect(resLow.isEmpty()).toBe(false);
      expect(resLow.array().some((e) => e.path === 'graduationYear')).toBe(true);

      const reqHigh = { body: { graduationYear: 2050 } };
      const resHigh = await runValidation(updateProfileValidation, reqHigh);
      expect(resHigh.isEmpty()).toBe(false);
      expect(resHigh.array().some((e) => e.path === 'graduationYear')).toBe(true);
    });

    it('should reject bio exceeding 500 characters', async () => {
      const req = { body: { bio: 'A'.repeat(501) } };
      const result = await runValidation(updateProfileValidation, req);
      expect(result.isEmpty()).toBe(false);
      expect(result.array().some((e) => e.path === 'bio')).toBe(true);
    });

    it('should reject invalid GitHub or LinkedIn URL', async () => {
      const req = {
        body: {
          github: 'not-a-valid-url',
          linkedin: 'also-not-a-url',
        },
      };
      const result = await runValidation(updateProfileValidation, req);
      expect(result.isEmpty()).toBe(false);
      expect(result.array().some((e) => e.path === 'github')).toBe(true);
      expect(result.array().some((e) => e.path === 'linkedin')).toBe(true);
    });
  });
});
