import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { IsPakistaniPhone } from '../../common/helpers/phone.util';

export class SendOtpDto {
  @IsString()
  @IsPakistaniPhone()
  phone: string;
}

export class VerifyOtpDto {
  @IsString()
  @IsPakistaniPhone()
  phone: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'OTP must be exactly 6 digits' })
  otp: string;
}

export class RegisterWorkerDto {
  @IsString()
  @IsPakistaniPhone()
  phone: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsString()
  @IsNotEmpty()
  verificationToken: string;
}

export class LoginDto {
  @IsString()
  @IsPakistaniPhone()
  phone: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
