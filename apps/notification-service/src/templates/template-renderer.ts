import { BadRequestException } from '@nestjs/common';

export class TemplateRenderer {
  static render(templateString: string, variables: Record<string, any> = {}): string {
    if (!templateString) return '';

    return templateString.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
      if (variables[key] === undefined || variables[key] === null) {
        throw new BadRequestException(
          `Missing required template variable: "${key}" required by template`,
        );
      }
      return String(variables[key]);
    });
  }

  static extractVariables(templateString: string): string[] {
    const matches = templateString.match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g);
    if (!matches) return [];
    return Array.from(
      new Set(matches.map((m) => m.replace(/\{\{\s*|\s*\}\}/g, ''))),
    );
  }
}

