import { TemplateRenderer } from './template-renderer';
import { BadRequestException } from '@nestjs/common';

describe('TemplateRenderer', () => {
  it('should substitute valid variables', () => {
    const template = 'Hello {{name}}, your order #{{orderId}} is confirmed.';
    const result = TemplateRenderer.render(template, {
      name: 'Alice',
      orderId: '12345',
    });

    expect(result).toBe('Hello Alice, your order #12345 is confirmed.');
  });

  it('should throw BadRequestException when a required variable is missing', () => {
    const template = 'Hello {{name}}, your code is {{code}}.';
    expect(() =>
      TemplateRenderer.render(template, { name: 'Alice' }),
    ).toThrow(BadRequestException);
  });

  it('should extract variables from template string', () => {
    const template = 'Dear {{user}}, welcome to {{appName}}! Contact {{supportEmail}}.';
    const vars = TemplateRenderer.extractVariables(template);
    expect(vars).toEqual(['user', 'appName', 'supportEmail']);
  });
});

