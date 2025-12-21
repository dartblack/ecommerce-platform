export class JwtUserDto {
  iss: string;
  iat: number;
  exp: number;
  sub: number;
  email: string;
  role: string;
}
