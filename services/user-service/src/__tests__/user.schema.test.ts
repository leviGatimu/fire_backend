import { changePasswordSchema, createSchema } from '../validators/user.schema';

describe('user validators', () => {
  describe('changePasswordSchema', () => {
    it('rejects a weak newPassword', () => {
      const result = changePasswordSchema.safeParse({
        body: { currentPassword: 'whatever', newPassword: 'weak' },
      });
      expect(result.success).toBe(false);
    });

    it('accepts a strong newPassword', () => {
      const result = changePasswordSchema.safeParse({
        body: { currentPassword: 'whatever', newPassword: 'Str0ngPass' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('createSchema', () => {
    it("defaults role to 'USER' when omitted", () => {
      const result = createSchema.safeParse({
        body: {
          firstName: 'A',
          lastName: 'B',
          email: 'a@tzw.com',
          password: 'Str0ngPass',
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body.role).toBe('USER');
      }
    });
  });
});
