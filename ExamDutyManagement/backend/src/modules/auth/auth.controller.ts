import { Controller, Post, Get, Body, Query, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsNotEmpty, Matches, IsOptional } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Resource ID is required' })
  resourceId: string;

  @IsNotEmpty({ message: 'Mobile number is required' })
  @Matches(/^\d{10}$/, { message: 'Mobile number must be exactly 10 digits' })
  mobile: string;

  @IsOptional()
  loginType?: 'admin' | 'employee';
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const employee = await this.authService.login(dto.resourceId, dto.mobile, dto.loginType);
    return {
      status: 'ok',
      message: 'Login successful',
      employee: {
        id: employee.id,
        resourceId: employee.resourceId,
        name: employee.name,
        mobile: employee.mobile,
        email: employee.email,
        city: employee.city,
        status: employee.status,
        role: employee.role,
        isAdmin: employee.isAdmin,
      },
    };
  }

  @Get('me')
  async getProfile(
    @Query('resourceId') resourceId?: string,
    @Headers('x-resource-id') headerResourceId?: string,
  ) {
    const idToLookup = headerResourceId || resourceId || '17655';
    const employee = await this.authService.getProfile(idToLookup);
    return {
      status: 'ok',
      employee: {
        id: employee.id,
        resourceId: employee.resourceId,
        name: employee.name,
        mobile: employee.mobile,
        email: employee.email,
        city: employee.city,
        status: employee.status,
      },
    };
  }
}
