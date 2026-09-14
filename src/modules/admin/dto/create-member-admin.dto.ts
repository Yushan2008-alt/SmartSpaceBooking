import { RegisterMemberDto } from '../../auth/dto/register-member.dto';

// Same shape as public member registration (username, password, profil).
export class CreateMemberAdminDto extends RegisterMemberDto {}
