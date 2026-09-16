import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDutyDto {
  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsOptional()
  @IsString()
  employeeName?: string;

  @IsOptional()
  @IsString()
  employeeMobile?: string;

  @IsOptional()
  @IsString()
  employeeEmail?: string;

  @IsNotEmpty({ message: 'Duty Date is required' })
  @IsString()
  dutyDate: string;

  @IsNotEmpty({ message: 'City is required' })
  @IsString()
  cityId: string;

  @IsNotEmpty({ message: 'Center is required' })
  @IsString()
  centerId: string;

  @IsNotEmpty({ message: 'Duty Type is required' })
  @IsString()
  dutyType: string; // 'Exam' | 'Mock'

  @IsNotEmpty({ message: 'Exam is required' })
  @IsString()
  examId: string;

  @IsNotEmpty({ message: 'Role is required' })
  @IsString()
  roleId: string;

  @IsNotEmpty({ message: 'Shift is required' })
  @IsString()
  shiftId: string;

  @IsOptional()
  @IsString()
  reportingTime?: string;

  @IsOptional()
  @IsString()
  shiftEndTime?: string;

  @IsOptional()
  @IsString()
  attendanceFileId?: string;
}

export class UpdateDutyDto {
  @IsOptional()
  @IsString()
  dutyDate?: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  centerId?: string;

  @IsOptional()
  @IsString()
  dutyType?: string;

  @IsOptional()
  @IsString()
  examId?: string;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsString()
  shiftId?: string;

  @IsOptional()
  @IsString()
  reportingTime?: string;

  @IsOptional()
  @IsString()
  shiftEndTime?: string;

  @IsOptional()
  @IsString()
  attendanceFileId?: string;
}
