import { Transform } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateCompositionOrderDto {
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  order: number;
}
