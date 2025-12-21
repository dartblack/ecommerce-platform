import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'admin' })
  role: string;
}

export class LoginResponseDataDto {
  @ApiProperty({ type: UserDto })
  user: UserDto;
  @ApiProperty()
  token: string;
  @ApiProperty({ example: 'Bearer' })
  tokenType: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Login successful' })
  message: string;

  @ApiProperty({ type: LoginResponseDataDto })
  data: LoginResponseDataDto;
}
