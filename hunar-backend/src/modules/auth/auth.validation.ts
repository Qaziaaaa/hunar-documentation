import { IsString, MaxLength, MinLength } from 'class-validator';

// TEMPORARY auth DTO — replaced by Hakim Ullah's real OTP-based auth flow later.
export class LoginDto {
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;
}
