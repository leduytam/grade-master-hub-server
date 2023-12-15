import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateStudentDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
