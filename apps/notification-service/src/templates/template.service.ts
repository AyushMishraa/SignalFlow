import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NotificationChannel } from '@app/contracts';
import { TemplateRenderer } from './template-renderer';

export interface NotificationTemplateRecord {
  id: string;
  tenantId: string;
  name: string;
  channel: NotificationChannel;
  version: number;
  isActive: boolean;
  subject?: string;
  body: string;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private readonly templates: NotificationTemplateRecord[] = [];

  createTemplate(
    tenantId: string,
    data: {
      name: string;
      channel: NotificationChannel;
      subject?: string;
      body: string;
    },
  ): NotificationTemplateRecord {
    const existingVersions = this.templates.filter(
      (t) => t.tenantId === tenantId && t.name === data.name,
    );

    const version = existingVersions.length + 1;
    // Deactivate previous versions
    existingVersions.forEach((t) => (t.isActive = false));

    const variables = [
      ...TemplateRenderer.extractVariables(data.body),
      ...(data.subject ? TemplateRenderer.extractVariables(data.subject) : []),
    ];

    const template: NotificationTemplateRecord = {
      id: randomUUID(),
      tenantId,
      name: data.name,
      channel: data.channel,
      version,
      isActive: true,
      subject: data.subject,
      body: data.body,
      variables,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.push(template);
    this.logger.log(`Created template "${template.name}" v${version} for tenant ${tenantId}`);
    return template;
  }

  getTemplate(tenantId: string, name: string, version?: number): NotificationTemplateRecord {
    const template = this.templates.find(
      (t) =>
        t.tenantId === tenantId &&
        t.name === name &&
        (version ? t.version === version : t.isActive),
    );

    if (!template) {
      throw new NotFoundException(`Template "${name}" (v${version || 'active'}) not found`);
    }

    return template;
  }

  renderTemplate(
    tenantId: string,
    name: string,
    variables: Record<string, any>,
    version?: number,
  ): { subject?: string; body: string } {
    const template = this.getTemplate(tenantId, name, version);

    const renderedBody = TemplateRenderer.render(template.body, variables);
    const renderedSubject = template.subject
      ? TemplateRenderer.render(template.subject, variables)
      : undefined;

    return {
      subject: renderedSubject,
      body: renderedBody,
    };
  }

  listTemplates(tenantId: string): NotificationTemplateRecord[] {
    return this.templates.filter((t) => t.tenantId === tenantId);
  }
}

