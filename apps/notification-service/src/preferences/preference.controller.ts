import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PreferenceService, UserPreference } from './preference.service';

@ApiTags('Preferences')
@Controller('api/v1/preferences')
export class PreferenceController {
  constructor(private readonly preferenceService: PreferenceService) {}

  @Post(':recipient')
  @ApiOperation({ summary: 'Update recipient delivery preferences' })
  async setPreference(
    @Param('recipient') recipient: string,
    @Headers('x-tenant-id') headerTenantId: string,
    @Body()
    body: {
      tenantId?: string;
      emailEnabled: boolean;
      smsEnabled: boolean;
      pushEnabled: boolean;
      marketingOptIn: boolean;
      quietHoursStart?: number;
      quietHoursEnd?: number;
    },
  ) {
    const tenantId = body.tenantId || headerTenantId || 'default-tenant';
    this.preferenceService.setPreference(tenantId, {
      recipient,
      ...body,
    });
    return { success: true, recipient };
  }

  @Get(':recipient')
  @ApiOperation({ summary: 'Get recipient delivery preferences' })
  async getPreference(
    @Param('recipient') recipient: string,
    @Headers('x-tenant-id') headerTenantId: string,
  ) {
    const tenantId = headerTenantId || 'default-tenant';
    return this.preferenceService.getPreference(tenantId, recipient);
  }
}

