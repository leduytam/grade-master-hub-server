import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateClassAsAdminDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description: string;

  @IsUUID()
  teacherId: string;
}
