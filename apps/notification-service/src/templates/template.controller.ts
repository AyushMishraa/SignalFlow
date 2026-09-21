import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TemplateService } from './template.service';
import { NotificationChannel } from '@app/contracts';

@ApiTags('Templates')
@Controller('api/v1/templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new template version' })
  async createTemplate(
    @Headers('x-tenant-id') headerTenantId: string,
    @Body()
    body: {
      tenantId?: string;
      name: string;
      channel: NotificationChannel;
      subject?: string;
      body: string;
    },
  ) {
    const tenantId = body.tenantId || headerTenantId || 'default-tenant';
    return this.templateService.createTemplate(tenantId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List all templates for tenant' })
  async listTemplates(
    @Query('tenantId') queryTenantId?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
  ) {
    const tenantId = queryTenantId || headerTenantId || 'default-tenant';
    return this.templateService.listTemplates(tenantId);
  }

  @Post(':name/render')
  @ApiOperation({ summary: 'Render a template with variables' })
  async renderTemplate(
    @Param('name') name: string,
    @Headers('x-tenant-id') headerTenantId: string,
    @Body()
    body: {
      tenantId?: string;
      variables: Record<string, any>;
      version?: number;
    },
  ) {
    const tenantId = body.tenantId || headerTenantId || 'default-tenant';
    return this.templateService.renderTemplate(
      tenantId,
      name,
      body.variables,
      body.version,
    );
  }
}

